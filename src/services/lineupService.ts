import { query, getOne, getMany } from '@/lib/db';
import { MatchLineup } from '@/types';

interface GroupedLineups {
  home: MatchLineup[];
  away: MatchLineup[];
}

export async function getMatchLineups(matchId: string): Promise<GroupedLineups> {
  const lineups = await getMany<MatchLineup & { team_side: string }>(
    `SELECT ml.*,
            p.name AS player_name,
            p.photo_url AS player_photo,
            CASE
              WHEN ml.team_id = m.home_team_id THEN 'home'
              ELSE 'away'
            END AS team_side
     FROM match_lineups ml
     JOIN players p ON p.id = ml.player_id
     JOIN matches m ON m.id = ml.match_id
     WHERE ml.match_id = $1
     ORDER BY ml.is_starter DESC, ml.position ASC, ml.shirt_number ASC NULLS LAST`,
    [matchId]
  );

  const home: MatchLineup[] = [];
  const away: MatchLineup[] = [];

  for (const lineup of lineups) {
    const { team_side, ...rest } = lineup;
    if (team_side === 'home') {
      home.push(rest);
    } else {
      away.push(rest);
    }
  }

  return { home, away };
}

export async function addPlayerToLineup(data: {
  match_id: string;
  team_id: string;
  player_id: string;
  position?: string;
  shirt_number?: number;
  is_starter?: boolean;
}): Promise<MatchLineup> {
  const result = await getOne<MatchLineup>(
    `INSERT INTO match_lineups (match_id, team_id, player_id, position, shirt_number, is_starter)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      data.match_id,
      data.team_id,
      data.player_id,
      data.position || null,
      data.shirt_number ?? null,
      data.is_starter ?? true,
    ]
  );
  return result!;
}

export async function removeFromLineup(id: string): Promise<boolean> {
  const result = await query('DELETE FROM match_lineups WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function bulkSetLineup(
  matchId: string,
  teamId: string,
  players: Array<{
    player_id: string;
    position?: string;
    shirt_number?: number;
    is_starter?: boolean;
  }>
): Promise<MatchLineup[]> {
  // Remove existing lineup for this team in this match
  await query(
    'DELETE FROM match_lineups WHERE match_id = $1 AND team_id = $2',
    [matchId, teamId]
  );

  if (players.length === 0) return [];

  // Build bulk insert
  const values: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  for (const player of players) {
    values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5})`);
    params.push(
      matchId,
      teamId,
      player.player_id,
      player.position || null,
      player.shirt_number ?? null,
      player.is_starter ?? true
    );
    paramIndex += 6;
  }

  const result = await getMany<MatchLineup>(
    `INSERT INTO match_lineups (match_id, team_id, player_id, position, shirt_number, is_starter)
     VALUES ${values.join(', ')}
     RETURNING *`,
    params
  );

  return result;
}
