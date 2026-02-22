import { NextRequest, NextResponse } from 'next/server';
import { getPlayerStats } from '@/services/statsService';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const championshipId = searchParams.get('championship_id') || undefined;
    const stats = await getPlayerStats(params.id, championshipId);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('[API] Player stats error:', error);
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 });
  }
}
