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
      COALESCE(stats.matches_played, 0)::int AS matches_played,
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
        COUNT(DISTINCT me.match_id) AS matches_played,
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
  return getMany<Standing>(
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
      END), 0)::int AS points
    FROM team_championships tc
    JOIN teams t ON t.id = tc.team_id
    LEFT JOIN matches m ON m.championship_id = tc.championship_id
      AND (m.home_team_id = tc.team_id OR m.away_team_id = tc.team_id)
      AND m.status = 'Finalizada'
    WHERE tc.championship_id = $1
    GROUP BY tc.championship_id, tc.team_id, t.name, t.short_name, t.logo_url, tc.group_name
    ORDER BY points DESC, wins DESC,
      (COALESCE(SUM(CASE WHEN m.home_team_id = tc.team_id THEN m.home_score WHEN m.away_team_id = tc.team_id THEN m.away_score ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN m.home_team_id = tc.team_id THEN m.away_score WHEN m.away_team_id = tc.team_id THEN m.home_score ELSE 0 END), 0)) DESC`,
    [championshipId]
  );
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
      COALESCE(COUNT(DISTINCT me.match_id), 0)::int AS total_matches,
      COALESCE(SUM(CASE WHEN me.event_type IN ('GOL', 'GOL_PENALTI') THEN 1 ELSE 0 END), 0)::int AS total_goals,
      COALESCE(SUM(CASE WHEN me.event_type = 'CARTAO_AMARELO' THEN 1 ELSE 0 END), 0)::int AS total_yellow_cards,
      COALESCE(SUM(CASE WHEN me.event_type IN ('CARTAO_VERMELHO', 'SEGUNDO_AMARELO') THEN 1 ELSE 0 END), 0)::int AS total_red_cards
    FROM match_events me
    WHERE me.player_id = $1`,
    [playerId]
  );
  return result || { total_matches: 0, total_goals: 0, total_yellow_cards: 0, total_red_cards: 0 };
}
