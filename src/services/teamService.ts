import { query, getOne, getMany } from '@/lib/db';
import { Team, PaginatedResponse } from '@/types';
import { buildPaginationQuery } from '@/lib/utils';

interface TeamFilters {
  search?: string;
  active?: boolean;
  demoOnly?: boolean;
  page?: number;
  limit?: number;
}

export async function listTeams(filters: TeamFilters = {}): Promise<PaginatedResponse<Team>> {
  const { page = 1, limit = 20 } = filters;
  const { offset, limit: safeLimit } = buildPaginationQuery(page, limit);

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (filters.search) {
    conditions.push(`(name ILIKE $${paramIndex} OR short_name ILIKE $${paramIndex})`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  if (filters.active !== undefined) {
    conditions.push(`active = $${paramIndex}`);
    params.push(filters.active);
    paramIndex++;
  }

  if (filters.demoOnly) {
    conditions.push(`is_demo = true`);
  } else {
    conditions.push(`(is_demo IS NOT TRUE)`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(`SELECT COUNT(*) FROM teams ${where}`, params);
  const total = parseInt(countResult.rows[0].count);

  const data = await getMany<Team>(
    `SELECT * FROM teams ${where} ORDER BY name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, safeLimit, offset]
  );

  return { data, total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) };
}

export async function getAllTeams(demoOnly = false): Promise<Team[]> {
  const demoFilter = demoOnly ? ' AND is_demo = true' : ' AND (is_demo IS NOT TRUE)';
  return getMany<Team>(`SELECT * FROM teams WHERE active = true${demoFilter} ORDER BY name ASC`);
}

export async function getTeamById(id: string): Promise<Team | null> {
  return getOne<Team>('SELECT * FROM teams WHERE id = $1', [id]);
}

export async function createTeam(data: Partial<Team>): Promise<Team> {
  const result = await getOne<Team>(
    `INSERT INTO teams (name, short_name, logo_url, primary_color, secondary_color, city, state, founded_year, contact_name, contact_phone, notes, instagram, bio)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [
      data.name, data.short_name || null, data.logo_url || null,
      data.primary_color || null, data.secondary_color || null,
      data.city || 'Itapecerica', data.state || 'MG',
      data.founded_year || null, data.contact_name || null,
      data.contact_phone || null, data.notes || null,
      data.instagram || null, data.bio || null,
    ]
  );
  return result!;
}

export async function updateTeam(id: string, data: Partial<Team>): Promise<Team | null> {
  return getOne<Team>(
    `UPDATE teams SET
      name = COALESCE($2, name),
      short_name = $3,
      logo_url = COALESCE($4, logo_url),
      primary_color = $5,
      secondary_color = $6,
      city = COALESCE($7, city),
      state = COALESCE($8, state),
      founded_year = $9,
      contact_name = $10,
      contact_phone = $11,
      active = COALESCE($12, active),
      notes = $13,
      instagram = $14,
      bio = $15
     WHERE id = $1 RETURNING *`,
    [
      id, data.name, data.short_name ?? null, data.logo_url,
      data.primary_color ?? null, data.secondary_color ?? null,
      data.city, data.state, data.founded_year ?? null,
      data.contact_name ?? null, data.contact_phone ?? null,
      data.active, data.notes ?? null,
      data.instagram ?? null, data.bio ?? null,
    ]
  );
}

export async function deleteTeam(id: string): Promise<{ ok: boolean; error?: string }> {
  // Check for matches
  const matches = await getOne<{ count: number }>('SELECT COUNT(*)::int AS count FROM matches WHERE home_team_id = $1 OR away_team_id = $1', [id]);
  if (matches && matches.count > 0) {
    return { ok: false, error: `Time possui ${matches.count} partida(s) registrada(s). Remova as partidas antes de excluir.` };
  }

  // Check for match events
  const events = await getOne<{ count: number }>('SELECT COUNT(*)::int AS count FROM match_events WHERE team_id = $1', [id]);
  if (events && events.count > 0) {
    return { ok: false, error: `Time possui ${events.count} evento(s) em partidas. Remova os eventos antes de excluir.` };
  }

  // Check for championships enrolled
  const champs = await getOne<{ count: number }>('SELECT COUNT(*)::int AS count FROM team_championships WHERE team_id = $1', [id]);
  if (champs && champs.count > 0) {
    return { ok: false, error: `Time esta inscrito em ${champs.count} campeonato(s). Remova as inscricoes antes de excluir.` };
  }

  const result = await query('DELETE FROM teams WHERE id = $1', [id]);
  return { ok: (result.rowCount ?? 0) > 0 };
}
