import { query } from '@/lib/db';

export interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  tier: string;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getActiveSponsors(): Promise<Sponsor[]> {
  const result = await query(
    'SELECT * FROM sponsors WHERE active = true ORDER BY sort_order ASC, name ASC'
  );
  return result.rows;
}

export async function getAllSponsors(): Promise<Sponsor[]> {
  const result = await query('SELECT * FROM sponsors ORDER BY sort_order ASC, name ASC');
  return result.rows;
}

export async function getSponsorById(id: string): Promise<Sponsor | null> {
  const result = await query('SELECT * FROM sponsors WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function createSponsor(data: {
  name: string;
  logo_url?: string;
  website_url?: string;
  tier?: string;
  sort_order?: number;
  active?: boolean;
}): Promise<Sponsor> {
  const result = await query(
    `INSERT INTO sponsors (name, logo_url, website_url, tier, sort_order, active)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      data.name,
      data.logo_url || null,
      data.website_url || null,
      data.tier || 'apoiador',
      data.sort_order ?? 0,
      data.active ?? true,
    ]
  );
  return result.rows[0];
}

export async function updateSponsor(id: string, data: Partial<{
  name: string;
  logo_url: string | null;
  website_url: string | null;
  tier: string;
  sort_order: number;
  active: boolean;
}>): Promise<Sponsor | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }
  }

  if (fields.length === 0) return getSponsorById(id);

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query(
    `UPDATE sponsors SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function deleteSponsor(id: string): Promise<boolean> {
  const result = await query('DELETE FROM sponsors WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
