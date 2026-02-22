import { query, getOne, getMany } from '@/lib/db';
import { Championship, PaginatedResponse } from '@/types';
import { buildPaginationQuery } from '@/lib/utils';

interface ChampionshipFilters {
  search?: string;
  year?: number;
  status?: string;
  active?: boolean;
  page?: number;
  limit?: number;
}

export async function listChampionships(filters: ChampionshipFilters = {}): Promise<PaginatedResponse<Championship>> {
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

  if (filters.year) {
    conditions.push(`year = $${paramIndex}`);
    params.push(filters.year);
    paramIndex++;
  }

  if (filters.status) {
    conditions.push(`status = $${paramIndex}`);
    params.push(filters.status);
    paramIndex++;
  }

  if (filters.active !== undefined) {
    conditions.push(`active = $${paramIndex}`);
    params.push(filters.active);
    paramIndex++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(`SELECT COUNT(*) FROM championships ${where}`, params);
  const total = parseInt(countResult.rows[0].count);

  const data = await getMany<Championship>(
    `SELECT * FROM championships ${where} ORDER BY year DESC, name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, safeLimit, offset]
  );

  return { data, total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) };
}

export async function getAllChampionships(): Promise<Championship[]> {
  return getMany<Championship>('SELECT * FROM championships WHERE active = true ORDER BY year DESC, name ASC');
}

export async function getChampionshipById(id: string): Promise<Championship | null> {
  return getOne<Championship>('SELECT * FROM championships WHERE id = $1', [id]);
}

export async function createChampionship(data: Partial<Championship>): Promise<Championship> {
  const result = await getOne<Championship>(
    `INSERT INTO championships (name, short_name, year, season, category, format, description, rules, start_date, end_date, status, logo_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      data.name, data.short_name || null, data.year, data.season || '1',
      data.category || 'Principal', data.format || 'Pontos Corridos',
      data.description || null, data.rules || null,
      data.start_date || null, data.end_date || null,
      data.status || 'Planejado', data.logo_url || null,
    ]
  );
  return result!;
}

export async function updateChampionship(id: string, data: Partial<Championship>): Promise<Championship | null> {
  return getOne<Championship>(
    `UPDATE championships SET
      name = COALESCE($2, name),
      short_name = $3,
      year = COALESCE($4, year),
      season = COALESCE($5, season),
      category = COALESCE($6, category),
      format = COALESCE($7, format),
      description = $8,
      rules = $9,
      start_date = $10,
      end_date = $11,
      status = COALESCE($12, status),
      logo_url = COALESCE($13, logo_url),
      active = COALESCE($14, active)
     WHERE id = $1 RETURNING *`,
    [
      id, data.name, data.short_name ?? null, data.year,
      data.season, data.category, data.format,
      data.description ?? null, data.rules ?? null,
      data.start_date ?? null, data.end_date ?? null,
      data.status, data.logo_url, data.active,
    ]
  );
}

export async function deleteChampionship(id: string): Promise<boolean> {
  const result = await query('DELETE FROM championships WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
