import { query, getOne, getMany } from '@/lib/db';
import { NewsArticle } from '@/types';
import { buildPaginationQuery } from '@/lib/utils';

export async function getPublishedNews(
  page: number = 1,
  limit: number = 10,
  championshipId?: string
): Promise<{ news: NewsArticle[]; total: number }> {
  const { offset, limit: safeLimit } = buildPaginationQuery(page, limit);

  const conditions = ['n.is_published = true'];
  const params: any[] = [];
  let paramIndex = 1;

  if (championshipId) {
    conditions.push(`n.championship_id = $${paramIndex}`);
    params.push(championshipId);
    paramIndex++;
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const countResult = await query(
    `SELECT COUNT(*) FROM news n ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  const news = await getMany<NewsArticle>(
    `SELECT n.*,
      u.name AS author_name,
      c.name AS championship_name
     FROM news n
     LEFT JOIN users u ON u.id = n.author_id
     LEFT JOIN championships c ON c.id = n.championship_id
     ${where}
     ORDER BY n.published_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, safeLimit, offset]
  );

  return { news, total };
}

export async function getFeaturedNews(limit: number = 4): Promise<NewsArticle[]> {
  return getMany<NewsArticle>(
    `SELECT n.*,
      u.name AS author_name,
      c.name AS championship_name
     FROM news n
     LEFT JOIN users u ON u.id = n.author_id
     LEFT JOIN championships c ON c.id = n.championship_id
     WHERE n.is_published = true AND n.is_featured = true
     ORDER BY n.published_at DESC
     LIMIT $1`,
    [limit]
  );
}

export async function getNewsBySlug(slug: string): Promise<NewsArticle | null> {
  // Increment views count
  await query(
    `UPDATE news SET views_count = views_count + 1 WHERE slug = $1 AND is_published = true`,
    [slug]
  );

  return getOne<NewsArticle>(
    `SELECT n.*,
      u.name AS author_name,
      c.name AS championship_name
     FROM news n
     LEFT JOIN users u ON u.id = n.author_id
     LEFT JOIN championships c ON c.id = n.championship_id
     WHERE n.slug = $1 AND n.is_published = true`,
    [slug]
  );
}

export async function getRelatedNews(newsId: string, limit: number = 3): Promise<NewsArticle[]> {
  // Get the current article to find its championship
  const current = await getOne<NewsArticle>(
    'SELECT championship_id FROM news WHERE id = $1',
    [newsId]
  );

  if (current?.championship_id) {
    // Try to get news from the same championship first
    const related = await getMany<NewsArticle>(
      `SELECT n.*,
        u.name AS author_name,
        c.name AS championship_name
       FROM news n
       LEFT JOIN users u ON u.id = n.author_id
       LEFT JOIN championships c ON c.id = n.championship_id
       WHERE n.is_published = true AND n.id != $1 AND n.championship_id = $2
       ORDER BY n.published_at DESC
       LIMIT $3`,
      [newsId, current.championship_id, limit]
    );

    if (related.length >= limit) return related;

    // Fill remaining slots with other news
    const remaining = limit - related.length;
    const relatedIds = related.map(r => r.id);
    const excludeIds = [newsId, ...relatedIds];

    const more = await getMany<NewsArticle>(
      `SELECT n.*,
        u.name AS author_name,
        c.name AS championship_name
       FROM news n
       LEFT JOIN users u ON u.id = n.author_id
       LEFT JOIN championships c ON c.id = n.championship_id
       WHERE n.is_published = true AND n.id != ALL($1::uuid[])
       ORDER BY n.published_at DESC
       LIMIT $2`,
      [excludeIds, remaining]
    );

    return [...related, ...more];
  }

  // No championship - just get latest news excluding this one
  return getMany<NewsArticle>(
    `SELECT n.*,
      u.name AS author_name,
      c.name AS championship_name
     FROM news n
     LEFT JOIN users u ON u.id = n.author_id
     LEFT JOIN championships c ON c.id = n.championship_id
     WHERE n.is_published = true AND n.id != $1
     ORDER BY n.published_at DESC
     LIMIT $2`,
    [newsId, limit]
  );
}

export async function getNewsByChampionship(championshipId: string, limit: number = 5): Promise<NewsArticle[]> {
  return getMany<NewsArticle>(
    `SELECT n.*,
      u.name AS author_name,
      c.name AS championship_name
     FROM news n
     LEFT JOIN users u ON u.id = n.author_id
     LEFT JOIN championships c ON c.id = n.championship_id
     WHERE n.is_published = true AND n.championship_id = $1
     ORDER BY n.published_at DESC
     LIMIT $2`,
    [championshipId, limit]
  );
}
