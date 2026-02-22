import { query, getOne, getMany } from '@/lib/db';
import { Player, PaginatedResponse } from '@/types';
import { buildPaginationQuery } from '@/lib/utils';

interface PlayerFilters {
  search?: string;
  position?: string;
  active?: boolean;
  page?: number;
  limit?: number;
}

export async function listPlayers(filters: PlayerFilters = {}): Promise<PaginatedResponse<Player>> {
  const { page = 1, limit = 20 } = filters;
  const { offset, limit: safeLimit } = buildPaginationQuery(page, limit);

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (filters.search) {
    conditions.push(`(name ILIKE $${paramIndex} OR full_name ILIKE $${paramIndex} OR nickname ILIKE $${paramIndex})`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  if (filters.position) {
    conditions.push(`position = $${paramIndex}`);
    params.push(filters.position);
    paramIndex++;
  }

  if (filters.active !== undefined) {
    conditions.push(`active = $${paramIndex}`);
    params.push(filters.active);
    paramIndex++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(`SELECT COUNT(*) FROM players ${where}`, params);
  const total = parseInt(countResult.rows[0].count);

  const data = await getMany<Player>(
    `SELECT * FROM players ${where} ORDER BY name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, safeLimit, offset]
  );

  return {
    data,
    total,
    page,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
  };
}

export async function getPlayerById(id: string): Promise<Player | null> {
  return getOne<Player>('SELECT * FROM players WHERE id = $1', [id]);
}

export async function createPlayer(data: Partial<Player>): Promise<Player> {
  const result = await getOne<Player>(
    `INSERT INTO players (full_name, name, nickname, birth_date, cpf, rg, position, dominant_foot, height, weight, photo_url, city, state, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING *`,
    [
      data.full_name, data.name, data.nickname || null, data.birth_date || null,
      data.cpf || null, data.rg || null, data.position, data.dominant_foot || null,
      data.height || null, data.weight || null, data.photo_url || null,
      data.city || 'Itapecerica', data.state || 'MG', data.notes || null,
    ]
  );
  return result!;
}

export async function updatePlayer(id: string, data: Partial<Player>): Promise<Player | null> {
  return getOne<Player>(
    `UPDATE players SET
      full_name = COALESCE($2, full_name),
      name = COALESCE($3, name),
      nickname = $4,
      birth_date = $5,
      cpf = $6,
      rg = $7,
      position = COALESCE($8, position),
      dominant_foot = $9,
      height = $10,
      weight = $11,
      photo_url = COALESCE($12, photo_url),
      city = COALESCE($13, city),
      state = COALESCE($14, state),
      active = COALESCE($15, active),
      notes = $16
     WHERE id = $1 RETURNING *`,
    [
      id, data.full_name, data.name, data.nickname ?? null, data.birth_date ?? null,
      data.cpf ?? null, data.rg ?? null, data.position, data.dominant_foot ?? null,
      data.height ?? null, data.weight ?? null, data.photo_url,
      data.city, data.state, data.active, data.notes ?? null,
    ]
  );
}

export async function deletePlayer(id: string): Promise<boolean> {
  const result = await query('DELETE FROM players WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
