import { query, getOne, getMany } from '@/lib/db';
import { PlayerRegistration } from '@/types';

export async function getRegistrationsByChampionship(championshipId: string, teamId?: string): Promise<PlayerRegistration[]> {
  const conditions = ['pr.championship_id = $1'];
  const params: any[] = [championshipId];

  if (teamId) {
    conditions.push('pr.team_id = $2');
    params.push(teamId);
  }

  return getMany<PlayerRegistration>(
    `SELECT pr.*,
      p.name AS player_name, p.photo_url AS player_photo, p.position AS player_position,
      t.name AS team_name, t.logo_url AS team_logo,
      c.name AS championship_name
     FROM player_registrations pr
     JOIN players p ON p.id = pr.player_id
     JOIN teams t ON t.id = pr.team_id
     JOIN championships c ON c.id = pr.championship_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY t.name ASC, p.name ASC`,
    params
  );
}

export async function getRegistrationsByPlayer(playerId: string): Promise<PlayerRegistration[]> {
  return getMany<PlayerRegistration>(
    `SELECT pr.*,
      p.name AS player_name, p.photo_url AS player_photo, p.position AS player_position,
      t.name AS team_name, t.logo_url AS team_logo,
      c.name AS championship_name
     FROM player_registrations pr
     JOIN players p ON p.id = pr.player_id
     JOIN teams t ON t.id = pr.team_id
     JOIN championships c ON c.id = pr.championship_id
     WHERE pr.player_id = $1
     ORDER BY c.year DESC, c.name ASC`,
    [playerId]
  );
}

export async function createRegistration(data: Partial<PlayerRegistration>): Promise<PlayerRegistration> {
  // Auto-generate BID number
  const countResult = await query(
    'SELECT COUNT(*) FROM player_registrations WHERE championship_id = $1',
    [data.championship_id]
  );
  const count = parseInt(countResult.rows[0].count) + 1;
  const bidNumber = `BID-${count.toString().padStart(4, '0')}`;

  const result = await getOne<PlayerRegistration>(
    `INSERT INTO player_registrations (player_id, team_id, championship_id, shirt_number, registration_date, status, bid_number, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      data.player_id, data.team_id, data.championship_id,
      data.shirt_number ?? null, data.registration_date || new Date().toISOString().split('T')[0],
      data.status || 'Ativo', bidNumber, data.notes || null,
    ]
  );
  return result!;
}

export async function updateRegistration(id: string, data: Partial<PlayerRegistration>): Promise<PlayerRegistration | null> {
  const fields: string[] = [];
  const params: any[] = [id];
  let idx = 2;

  if (data.team_id !== undefined) {
    fields.push(`team_id = $${idx++}`);
    params.push(data.team_id);
  }
  if (data.shirt_number !== undefined) {
    fields.push(`shirt_number = $${idx++}`);
    params.push(data.shirt_number);
  }
  if (data.status !== undefined) {
    fields.push(`status = $${idx++}`);
    params.push(data.status);
  }
  if (data.notes !== undefined) {
    fields.push(`notes = $${idx++}`);
    params.push(data.notes);
  }

  if (fields.length === 0) return null;

  return getOne<PlayerRegistration>(
    `UPDATE player_registrations SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );
}

export async function deleteRegistration(id: string): Promise<boolean> {
  const result = await query('DELETE FROM player_registrations WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function enrollTeam(teamId: string, championshipId: string, groupName?: string): Promise<any> {
  return getOne(
    `INSERT INTO team_championships (team_id, championship_id, group_name)
     VALUES ($1, $2, $3)
     ON CONFLICT (team_id, championship_id) DO NOTHING
     RETURNING *`,
    [teamId, championshipId, groupName || null]
  );
}

export async function getEnrolledTeams(championshipId: string): Promise<any[]> {
  return getMany(
    `SELECT tc.*, t.name AS team_name, t.logo_url AS team_logo, t.short_name
     FROM team_championships tc
     JOIN teams t ON t.id = tc.team_id
     WHERE tc.championship_id = $1
     ORDER BY t.name ASC`,
    [championshipId]
  );
}

export async function removeTeamFromChampionship(teamId: string, championshipId: string): Promise<boolean> {
  const result = await query(
    'DELETE FROM team_championships WHERE team_id = $1 AND championship_id = $2',
    [teamId, championshipId]
  );
  return (result.rowCount ?? 0) > 0;
}
