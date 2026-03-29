import { query, getOne, getMany } from '@/lib/db';
import { MatchEvent } from '@/types';

export async function getEventsByMatch(matchId: string): Promise<MatchEvent[]> {
  return getMany<MatchEvent>(
    `SELECT me.*, p.full_name AS player_name, t.name AS team_name
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

const GOAL_TYPES = ['GOL', 'GOL_PENALTI', 'GOL_CONTRA'];

export async function recalculateScore(matchId: string): Promise<{ home_score: number; away_score: number }> {
  const match = await getOne<{ home_team_id: string; away_team_id: string }>(
    'SELECT home_team_id, away_team_id FROM matches WHERE id = $1',
    [matchId]
  );
  if (!match) throw new Error('Partida não encontrada');

  const events = await getMany<{ event_type: string; team_id: string }>(
    `SELECT event_type, team_id FROM match_events
     WHERE match_id = $1 AND event_type IN ('GOL', 'GOL_PENALTI', 'GOL_CONTRA')`,
    [matchId]
  );

  let homeScore = 0;
  let awayScore = 0;

  for (const e of events) {
    if (e.event_type === 'GOL_CONTRA') {
      // Own goal counts for the opposing team
      if (e.team_id === match.home_team_id) awayScore++;
      else homeScore++;
    } else {
      // Regular goal or penalty goal
      if (e.team_id === match.home_team_id) homeScore++;
      else awayScore++;
    }
  }

  await query(
    'UPDATE matches SET home_score = $1, away_score = $2, updated_at = NOW() WHERE id = $3',
    [homeScore, awayScore, matchId]
  );

  return { home_score: homeScore, away_score: awayScore };
}

export function isGoalEvent(eventType: string): boolean {
  return GOAL_TYPES.includes(eventType);
}
