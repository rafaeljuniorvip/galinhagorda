import { query, getOne, getMany } from '@/lib/db';
import { User, Notification } from '@/types';

interface GoogleProfile {
  email: string;
  name: string;
  image: string | null;
  providerAccountId: string;
}

export async function findOrCreateGoogleUser(profile: GoogleProfile): Promise<User> {
  // Try to find existing user by provider_id
  const existing = await getOne<User>(
    `SELECT * FROM users WHERE provider = 'google' AND provider_id = $1`,
    [profile.providerAccountId]
  );

  if (existing) {
    // Update name and avatar on each login
    await query(
      `UPDATE users SET name = $1, avatar_url = $2, updated_at = NOW() WHERE id = $3`,
      [profile.name, profile.image, existing.id]
    );
    return { ...existing, name: profile.name, avatar_url: profile.image };
  }

  // Check if there's a user with the same email (different provider)
  const existingByEmail = await getOne<User>(
    `SELECT * FROM users WHERE email = $1`,
    [profile.email]
  );

  if (existingByEmail) {
    // Link Google account to existing user
    await query(
      `UPDATE users SET provider = 'google', provider_id = $1, avatar_url = $2, updated_at = NOW() WHERE id = $3`,
      [profile.providerAccountId, profile.image, existingByEmail.id]
    );
    return { ...existingByEmail, provider: 'google', provider_id: profile.providerAccountId, avatar_url: profile.image };
  }

  // Create new user
  const newUser = await getOne<User>(
    `INSERT INTO users (email, name, avatar_url, provider, provider_id, role, is_active)
     VALUES ($1, $2, $3, 'google', $4, 'fan', true)
     RETURNING *`,
    [profile.email, profile.name, profile.image, profile.providerAccountId]
  );

  if (!newUser) {
    throw new Error('Falha ao criar usuario');
  }

  return newUser;
}

export async function getUserById(id: string): Promise<User | null> {
  return getOne<User>(`SELECT * FROM users WHERE id = $1`, [id]);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return getOne<User>(`SELECT * FROM users WHERE email = $1`, [email]);
}

interface UpdateProfileData {
  bio?: string;
  phone?: string;
  city?: string;
  state?: string;
  name?: string;
}

export async function updateUserProfile(id: string, data: UpdateProfileData): Promise<User | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  if (data.bio !== undefined) {
    fields.push(`bio = $${paramIndex++}`);
    values.push(data.bio);
  }
  if (data.phone !== undefined) {
    fields.push(`phone = $${paramIndex++}`);
    values.push(data.phone);
  }
  if (data.city !== undefined) {
    fields.push(`city = $${paramIndex++}`);
    values.push(data.city);
  }
  if (data.state !== undefined) {
    fields.push(`state = $${paramIndex++}`);
    values.push(data.state);
  }

  if (fields.length === 0) return getUserById(id);

  fields.push(`updated_at = NOW()`);
  values.push(id);

  return getOne<User>(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
}

export async function linkPlayerToUser(userId: string, playerId: string): Promise<User | null> {
  return getOne<User>(
    `UPDATE users SET linked_player_id = $1,
       role = CASE WHEN role IN ('superadmin', 'admin') THEN role ELSE 'player' END,
       updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [playerId, userId]
  );
}

export async function linkTeamToUser(userId: string, teamId: string): Promise<User | null> {
  return getOne<User>(
    `UPDATE users SET linked_team_id = $1,
       role = CASE WHEN role IN ('superadmin', 'admin') THEN role ELSE 'team_owner' END,
       updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [teamId, userId]
  );
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  return getMany<Notification>(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [userId]
  );
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const result = await query(
    `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`,
    [userId]
  );
  return parseInt(result.rows[0].count);
}

export async function markNotificationRead(notificationId: string, userId: string): Promise<void> {
  await query(
    `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
    [notificationId, userId]
  );
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await query(
    `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
    [userId]
  );
}

export async function searchPlayers(searchTerm: string) {
  return getMany(
    `SELECT id, name, full_name, nickname, photo_url, position
     FROM players
     WHERE (name ILIKE $1 OR full_name ILIKE $1 OR nickname ILIKE $1) AND active = true
     ORDER BY name ASC
     LIMIT 10`,
    [`%${searchTerm}%`]
  );
}

export async function searchTeams(searchTerm: string) {
  return getMany(
    `SELECT id, name, short_name, logo_url, city
     FROM teams
     WHERE (name ILIKE $1 OR short_name ILIKE $1) AND active = true
     ORDER BY name ASC
     LIMIT 10`,
    [`%${searchTerm}%`]
  );
}
