import { NextRequest, NextResponse } from 'next/server';
import { getMatchesByPlayer } from '@/services/matchService';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const championshipId = searchParams.get('championship_id') || undefined;
    const matches = await getMatchesByPlayer(params.id, championshipId);
    return NextResponse.json(matches);
  } catch (error) {
    console.error('[API] Get player matches error:', error);
    return NextResponse.json({ error: 'Erro ao buscar partidas do jogador' }, { status: 500 });
  }
}
