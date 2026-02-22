import { NextRequest, NextResponse } from 'next/server';
import { listPlayers, createPlayer } from '@/services/playerService';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await listPlayers({
      search: searchParams.get('search') || undefined,
      position: searchParams.get('position') || undefined,
      active: searchParams.has('active') ? searchParams.get('active') === 'true' : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] List players error:', error);
    return NextResponse.json({ error: 'Erro ao listar jogadores' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    if (!body.full_name || !body.name || !body.position) {
      return NextResponse.json({ error: 'Nome completo, nome e posição são obrigatórios' }, { status: 400 });
    }

    const player = await createPlayer(body);
    return NextResponse.json(player, { status: 201 });
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'CPF já cadastrado' }, { status: 409 });
    }
    console.error('[API] Create player error:', error);
    return NextResponse.json({ error: 'Erro ao criar jogador' }, { status: 500 });
  }
}
