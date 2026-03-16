import { NextRequest, NextResponse } from 'next/server';
import { getDisciplinaryRanking, getTeamFairPlayRanking } from '@/services/statsService';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'players';
    const limit = parseInt(searchParams.get('limit') || '50');

    if (type === 'teams') {
      const data = await getTeamFairPlayRanking(params.id);
      return NextResponse.json(data);
    }

    const data = await getDisciplinaryRanking(params.id, limit);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] Discipline ranking error:', error);
    return NextResponse.json({ error: 'Erro ao buscar ranking disciplinar' }, { status: 500 });
  }
}
