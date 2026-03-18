import { getMany, getOne } from '@/lib/db';
import { PlayerStats, Standing } from '@/types';

export interface DisciplinaryRecord {
  player_id: string;
  player_name: string;
  photo_url: string | null;
  team_name: string;
  team_logo: string | null;
  yellow_cards: number;
  red_cards: number;
  penalty_points: number;
}

export interface TeamFairPlay {
  team_id: string;
  team_name: string;
  logo_url: string | null;
  yellow_cards: number;
  red_cards: number;
  penalty_points: number;
}

export async function getPlayerStats(playerId: string, championshipId?: string): Promise<PlayerStats[]> {
  const conditions = ['pr.player_id = $1'];
  const params: any[] = [playerId];

  if (championshipId) {
    conditions.push('pr.championship_id = $2');
    params.push(championshipId);
  }

  return getMany<PlayerStats>(
    `SELECT
      pr.player_id,
      pr.championship_id,
      pr.team_id,
      p.name AS player_name,
      p.photo_url,
      p.position,
      t.name AS team_name,
      t.logo_url AS team_logo,
      c.name AS championship_name,
      c.year,
      pr.shirt_number,
      pr.bid_number,
      COALESCE(lineup_stats.matches_played, 0)::int AS matches_played,
      COALESCE(stats.goals, 0)::int AS goals,
      COALESCE(stats.penalty_goals, 0)::int AS penalty_goals,
      COALESCE(stats.own_goals, 0)::int AS own_goals,
      COALESCE(stats.yellow_cards, 0)::int AS yellow_cards,
      COALESCE(stats.red_cards, 0)::int AS red_cards
    FROM player_registrations pr
    JOIN players p ON p.id = pr.player_id
    JOIN teams t ON t.id = pr.team_id
    JOIN championships c ON c.id = pr.championship_id
    LEFT JOIN LATERAL (
      SELECT
        COUNT(DISTINCT ml.match_id) AS matches_played
      FROM match_lineups ml
      JOIN matches m ON m.id = ml.match_id AND m.championship_id = pr.championship_id AND m.status = 'Finalizada'
      WHERE ml.player_id = pr.player_id
    ) lineup_stats ON true
    LEFT JOIN LATERAL (
      SELECT
        SUM(CASE WHEN me.event_type = 'GOL' THEN 1 ELSE 0 END) AS goals,
        SUM(CASE WHEN me.event_type = 'GOL_PENALTI' THEN 1 ELSE 0 END) AS penalty_goals,
        SUM(CASE WHEN me.event_type = 'GOL_CONTRA' THEN 1 ELSE 0 END) AS own_goals,
        SUM(CASE WHEN me.event_type = 'CARTAO_AMARELO' THEN 1 ELSE 0 END) AS yellow_cards,
        SUM(CASE WHEN me.event_type IN ('CARTAO_VERMELHO', 'SEGUNDO_AMARELO') THEN 1 ELSE 0 END) AS red_cards
      FROM match_events me
      JOIN matches m ON m.id = me.match_id AND m.championship_id = pr.championship_id
      WHERE me.player_id = pr.player_id
    ) stats ON true
    WHERE ${conditions.join(' AND ')}
    ORDER BY c.year DESC`,
    params
  );
}

export async function getChampionshipStandings(championshipId: string): Promise<Standing[]> {
  const standings = await getMany<Standing>(
    `SELECT
      tc.championship_id,
      tc.team_id,
      t.name AS team_name,
      t.short_name,
      t.logo_url,
      tc.group_name,
      COUNT(m.id)::int AS matches_played,
      SUM(CASE
        WHEN (m.home_team_id = tc.team_id AND m.home_score > m.away_score)
          OR (m.away_team_id = tc.team_id AND m.away_score > m.home_score)
        THEN 1 ELSE 0
      END)::int AS wins,
      SUM(CASE WHEN m.home_score = m.away_score THEN 1 ELSE 0 END)::int AS draws,
      SUM(CASE
        WHEN (m.home_team_id = tc.team_id AND m.home_score < m.away_score)
          OR (m.away_team_id = tc.team_id AND m.away_score < m.home_score)
        THEN 1 ELSE 0
      END)::int AS losses,
      COALESCE(SUM(CASE
        WHEN m.home_team_id = tc.team_id THEN m.home_score
        WHEN m.away_team_id = tc.team_id THEN m.away_score
        ELSE 0
      END), 0)::int AS goals_for,
      COALESCE(SUM(CASE
        WHEN m.home_team_id = tc.team_id THEN m.away_score
        WHEN m.away_team_id = tc.team_id THEN m.home_score
        ELSE 0
      END), 0)::int AS goals_against,
      COALESCE(SUM(CASE
        WHEN (m.home_team_id = tc.team_id AND m.home_score > m.away_score)
          OR (m.away_team_id = tc.team_id AND m.away_score > m.home_score)
        THEN 3
        WHEN m.home_score = m.away_score THEN 1
        ELSE 0
      END), 0)::int AS points,
      COALESCE(cards.red_cards, 0)::int AS red_cards,
      COALESCE(cards.yellow_cards, 0)::int AS yellow_cards
    FROM team_championships tc
    JOIN teams t ON t.id = tc.team_id
    LEFT JOIN matches m ON m.championship_id = tc.championship_id
      AND (m.home_team_id = tc.team_id OR m.away_team_id = tc.team_id)
      AND m.status = 'Finalizada'
    LEFT JOIN LATERAL (
      SELECT
        SUM(CASE WHEN me.event_type IN ('CARTAO_VERMELHO', 'SEGUNDO_AMARELO') THEN 1 ELSE 0 END) AS red_cards,
        SUM(CASE WHEN me.event_type = 'CARTAO_AMARELO' THEN 1 ELSE 0 END) AS yellow_cards
      FROM match_events me
      JOIN matches m2 ON m2.id = me.match_id AND m2.championship_id = tc.championship_id AND m2.status = 'Finalizada'
      WHERE me.team_id = tc.team_id
        AND me.event_type IN ('CARTAO_AMARELO', 'CARTAO_VERMELHO', 'SEGUNDO_AMARELO')
    ) cards ON true
    WHERE tc.championship_id = $1
    GROUP BY tc.championship_id, tc.team_id, t.name, t.short_name, t.logo_url, tc.group_name, cards.red_cards, cards.yellow_cards
    ORDER BY
      points DESC,
      wins DESC,
      (COALESCE(SUM(CASE WHEN m.home_team_id = tc.team_id THEN m.home_score WHEN m.away_team_id = tc.team_id THEN m.away_score ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN m.home_team_id = tc.team_id THEN m.away_score WHEN m.away_team_id = tc.team_id THEN m.home_score ELSE 0 END), 0)) DESC,
      goals_for DESC,
      COALESCE(cards.red_cards, 0) ASC,
      COALESCE(cards.yellow_cards, 0) ASC`,
    [championshipId]
  );

  return applyHeadToHeadTiebreaker(standings, championshipId);
}

async function getHeadToHeadPoints(
  championshipId: string,
  teamAId: string,
  teamBId: string
): Promise<{ teamAPoints: number; teamBPoints: number }> {
  const matches = await getMany<{
    home_team_id: string;
    away_team_id: string;
    home_score: number;
    away_score: number;
  }>(
    `SELECT home_team_id, away_team_id, home_score, away_score
     FROM matches
     WHERE championship_id = $1
       AND status = 'Finalizada'
       AND (
         (home_team_id = $2 AND away_team_id = $3)
         OR (home_team_id = $3 AND away_team_id = $2)
       )`,
    [championshipId, teamAId, teamBId]
  );

  let teamAPoints = 0;
  let teamBPoints = 0;

  for (const m of matches) {
    const aIsHome = m.home_team_id === teamAId;
    const aScore = aIsHome ? m.home_score : m.away_score;
    const bScore = aIsHome ? m.away_score : m.home_score;

    if (aScore > bScore) {
      teamAPoints += 3;
    } else if (aScore < bScore) {
      teamBPoints += 3;
    } else {
      teamAPoints += 1;
      teamBPoints += 1;
    }
  }

  return { teamAPoints, teamBPoints };
}

async function applyHeadToHeadTiebreaker(
  standings: Standing[],
  championshipId: string
): Promise<Standing[]> {
  const goalDiff = (s: Standing) => s.goals_for - s.goals_against;

  const isTied = (a: Standing, b: Standing) =>
    a.points === b.points &&
    a.wins === b.wins &&
    goalDiff(a) === goalDiff(b) &&
    a.goals_for === b.goals_for;

  // Group consecutive tied teams
  const result: Standing[] = [];
  let i = 0;

  while (i < standings.length) {
    let j = i + 1;
    while (j < standings.length && isTied(standings[i], standings[j])) {
      j++;
    }

    const group = standings.slice(i, j);

    if (group.length === 2) {
      // Head-to-head only applies when exactly 2 teams are tied
      const h2h = await getHeadToHeadPoints(
        championshipId,
        group[0].team_id,
        group[1].team_id
      );

      if (h2h.teamAPoints < h2h.teamBPoints) {
        result.push(group[1], group[0]);
      } else {
        // If equal or A wins, keep original order (A already ahead by cards criteria)
        result.push(...group);
      }
    } else {
      // 1 team or 3+ tied: keep SQL order (cards tiebreaker already applied)
      result.push(...group);
    }

    i = j;
  }

  return result;
}

export async function getTopScorers(championshipId: string, limit = 10): Promise<any[]> {
  return getMany(
    `SELECT
      p.id AS player_id, p.name AS player_name, p.photo_url,
      t.name AS team_name, t.logo_url AS team_logo,
      COUNT(*) FILTER (WHERE me.event_type IN ('GOL', 'GOL_PENALTI'))::int AS goals
    FROM match_events me
    JOIN matches m ON m.id = me.match_id AND m.championship_id = $1
    JOIN players p ON p.id = me.player_id
    JOIN teams t ON t.id = me.team_id
    WHERE me.event_type IN ('GOL', 'GOL_PENALTI')
    GROUP BY p.id, p.name, p.photo_url, t.name, t.logo_url
    ORDER BY goals DESC
    LIMIT $2`,
    [championshipId, limit]
  );
}

export async function getDisciplinaryRanking(championshipId: string, limit = 20): Promise<DisciplinaryRecord[]> {
  return getMany<DisciplinaryRecord>(
    `SELECT
      p.id AS player_id, p.name AS player_name, p.photo_url,
      t.name AS team_name, t.logo_url AS team_logo,
      SUM(CASE WHEN me.event_type = 'CARTAO_AMARELO' THEN 1 ELSE 0 END)::int AS yellow_cards,
      SUM(CASE WHEN me.event_type IN ('CARTAO_VERMELHO', 'SEGUNDO_AMARELO') THEN 1 ELSE 0 END)::int AS red_cards,
      (SUM(CASE WHEN me.event_type = 'CARTAO_AMARELO' THEN 1 ELSE 0 END)
       + SUM(CASE WHEN me.event_type IN ('CARTAO_VERMELHO', 'SEGUNDO_AMARELO') THEN 3 ELSE 0 END))::int AS penalty_points
    FROM match_events me
    JOIN matches m ON m.id = me.match_id AND m.championship_id = $1
    JOIN players p ON p.id = me.player_id
    JOIN teams t ON t.id = me.team_id
    WHERE me.event_type IN ('CARTAO_AMARELO', 'CARTAO_VERMELHO', 'SEGUNDO_AMARELO')
    GROUP BY p.id, p.name, p.photo_url, t.name, t.logo_url
    ORDER BY penalty_points DESC, red_cards DESC, yellow_cards DESC
    LIMIT $2`,
    [championshipId, limit]
  );
}

export async function getTeamFairPlayRanking(championshipId: string): Promise<TeamFairPlay[]> {
  return getMany<TeamFairPlay>(
    `SELECT
      t.id AS team_id, t.name AS team_name, t.logo_url,
      COALESCE(SUM(CASE WHEN me.event_type = 'CARTAO_AMARELO' THEN 1 ELSE 0 END), 0)::int AS yellow_cards,
      COALESCE(SUM(CASE WHEN me.event_type IN ('CARTAO_VERMELHO', 'SEGUNDO_AMARELO') THEN 1 ELSE 0 END), 0)::int AS red_cards,
      COALESCE(SUM(CASE WHEN me.event_type = 'CARTAO_AMARELO' THEN 1 ELSE 0 END)
       + SUM(CASE WHEN me.event_type IN ('CARTAO_VERMELHO', 'SEGUNDO_AMARELO') THEN 3 ELSE 0 END), 0)::int AS penalty_points
    FROM team_championships tc
    JOIN teams t ON t.id = tc.team_id
    LEFT JOIN match_events me ON me.team_id = t.id
      AND me.event_type IN ('CARTAO_AMARELO', 'CARTAO_VERMELHO', 'SEGUNDO_AMARELO')
      AND me.match_id IN (SELECT id FROM matches WHERE championship_id = $1)
    WHERE tc.championship_id = $1
    GROUP BY t.id, t.name, t.logo_url
    ORDER BY penalty_points ASC`,
    [championshipId]
  );
}

export async function getPlayerCareerStats(playerId: string): Promise<{
  total_matches: number;
  total_goals: number;
  total_yellow_cards: number;
  total_red_cards: number;
}> {
  const result = await getOne<any>(
    `SELECT
      COALESCE((SELECT COUNT(DISTINCT ml.match_id) FROM match_lineups ml JOIN matches m ON m.id = ml.match_id AND m.status = 'Finalizada' WHERE ml.player_id = $1), 0)::int AS total_matches,
      COALESCE(SUM(CASE WHEN me.event_type IN ('GOL', 'GOL_PENALTI') THEN 1 ELSE 0 END), 0)::int AS total_goals,
      COALESCE(SUM(CASE WHEN me.event_type = 'CARTAO_AMARELO' THEN 1 ELSE 0 END), 0)::int AS total_yellow_cards,
      COALESCE(SUM(CASE WHEN me.event_type IN ('CARTAO_VERMELHO', 'SEGUNDO_AMARELO') THEN 1 ELSE 0 END), 0)::int AS total_red_cards
    FROM match_events me
    WHERE me.player_id = $1`,
    [playerId]
  );
  return result || { total_matches: 0, total_goals: 0, total_yellow_cards: 0, total_red_cards: 0 };
}
