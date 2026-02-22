import { NextRequest, NextResponse } from 'next/server';
import { castVote, getVoteResults, getMatchVotingStatus, getUserVote, getMatchPlayers } from '@/services/voteService';
import { getAuthUser } from '@/lib/auth';

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');

    if (!matchId) {
      return NextResponse.json({ error: 'matchId obrigatrio' }, { status: 400 });
    }

    const include = searchParams.get('include') || '';

    const results = await getVoteResults(matchId);
    const status = await getMatchVotingStatus(matchId);

    // Check if current user/IP has voted
    let userVotedFor: string | null = null;
    try {
      const user = await getAuthUser(request);
      const ip = getClientIp(request);
      userVotedFor = await getUserVote(matchId, user?.id, ip);
    } catch {
      // ignore auth errors
    }

    const response: any = { results, status, userVotedFor };

    if (include.includes('players')) {
      response.players = await getMatchPlayers(matchId);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] Get vote results error:', error);
    return NextResponse.json({ error: 'Erro ao buscar resultados da votao' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchId, playerId, voterName } = body;

    if (!matchId || !playerId) {
      return NextResponse.json({ error: 'matchId e playerId so obrigatrios' }, { status: 400 });
    }

    let userId: string | undefined;
    try {
      const user = await getAuthUser(request);
      if (user) userId = user.id;
    } catch {
      // anonymous vote
    }

    const voterIp = getClientIp(request);

    const result = await castVote(matchId, playerId, userId, voterName, voterIp);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ message: result.message }, { status: 201 });
  } catch (error) {
    console.error('[API] Cast vote error:', error);
    return NextResponse.json({ error: 'Erro ao registrar voto' }, { status: 500 });
  }
}
