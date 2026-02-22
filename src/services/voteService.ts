import { query, getOne, getMany } from '@/lib/db';
import { VoteResult } from '@/types';

interface CastVoteResult {
  success: boolean;
  message: string;
}

interface VotingStatus {
  isOpen: boolean;
  deadline: string | null;
  totalVotes: number;
  winner: VoteResult | null;
}

export async function castVote(
  matchId: string,
  playerId: string,
  userId?: string | null,
  voterName?: string | null,
  voterIp?: string | null
): Promise<CastVoteResult> {
  // Check if voting is open
  const match = await getOne<{ voting_open: boolean; voting_deadline: string | null }>(
    'SELECT voting_open, voting_deadline FROM matches WHERE id = $1',
    [matchId]
  );

  if (!match) {
    return { success: false, message: 'Partida no encontrada' };
  }

  if (!match.voting_open) {
    return { success: false, message: 'A votao no est aberta para esta partida' };
  }

  if (match.voting_deadline && new Date(match.voting_deadline) < new Date()) {
    return { success: false, message: 'O prazo para votao j encerrou' };
  }

  // Check if user already voted (by user_id)
  if (userId) {
    const existingVote = await getOne(
      'SELECT id FROM match_votes WHERE match_id = $1 AND user_id = $2',
      [matchId, userId]
    );
    if (existingVote) {
      return { success: false, message: 'Voc j votou nesta partida' };
    }
  }

  // Check if IP already voted (for anonymous voters)
  if (!userId && voterIp && voterIp !== 'unknown') {
    const ipVote = await getOne(
      'SELECT id FROM match_votes WHERE match_id = $1 AND voter_ip = $2 AND user_id IS NULL',
      [matchId, voterIp]
    );
    if (ipVote) {
      return { success: false, message: 'J foi registrado um voto deste dispositivo' };
    }
  }

  // Verify player is part of this match (either team)
  const validPlayer = await getOne(
    `SELECT pr.player_id FROM player_registrations pr
     JOIN matches m ON m.championship_id = pr.championship_id
       AND (pr.team_id = m.home_team_id OR pr.team_id = m.away_team_id)
     WHERE m.id = $1 AND pr.player_id = $2`,
    [matchId, playerId]
  );

  if (!validPlayer) {
    return { success: false, message: 'Jogador no participa desta partida' };
  }

  // Insert vote
  try {
    await query(
      `INSERT INTO match_votes (match_id, player_id, user_id, voter_name, voter_ip)
       VALUES ($1, $2, $3, $4, $5)`,
      [matchId, playerId, userId || null, voterName || null, voterIp || null]
    );
    return { success: true, message: 'Voto registrado com sucesso!' };
  } catch (error: any) {
    if (error?.code === '23505') {
      return { success: false, message: 'Voc j votou nesta partida' };
    }
    throw error;
  }
}

export async function getVoteResults(matchId: string): Promise<VoteResult[]> {
  const totalResult = await getOne<{ count: string }>(
    'SELECT COUNT(*) FROM match_votes WHERE match_id = $1',
    [matchId]
  );
  const totalVotes = parseInt(totalResult?.count || '0');

  if (totalVotes === 0) return [];

  return getMany<VoteResult>(
    `SELECT
       mv.player_id,
       p.name AS player_name,
       p.photo_url AS player_photo,
       t.name AS team_name,
       t.logo_url AS team_logo,
       COUNT(*)::int AS votes,
       ROUND((COUNT(*)::numeric / $2) * 100, 1)::float AS percentage
     FROM match_votes mv
     JOIN players p ON p.id = mv.player_id
     JOIN player_registrations pr ON pr.player_id = mv.player_id
       AND pr.championship_id = (SELECT championship_id FROM matches WHERE id = $1)
     JOIN teams t ON t.id = pr.team_id
     WHERE mv.match_id = $1
     GROUP BY mv.player_id, p.name, p.photo_url, t.name, t.logo_url
     ORDER BY votes DESC`,
    [matchId, totalVotes]
  );
}

export async function getMatchVotingStatus(matchId: string): Promise<VotingStatus> {
  const match = await getOne<{ voting_open: boolean; voting_deadline: string | null }>(
    'SELECT voting_open, voting_deadline FROM matches WHERE id = $1',
    [matchId]
  );

  if (!match) {
    return { isOpen: false, deadline: null, totalVotes: 0, winner: null };
  }

  const totalResult = await getOne<{ count: string }>(
    'SELECT COUNT(*) FROM match_votes WHERE match_id = $1',
    [matchId]
  );
  const totalVotes = parseInt(totalResult?.count || '0');

  let winner: VoteResult | null = null;
  if (totalVotes > 0) {
    const results = await getVoteResults(matchId);
    if (results.length > 0) {
      winner = results[0];
    }
  }

  const isOpen = match.voting_open && (!match.voting_deadline || new Date(match.voting_deadline) > new Date());

  return {
    isOpen,
    deadline: match.voting_deadline,
    totalVotes,
    winner,
  };
}

export async function openVoting(matchId: string, deadline?: string): Promise<void> {
  await query(
    'UPDATE matches SET voting_open = true, voting_deadline = $2 WHERE id = $1',
    [matchId, deadline || null]
  );
}

export async function closeVoting(matchId: string): Promise<void> {
  await query(
    'UPDATE matches SET voting_open = false WHERE id = $1',
    [matchId]
  );
}

export async function getUserVote(matchId: string, userId?: string | null, voterIp?: string | null): Promise<string | null> {
  if (userId) {
    const vote = await getOne<{ player_id: string }>(
      'SELECT player_id FROM match_votes WHERE match_id = $1 AND user_id = $2',
      [matchId, userId]
    );
    return vote?.player_id || null;
  }
  if (voterIp && voterIp !== 'unknown') {
    const vote = await getOne<{ player_id: string }>(
      'SELECT player_id FROM match_votes WHERE match_id = $1 AND voter_ip = $2 AND user_id IS NULL',
      [matchId, voterIp]
    );
    return vote?.player_id || null;
  }
  return null;
}

export async function getMatchPlayers(matchId: string) {
  return getMany<{
    player_id: string;
    player_name: string;
    player_photo: string | null;
    team_id: string;
    team_name: string;
    team_logo: string | null;
    shirt_number: number | null;
    position: string;
  }>(
    `SELECT
       pr.player_id,
       p.name AS player_name,
       p.photo_url AS player_photo,
       pr.team_id,
       t.name AS team_name,
       t.logo_url AS team_logo,
       pr.shirt_number,
       p.position
     FROM player_registrations pr
     JOIN players p ON p.id = pr.player_id
     JOIN teams t ON t.id = pr.team_id
     JOIN matches m ON m.championship_id = pr.championship_id
       AND (pr.team_id = m.home_team_id OR pr.team_id = m.away_team_id)
     WHERE m.id = $1
     ORDER BY t.name, pr.shirt_number NULLS LAST, p.name`,
    [matchId]
  );
}
