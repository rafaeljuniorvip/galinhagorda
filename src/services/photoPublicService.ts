import { getMany } from '@/lib/db';
import { Photo } from '@/types';

export async function getPublicPhotos(targetType: string, targetId: string): Promise<Photo[]> {
  return getMany<Photo>(
    `SELECT * FROM photos
     WHERE target_type = $1 AND target_id = $2
     ORDER BY sort_order ASC, created_at DESC`,
    [targetType, targetId]
  );
}

export async function getLatestPhotos(limit: number = 12): Promise<Photo[]> {
  return getMany<Photo>(
    `SELECT * FROM photos
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
}
