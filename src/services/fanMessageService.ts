import { query, getOne, getMany } from '@/lib/db';
import { FanMessage } from '@/types';
import { buildPaginationQuery } from '@/lib/utils';

interface MessagesResult {
  messages: FanMessage[];
  total: number;
}

export async function getMessages(
  targetType: string,
  targetId: string,
  page: number = 1,
  limit: number = 20
): Promise<MessagesResult> {
  const { offset, limit: safeLimit } = buildPaginationQuery(page, limit);

  const countResult = await getOne<{ count: string }>(
    `SELECT COUNT(*) FROM fan_messages
     WHERE target_type = $1 AND target_id = $2 AND is_approved = true`,
    [targetType, targetId]
  );
  const total = parseInt(countResult?.count || '0');

  const messages = await getMany<FanMessage>(
    `SELECT * FROM fan_messages
     WHERE target_type = $1 AND target_id = $2 AND is_approved = true
     ORDER BY is_pinned DESC, created_at DESC
     LIMIT $3 OFFSET $4`,
    [targetType, targetId, safeLimit, offset]
  );

  return { messages, total };
}

export async function createMessage(data: {
  userId?: string | null;
  authorName: string;
  authorAvatar?: string | null;
  targetType: string;
  targetId: string;
  message: string;
}): Promise<FanMessage> {
  const result = await getOne<FanMessage>(
    `INSERT INTO fan_messages (user_id, author_name, author_avatar, target_type, target_id, message, is_approved)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      data.userId || null,
      data.authorName,
      data.authorAvatar || null,
      data.targetType,
      data.targetId,
      data.message.substring(0, 280),
      true, // auto-approve for now
    ]
  );
  return result!;
}

export async function deleteMessage(id: string): Promise<boolean> {
  const result = await query('DELETE FROM fan_messages WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function toggleApproval(id: string): Promise<FanMessage | null> {
  return getOne<FanMessage>(
    `UPDATE fan_messages SET is_approved = NOT is_approved WHERE id = $1 RETURNING *`,
    [id]
  );
}

export async function togglePin(id: string): Promise<FanMessage | null> {
  return getOne<FanMessage>(
    `UPDATE fan_messages SET is_pinned = NOT is_pinned WHERE id = $1 RETURNING *`,
    [id]
  );
}

export async function likeMessage(
  messageId: string,
  userId?: string | null,
  voterIp?: string | null
): Promise<{ success: boolean; newCount: number; liked: boolean }> {
  // Check if already liked
  if (userId) {
    const existing = await getOne(
      'SELECT id FROM message_likes WHERE message_id = $1 AND user_id = $2',
      [messageId, userId]
    );
    if (existing) {
      // Unlike
      await query('DELETE FROM message_likes WHERE message_id = $1 AND user_id = $2', [messageId, userId]);
      await query('UPDATE fan_messages SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = $1', [messageId]);
      const msg = await getOne<{ likes_count: number }>('SELECT likes_count FROM fan_messages WHERE id = $1', [messageId]);
      return { success: true, newCount: msg?.likes_count || 0, liked: false };
    }
  } else if (voterIp && voterIp !== 'unknown') {
    const existing = await getOne(
      'SELECT id FROM message_likes WHERE message_id = $1 AND voter_ip = $2 AND user_id IS NULL',
      [messageId, voterIp]
    );
    if (existing) {
      // Unlike
      await query('DELETE FROM message_likes WHERE message_id = $1 AND voter_ip = $2 AND user_id IS NULL', [messageId, voterIp]);
      await query('UPDATE fan_messages SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = $1', [messageId]);
      const msg = await getOne<{ likes_count: number }>('SELECT likes_count FROM fan_messages WHERE id = $1', [messageId]);
      return { success: true, newCount: msg?.likes_count || 0, liked: false };
    }
  }

  // Like
  try {
    await query(
      'INSERT INTO message_likes (message_id, user_id, voter_ip) VALUES ($1, $2, $3)',
      [messageId, userId || null, voterIp || null]
    );
    await query('UPDATE fan_messages SET likes_count = likes_count + 1 WHERE id = $1', [messageId]);
    const msg = await getOne<{ likes_count: number }>('SELECT likes_count FROM fan_messages WHERE id = $1', [messageId]);
    return { success: true, newCount: msg?.likes_count || 0, liked: true };
  } catch (error: any) {
    if (error?.code === '23505') {
      const msg = await getOne<{ likes_count: number }>('SELECT likes_count FROM fan_messages WHERE id = $1', [messageId]);
      return { success: false, newCount: msg?.likes_count || 0, liked: true };
    }
    throw error;
  }
}

export async function getMessageById(id: string): Promise<FanMessage | null> {
  return getOne<FanMessage>('SELECT * FROM fan_messages WHERE id = $1', [id]);
}

export async function getAllMessages(
  page: number = 1,
  limit: number = 20,
  approved?: boolean
): Promise<MessagesResult> {
  const { offset, limit: safeLimit } = buildPaginationQuery(page, limit);

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (approved !== undefined) {
    conditions.push(`is_approved = $${paramIndex}`);
    params.push(approved);
    paramIndex++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await getOne<{ count: string }>(
    `SELECT COUNT(*) FROM fan_messages ${where}`,
    params
  );
  const total = parseInt(countResult?.count || '0');

  const messages = await getMany<FanMessage>(
    `SELECT * FROM fan_messages ${where}
     ORDER BY created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, safeLimit, offset]
  );

  return { messages, total };
}
