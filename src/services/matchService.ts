import { query, getOne, getMany } from '@/lib/db';
import { Match, PaginatedResponse } from '@/types';
import { buildPaginationQuery } from '@/lib/utils';

interface MatchFilters {
  championship_id?: string;
  team_id?: string;
  status?: string;
  match_round?: string;
  page?: number;
  limit?: number;
}

const MATCH_SELECT = `
  m.*,
  ht.name AS home_team_name, ht.logo_url AS home_team_logo, ht.short_name AS home_team_short,
  at.name AS away_team_name, at.logo_url AS away_team_logo, at.short_name AS away_team_short,
  c.name AS championship_name,
  r.name AS referee_name,
  ar1.name AS assistant_referee_1_name,
  ar2.name AS assistant_referee_2_name
`;

const MATCH_JOINS = `
  FROM matches m
  JOIN teams ht ON ht.id = m.home_team_id
  JOIN teams at ON at.id = m.away_team_id
  JOIN championships c ON c.id = m.championship_id
  LEFT JOIN referees r ON r.id = m.referee_id
  LEFT JOIN referees ar1 ON ar1.id = m.assistant_referee_1_id
  LEFT JOIN referees ar2 ON ar2.id = m.assistant_referee_2_id
`;

export async function listMatches(filters: MatchFilters = {}): Promise<PaginatedResponse<Match>> {
  const { page = 1, limit = 20 } = filters;
  const { offset, limit: safeLimit } = buildPaginationQuery(page, limit);

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (filters.championship_id) {
    conditions.push(`m.championship_id = $${paramIndex}`);
    params.push(filters.championship_id);
    paramIndex++;
  }

  if (filters.team_id) {
    conditions.push(`(m.home_team_id = $${paramIndex} OR m.away_team_id = $${paramIndex})`);
    params.push(filters.team_id);
    paramIndex++;
  }

  if (filters.status) {
    conditions.push(`m.status = $${paramIndex}`);
    params.push(filters.status);
    paramIndex++;
  }

  if (filters.match_round) {
    conditions.push(`m.match_round = $${paramIndex}`);
    params.push(filters.match_round);
    paramIndex++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(`SELECT COUNT(*) ${MATCH_JOINS} ${where}`, params);
  const total = parseInt(countResult.rows[0].count);

  const data = await getMany<Match>(
    `SELECT ${MATCH_SELECT} ${MATCH_JOINS} ${where} ORDER BY m.match_date DESC NULLS LAST LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, safeLimit, offset]
  );

  return { data, total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) };
}

export async function getMatchById(id: string): Promise<Match | null> {
  return getOne<Match>(
    `SELECT ${MATCH_SELECT} ${MATCH_JOINS} WHERE m.id = $1`,
    [id]
  );
}

export async function getMatchesByPlayer(playerId: string, championshipId?: string): Promise<Match[]> {
  const conditions = [`(me.player_id = $1)`];
  const params: any[] = [playerId];

  if (championshipId) {
    conditions.push(`m.championship_id = $2`);
    params.push(championshipId);
  }

  return getMany<Match>(
    `SELECT DISTINCT ${MATCH_SELECT}
     FROM matches m
     JOIN teams ht ON ht.id = m.home_team_id
     JOIN teams at ON at.id = m.away_team_id
     JOIN championships c ON c.id = m.championship_id
     JOIN match_events me ON me.match_id = m.id
     WHERE ${conditions.join(' AND ')}
     ORDER BY m.match_date DESC`,
    params
  );
}

export async function createMatch(data: Partial<Match>): Promise<Match> {
  const result = await getOne<Match>(
    `INSERT INTO matches (championship_id, home_team_id, away_team_id, home_score, away_score, match_date, match_round, venue, referee, assistant_referee_1, assistant_referee_2, referee_id, assistant_referee_1_id, assistant_referee_2_id, status, observations)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     RETURNING *`,
    [
      data.championship_id, data.home_team_id, data.away_team_id,
      data.home_score ?? null, data.away_score ?? null,
      data.match_date || null, data.match_round || null, data.venue || null,
      data.referee || null, data.assistant_referee_1 || null,
      data.assistant_referee_2 || null,
      data.referee_id || null, data.assistant_referee_1_id || null,
      data.assistant_referee_2_id || null,
      data.status || 'Agendada',
      data.observations || null,
    ]
  );
  return result!;
}

export async function updateMatch(id: string, data: Partial<Match>): Promise<Match | null> {
  return getOne<Match>(
    `UPDATE matches SET
      championship_id = COALESCE($2, championship_id),
      home_team_id = COALESCE($3, home_team_id),
      away_team_id = COALESCE($4, away_team_id),
      home_score = $5,
      away_score = $6,
      match_date = $7,
      match_round = $8,
      venue = $9,
      referee = $10,
      assistant_referee_1 = $11,
      assistant_referee_2 = $12,
      referee_id = $13,
      assistant_referee_1_id = $14,
      assistant_referee_2_id = $15,
      status = COALESCE($16, status),
      observations = $17,
      streaming_url = $18,
      highlights_url = $19,
      is_featured = COALESCE($20, is_featured),
      voting_open = COALESCE($21, voting_open),
      voting_deadline = $22
     WHERE id = $1 RETURNING *`,
    [
      id, data.championship_id, data.home_team_id, data.away_team_id,
      data.home_score ?? null, data.away_score ?? null,
      data.match_date ?? null, data.match_round ?? null, data.venue ?? null,
      data.referee ?? null, data.assistant_referee_1 ?? null,
      data.assistant_referee_2 ?? null,
      data.referee_id ?? null, data.assistant_referee_1_id ?? null,
      data.assistant_referee_2_id ?? null,
      data.status,
      data.observations ?? null,
      data.streaming_url ?? null, data.highlights_url ?? null,
      data.is_featured, data.voting_open,
      data.voting_deadline ?? null,
    ]
  );
}

export async function deleteMatch(id: string): Promise<boolean> {
  const result = await query('DELETE FROM matches WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
