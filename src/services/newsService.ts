import { query, getOne, getMany } from '@/lib/db';
import { NewsArticle, PaginatedResponse } from '@/types';
import { buildPaginationQuery } from '@/lib/utils';

interface NewsFilters {
  search?: string;
  championshipId?: string;
  published?: boolean;
  featured?: boolean;
  page?: number;
  limit?: number;
}

export async function listNews(filters: NewsFilters = {}): Promise<PaginatedResponse<NewsArticle>> {
  const { page = 1, limit = 20 } = filters;
  const { offset, limit: safeLimit } = buildPaginationQuery(page, limit);

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (filters.search) {
    conditions.push(`(n.title ILIKE $${paramIndex} OR n.summary ILIKE $${paramIndex})`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  if (filters.championshipId) {
    conditions.push(`n.championship_id = $${paramIndex}`);
    params.push(filters.championshipId);
    paramIndex++;
  }

  if (filters.published !== undefined) {
    conditions.push(`n.is_published = $${paramIndex}`);
    params.push(filters.published);
    paramIndex++;
  }

  if (filters.featured !== undefined) {
    conditions.push(`n.is_featured = $${paramIndex}`);
    params.push(filters.featured);
    paramIndex++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*) FROM news n ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  const data = await getMany<NewsArticle>(
    `SELECT n.*,
            au.name AS author_name,
            c.name AS championship_name
     FROM news n
     LEFT JOIN admin_users au ON au.id = n.author_id
     LEFT JOIN championships c ON c.id = n.championship_id
     ${where}
     ORDER BY n.created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
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

export async function getNewsById(id: string): Promise<NewsArticle | null> {
  return getOne<NewsArticle>(
    `SELECT n.*,
            au.name AS author_name,
            c.name AS championship_name
     FROM news n
     LEFT JOIN admin_users au ON au.id = n.author_id
     LEFT JOIN championships c ON c.id = n.championship_id
     WHERE n.id = $1`,
    [id]
  );
}

export async function getNewsBySlug(slug: string): Promise<NewsArticle | null> {
  return getOne<NewsArticle>(
    `SELECT n.*,
            au.name AS author_name,
            c.name AS championship_name
     FROM news n
     LEFT JOIN admin_users au ON au.id = n.author_id
     LEFT JOIN championships c ON c.id = n.championship_id
     WHERE n.slug = $1`,
    [slug]
  );
}

export async function createNews(data: {
  title: string;
  slug: string;
  summary?: string;
  content: string;
  cover_image?: string;
  author_id?: string;
  championship_id?: string;
  is_published?: boolean;
  is_featured?: boolean;
  published_at?: string;
}): Promise<NewsArticle> {
  const result = await getOne<NewsArticle>(
    `INSERT INTO news (title, slug, summary, content, cover_image, author_id, championship_id, is_published, is_featured, published_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      data.title,
      data.slug,
      data.summary || null,
      data.content,
      data.cover_image || null,
      data.author_id || null,
      data.championship_id || null,
      data.is_published ?? false,
      data.is_featured ?? false,
      data.published_at || (data.is_published ? new Date().toISOString() : null),
    ]
  );
  return result!;
}

export async function updateNews(id: string, data: Partial<NewsArticle>): Promise<NewsArticle | null> {
  return getOne<NewsArticle>(
    `UPDATE news SET
      title = COALESCE($2, title),
      slug = COALESCE($3, slug),
      summary = $4,
      content = COALESCE($5, content),
      cover_image = $6,
      championship_id = $7,
      is_published = COALESCE($8, is_published),
      is_featured = COALESCE($9, is_featured),
      published_at = $10,
      updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [
      id,
      data.title,
      data.slug,
      data.summary ?? null,
      data.content,
      data.cover_image ?? null,
      data.championship_id ?? null,
      data.is_published,
      data.is_featured,
      data.published_at ?? null,
    ]
  );
}

export async function deleteNews(id: string): Promise<boolean> {
  const result = await query('DELETE FROM news WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function incrementViews(id: string): Promise<void> {
  await query('UPDATE news SET views_count = views_count + 1 WHERE id = $1', [id]);
}
