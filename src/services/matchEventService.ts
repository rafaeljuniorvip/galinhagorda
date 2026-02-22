import { query, getOne, getMany } from '@/lib/db';
import { MatchEvent } from '@/types';

export async function getEventsByMatch(matchId: string): Promise<MatchEvent[]> {
  return getMany<MatchEvent>(
    `SELECT me.*, p.name AS player_name, t.name AS team_name
     FROM match_events me
     JOIN players p ON p.id = me.player_id
     JOIN teams t ON t.id = me.team_id
     WHERE me.match_id = $1
     ORDER BY me.half ASC, me.minute ASC NULLS LAST`,
    [matchId]
  );
}

export async function createEvent(data: Partial<MatchEvent>): Promise<MatchEvent> {
  const result = await getOne<MatchEvent>(
    `INSERT INTO match_events (match_id, player_id, team_id, event_type, minute, half, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      data.match_id, data.player_id, data.team_id,
      data.event_type, data.minute ?? null,
      data.half || null, data.notes || null,
    ]
  );
  return result!;
}

export async function deleteEvent(id: string): Promise<boolean> {
  const result = await query('DELETE FROM match_events WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
