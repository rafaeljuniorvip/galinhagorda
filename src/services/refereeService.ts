import { query, getOne, getMany } from '@/lib/db';
import { Referee, PaginatedResponse } from '@/types';
import { buildPaginationQuery } from '@/lib/utils';

interface RefereeFilters {
  search?: string;
  category?: string;
  active?: boolean;
  page?: number;
  limit?: number;
}

export async function listReferees(filters: RefereeFilters = {}): Promise<PaginatedResponse<Referee>> {
  const { page = 1, limit = 20 } = filters;
  const { offset, limit: safeLimit } = buildPaginationQuery(page, limit);

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (filters.search) {
    conditions.push(`(name ILIKE $${paramIndex} OR nickname ILIKE $${paramIndex})`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  if (filters.category) {
    conditions.push(`category = $${paramIndex}`);
    params.push(filters.category);
    paramIndex++;
  }

  if (filters.active !== undefined) {
    conditions.push(`active = $${paramIndex}`);
    params.push(filters.active);
    paramIndex++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(`SELECT COUNT(*) FROM referees ${where}`, params);
  const total = parseInt(countResult.rows[0].count);

  const data = await getMany<Referee>(
    `SELECT * FROM referees ${where} ORDER BY name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, safeLimit, offset]
  );

  return { data, total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) };
}

export async function getAllReferees(): Promise<Referee[]> {
  return getMany<Referee>('SELECT * FROM referees WHERE active = true ORDER BY name ASC');
}

export async function getRefereeById(id: string): Promise<Referee | null> {
  return getOne<Referee>('SELECT * FROM referees WHERE id = $1', [id]);
}

export async function createReferee(data: Partial<Referee>): Promise<Referee> {
  const result = await getOne<Referee>(
    `INSERT INTO referees (name, nickname, cpf, phone, category, city, state, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      data.name, data.nickname || null, data.cpf || null,
      data.phone || null, data.category || 'Arbitro',
      data.city || 'Itapecerica', data.state || 'MG',
      data.notes || null,
    ]
  );
  return result!;
}

export async function updateReferee(id: string, data: Partial<Referee>): Promise<Referee | null> {
  return getOne<Referee>(
    `UPDATE referees SET
      name = COALESCE($2, name),
      nickname = $3,
      cpf = $4,
      phone = $5,
      category = COALESCE($6, category),
      city = COALESCE($7, city),
      state = COALESCE($8, state),
      active = COALESCE($9, active),
      notes = $10,
      updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [
      id, data.name, data.nickname ?? null, data.cpf ?? null,
      data.phone ?? null, data.category, data.city, data.state,
      data.active, data.notes ?? null,
    ]
  );
}

export async function deleteReferee(id: string): Promise<boolean> {
  const result = await query('DELETE FROM referees WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
