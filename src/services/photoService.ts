import { query, getOne, getMany } from '@/lib/db';
import { Photo } from '@/types';

export async function getPhotos(targetType: string, targetId: string): Promise<Photo[]> {
  return getMany<Photo>(
    `SELECT * FROM photos
     WHERE target_type = $1 AND target_id = $2
     ORDER BY is_cover DESC, sort_order ASC, created_at DESC`,
    [targetType, targetId]
  );
}

export async function getAllPhotos(filters?: {
  targetType?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: Photo[]; total: number }> {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (filters?.targetType) {
    conditions.push(`target_type = $${paramIndex}`);
    params.push(filters.targetType);
    paramIndex++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const page = filters?.page || 1;
  const limit = Math.min(filters?.limit || 24, 100);
  const offset = (page - 1) * limit;

  const countResult = await query(`SELECT COUNT(*) FROM photos ${where}`, params);
  const total = parseInt(countResult.rows[0].count);

  const data = await getMany<Photo>(
    `SELECT * FROM photos ${where}
     ORDER BY created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  return { data, total };
}

export async function addPhoto(data: {
  uploaded_by?: string;
  uploaded_by_admin?: string;
  target_type: string;
  target_id: string;
  url: string;
  thumbnail_url?: string;
  caption?: string;
  is_cover?: boolean;
  sort_order?: number;
}): Promise<Photo> {
  const result = await getOne<Photo>(
    `INSERT INTO photos (uploaded_by, uploaded_by_admin, target_type, target_id, url, thumbnail_url, caption, is_cover, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      data.uploaded_by || null,
      data.uploaded_by_admin || null,
      data.target_type,
      data.target_id,
      data.url,
      data.thumbnail_url || null,
      data.caption || null,
      data.is_cover ?? false,
      data.sort_order ?? 0,
    ]
  );
  return result!;
}

export async function updatePhoto(
  id: string,
  data: Partial<Pick<Photo, 'caption' | 'is_cover' | 'sort_order'>>
): Promise<Photo | null> {
  return getOne<Photo>(
    `UPDATE photos SET
      caption = COALESCE($2, caption),
      is_cover = COALESCE($3, is_cover),
      sort_order = COALESCE($4, sort_order)
     WHERE id = $1 RETURNING *`,
    [id, data.caption, data.is_cover, data.sort_order]
  );
}

export async function deletePhoto(id: string): Promise<boolean> {
  const result = await query('DELETE FROM photos WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function setCoverPhoto(id: string): Promise<void> {
  // Get the photo first to know its target
  const photo = await getOne<Photo>('SELECT * FROM photos WHERE id = $1', [id]);
  if (!photo) return;

  // Unset all cover photos for this target
  await query(
    'UPDATE photos SET is_cover = false WHERE target_type = $1 AND target_id = $2',
    [photo.target_type, photo.target_id]
  );

  // Set this one as cover
  await query('UPDATE photos SET is_cover = true WHERE id = $1', [id]);
}
