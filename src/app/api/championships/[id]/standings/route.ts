import { NextRequest, NextResponse } from 'next/server';
import { getChampionshipStandings, getTopScorers } from '@/services/statsService';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'scorers') {
      const scorers = await getTopScorers(params.id);
      return NextResponse.json(scorers);
    }

    const standings = await getChampionshipStandings(params.id);
    return NextResponse.json(standings);
  } catch (error) {
    console.error('[API] Standings error:', error);
    return NextResponse.json({ error: 'Erro ao buscar classificação' }, { status: 500 });
  }
}
