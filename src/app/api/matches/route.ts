import { NextRequest, NextResponse } from 'next/server';
import { listMatches, createMatch } from '@/services/matchService';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await listMatches({
      championship_id: searchParams.get('championship_id') || undefined,
      team_id: searchParams.get('team_id') || undefined,
      status: searchParams.get('status') || undefined,
      match_round: searchParams.get('match_round') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] List matches error:', error);
    return NextResponse.json({ error: 'Erro ao listar partidas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    if (!body.championship_id || !body.home_team_id || !body.away_team_id) {
      return NextResponse.json({ error: 'Campeonato, time mandante e visitante são obrigatórios' }, { status: 400 });
    }

    const match = await createMatch(body);
    return NextResponse.json(match, { status: 201 });
  } catch (error: any) {
    if (error?.code === '23514') {
      return NextResponse.json({ error: 'Time mandante e visitante devem ser diferentes' }, { status: 400 });
    }
    console.error('[API] Create match error:', error);
    return NextResponse.json({ error: 'Erro ao criar partida' }, { status: 500 });
  }
}
