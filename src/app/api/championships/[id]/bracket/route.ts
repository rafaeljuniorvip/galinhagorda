import { NextRequest, NextResponse } from 'next/server';
import { getMany, getOne, query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface BracketMatch {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_team_name: string;
  away_team_name: string;
  home_short: string | null;
  away_short: string | null;
  home_logo: string | null;
  away_logo: string | null;
  home_score: number | null;
  away_score: number | null;
  match_date: string | null;
  match_round: string;
  status: string;
}

interface StandingRow {
  team_id: string;
  team_name: string;
  short_name: string | null;
  position: number;
}

function computeAggregateWinner(leg1: BracketMatch | undefined, leg2: BracketMatch | undefined): string | null {
  if (!leg1 || !leg2) return null;
  if (leg1.status !== 'Finalizada' || leg2.status !== 'Finalizada') return null;

  const h1 = leg1.home_score ?? 0;
  const a1 = leg1.away_score ?? 0;
  const h2 = leg2.home_score ?? 0;
  const a2 = leg2.away_score ?? 0;

  // leg1: TeamA (home) vs TeamB (away)
  // leg2: TeamB (home) vs TeamA (away)
  const teamATotal = h1 + a2; // TeamA scored at home in leg1 + away in leg2
  const teamBTotal = a1 + h2; // TeamB scored away in leg1 + home in leg2

  if (teamATotal > teamBTotal) return leg1.home_team_id;
  if (teamBTotal > teamATotal) return leg1.away_team_id;

  // Tiebreaker: away goals rule
  const teamAAwayGoals = a2; // TeamA's away goals (leg2 as away)
  const teamBAwayGoals = a1; // TeamB's away goals (leg1 as away)
  if (teamAAwayGoals > teamBAwayGoals) return leg1.home_team_id;
  if (teamBAwayGoals > teamAAwayGoals) return leg1.away_team_id;

  return null; // True draw - needs penalties (handled manually)
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const championshipId = params.id;

  // Get all bracket matches (Semifinal and Final)
  const matches = await getMany<BracketMatch>(
    `SELECT m.id, m.home_team_id, m.away_team_id,
      ht.name AS home_team_name, at.name AS away_team_name,
      ht.short_name AS home_short, at.short_name AS away_short,
      ht.logo_url AS home_logo, at.logo_url AS away_logo,
      m.home_score, m.away_score, m.match_date, m.match_round, m.status
    FROM matches m
    JOIN teams ht ON ht.id = m.home_team_id
    JOIN teams at ON at.id = m.away_team_id
    WHERE m.championship_id = $1
      AND m.match_round LIKE ANY(ARRAY['Semifinal%', 'Final%'])
    ORDER BY m.match_date ASC`,
    [championshipId]
  );

  // Get standings for top 4
  const standings = await getMany<StandingRow>(
    `SELECT tc.team_id, t.name AS team_name, t.short_name,
      ROW_NUMBER() OVER (ORDER BY
        COALESCE(SUM(CASE
          WHEN (m.home_team_id = tc.team_id AND m.home_score > m.away_score)
            OR (m.away_team_id = tc.team_id AND m.away_score > m.home_score) THEN 3
          WHEN m.home_score = m.away_score THEN 1 ELSE 0
        END), 0) DESC,
        COALESCE(SUM(CASE
          WHEN (m.home_team_id = tc.team_id AND m.home_score > m.away_score)
            OR (m.away_team_id = tc.team_id AND m.away_score > m.home_score) THEN 1 ELSE 0
        END), 0) DESC,
        (COALESCE(SUM(CASE WHEN m.home_team_id = tc.team_id THEN m.home_score WHEN m.away_team_id = tc.team_id THEN m.away_score ELSE 0 END), 0)
         - COALESCE(SUM(CASE WHEN m.home_team_id = tc.team_id THEN m.away_score WHEN m.away_team_id = tc.team_id THEN m.home_score ELSE 0 END), 0)) DESC,
        COALESCE(SUM(CASE WHEN m.home_team_id = tc.team_id THEN m.home_score WHEN m.away_team_id = tc.team_id THEN m.away_score ELSE 0 END), 0) DESC
      )::int AS position
    FROM team_championships tc
    JOIN teams t ON t.id = tc.team_id
    LEFT JOIN matches m ON m.championship_id = tc.championship_id
      AND (m.home_team_id = tc.team_id OR m.away_team_id = tc.team_id)
      AND m.status = 'Finalizada'
      AND m.match_round NOT LIKE 'Semifinal%'
      AND m.match_round NOT LIKE 'Final%'
    WHERE tc.championship_id = $1
    GROUP BY tc.team_id, t.name, t.short_name
    LIMIT 4`,
    [championshipId]
  );

  // Organize bracket
  const semi1Ida = matches.find(m => m.match_round === 'Semifinal - Ida' && standings.length >= 4 &&
    ((m.home_team_id === standings[0]?.team_id && m.away_team_id === standings[3]?.team_id) ||
     (m.home_team_id === standings[3]?.team_id && m.away_team_id === standings[0]?.team_id)));
  const semi1Volta = matches.find(m => m.match_round === 'Semifinal - Volta' && semi1Ida &&
    (m.home_team_id === semi1Ida.away_team_id && m.away_team_id === semi1Ida.home_team_id));

  const semi2Ida = matches.find(m => m.match_round === 'Semifinal - Ida' && m.id !== semi1Ida?.id);
  const semi2Volta = matches.find(m => m.match_round === 'Semifinal - Volta' && m.id !== semi1Volta?.id);

  const semi1Winner = computeAggregateWinner(semi1Ida, semi1Volta);
  const semi2Winner = computeAggregateWinner(semi2Ida, semi2Volta);

  const finalIda = matches.find(m => m.match_round === 'Final - Ida');
  const finalVolta = matches.find(m => m.match_round === 'Final - Volta');
  const champion = computeAggregateWinner(finalIda, finalVolta);

  return NextResponse.json({
    standings: standings.slice(0, 4),
    semifinals: {
      match1: { ida: semi1Ida || null, volta: semi1Volta || null, winner: semi1Winner },
      match2: { ida: semi2Ida || null, volta: semi2Volta || null, winner: semi2Winner },
    },
    finals: {
      ida: finalIda || null,
      volta: finalVolta || null,
      champion,
    },
    hasMatches: matches.length > 0,
  });
}

// POST: Generate bracket matches
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

  const body = await request.json();
  const { phase, date1, date2 } = body; // phase: 'semifinals' | 'finals'
  const championshipId = params.id;

  if (phase === 'semifinals') {
    // Check if semifinals already exist
    const existing = await getMany('SELECT id FROM matches WHERE championship_id = $1 AND match_round LIKE \'Semifinal%\'', [championshipId]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Semifinais ja foram geradas. Exclua as partidas existentes para gerar novamente.' }, { status: 409 });
    }

    // Get top 4 from standings (excluding bracket matches)
    const top4 = await getMany<{ team_id: string }>(
      `SELECT tc.team_id
      FROM team_championships tc
      JOIN teams t ON t.id = tc.team_id
      LEFT JOIN matches m ON m.championship_id = tc.championship_id
        AND (m.home_team_id = tc.team_id OR m.away_team_id = tc.team_id)
        AND m.status = 'Finalizada'
        AND m.match_round NOT LIKE 'Semifinal%'
        AND m.match_round NOT LIKE 'Final%'
      WHERE tc.championship_id = $1
      GROUP BY tc.team_id, t.name
      ORDER BY
        COALESCE(SUM(CASE WHEN (m.home_team_id = tc.team_id AND m.home_score > m.away_score) OR (m.away_team_id = tc.team_id AND m.away_score > m.home_score) THEN 3 WHEN m.home_score = m.away_score THEN 1 ELSE 0 END), 0) DESC,
        COALESCE(SUM(CASE WHEN (m.home_team_id = tc.team_id AND m.home_score > m.away_score) OR (m.away_team_id = tc.team_id AND m.away_score > m.home_score) THEN 1 ELSE 0 END), 0) DESC,
        (COALESCE(SUM(CASE WHEN m.home_team_id = tc.team_id THEN m.home_score WHEN m.away_team_id = tc.team_id THEN m.away_score ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN m.home_team_id = tc.team_id THEN m.away_score WHEN m.away_team_id = tc.team_id THEN m.home_score ELSE 0 END), 0)) DESC,
        COALESCE(SUM(CASE WHEN m.home_team_id = tc.team_id THEN m.home_score WHEN m.away_team_id = tc.team_id THEN m.away_score ELSE 0 END), 0) DESC
      LIMIT 4`,
      [championshipId]
    );

    if (top4.length < 4) {
      return NextResponse.json({ error: 'Necessario pelo menos 4 times classificados.' }, { status: 400 });
    }

    const first = top4[0].team_id;
    const second = top4[1].team_id;
    const third = top4[2].team_id;
    const fourth = top4[3].team_id;

    // 1st vs 4th, 2nd vs 3rd (ida e volta)
    await query(
      `INSERT INTO matches (championship_id, home_team_id, away_team_id, match_date, match_round, status) VALUES
        ($1, $2, $3, $4, 'Semifinal - Ida', 'Agendada'),
        ($1, $5, $6, $4, 'Semifinal - Ida', 'Agendada'),
        ($1, $3, $2, $7, 'Semifinal - Volta', 'Agendada'),
        ($1, $6, $5, $7, 'Semifinal - Volta', 'Agendada')`,
      [championshipId, first, fourth, date1 || null, second, third, date2 || null]
    );

    return NextResponse.json({ ok: true, message: 'Semifinais geradas com sucesso' });
  }

  if (phase === 'finals') {
    const existing = await getMany('SELECT id FROM matches WHERE championship_id = $1 AND match_round LIKE \'Final%\'', [championshipId]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Final ja foi gerada. Exclua as partidas existentes para gerar novamente.' }, { status: 409 });
    }

    // Get semifinal results to determine winners
    const semis = await getMany<BracketMatch>(
      `SELECT m.id, m.home_team_id, m.away_team_id,
        ht.name AS home_team_name, at.name AS away_team_name,
        ht.short_name AS home_short, at.short_name AS away_short,
        ht.logo_url AS home_logo, at.logo_url AS away_logo,
        m.home_score, m.away_score, m.match_date, m.match_round, m.status
      FROM matches m
      JOIN teams ht ON ht.id = m.home_team_id
      JOIN teams at ON at.id = m.away_team_id
      WHERE m.championship_id = $1 AND m.match_round LIKE 'Semifinal%'
      ORDER BY m.match_date ASC`,
      [championshipId]
    );

    const semi1Ida = semis.find(m => m.match_round === 'Semifinal - Ida');
    const semi1Volta = semis.find(m => m.match_round === 'Semifinal - Volta' && semi1Ida &&
      m.home_team_id === semi1Ida.away_team_id);
    const semi2Ida = semis.find(m => m.match_round === 'Semifinal - Ida' && m.id !== semi1Ida?.id);
    const semi2Volta = semis.find(m => m.match_round === 'Semifinal - Volta' && m.id !== semi1Volta?.id);

    const winner1 = computeAggregateWinner(semi1Ida, semi1Volta);
    const winner2 = computeAggregateWinner(semi2Ida, semi2Volta);

    if (!winner1 || !winner2) {
      return NextResponse.json({ error: 'Semifinais ainda nao foram finalizadas ou resultado empatado (definir nos penaltis manualmente).' }, { status: 400 });
    }

    await query(
      `INSERT INTO matches (championship_id, home_team_id, away_team_id, match_date, match_round, status) VALUES
        ($1, $2, $3, $4, 'Final - Ida', 'Agendada'),
        ($1, $3, $2, $5, 'Final - Volta', 'Agendada')`,
      [championshipId, winner1, winner2, date1 || null, date2 || null]
    );

    return NextResponse.json({ ok: true, message: 'Final gerada com sucesso' });
  }

  return NextResponse.json({ error: 'Fase invalida' }, { status: 400 });
}
