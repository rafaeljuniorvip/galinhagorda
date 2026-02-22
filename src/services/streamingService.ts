import { query, getOne, getMany } from '@/lib/db';
import { StreamingLink } from '@/types';

export async function getStreamingLinks(matchId: string): Promise<StreamingLink[]> {
  return getMany<StreamingLink>(
    `SELECT * FROM streaming_links
     WHERE match_id = $1
     ORDER BY is_live DESC, created_at ASC`,
    [matchId]
  );
}

export async function createStreamingLink(data: {
  match_id: string;
  platform: string;
  url: string;
  label?: string;
  is_live?: boolean;
  created_by?: string;
}): Promise<StreamingLink> {
  const result = await getOne<StreamingLink>(
    `INSERT INTO streaming_links (match_id, platform, url, label, is_live, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      data.match_id,
      data.platform,
      data.url,
      data.label || null,
      data.is_live ?? false,
      data.created_by || null,
    ]
  );
  return result!;
}

export async function updateStreamingLink(
  id: string,
  data: Partial<Pick<StreamingLink, 'platform' | 'url' | 'label' | 'is_live'>>
): Promise<StreamingLink | null> {
  return getOne<StreamingLink>(
    `UPDATE streaming_links SET
      platform = COALESCE($2, platform),
      url = COALESCE($3, url),
      label = COALESCE($4, label),
      is_live = COALESCE($5, is_live)
     WHERE id = $1 RETURNING *`,
    [id, data.platform, data.url, data.label, data.is_live]
  );
}

export async function deleteStreamingLink(id: string): Promise<boolean> {
  const result = await query('DELETE FROM streaming_links WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function setLiveStatus(id: string, isLive: boolean): Promise<void> {
  await query('UPDATE streaming_links SET is_live = $2 WHERE id = $1', [id, isLive]);
}
