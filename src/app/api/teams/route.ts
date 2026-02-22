import { NextRequest, NextResponse } from 'next/server';
import { listTeams, getAllTeams, createTeam } from '@/services/teamService';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    if (searchParams.get('all') === 'true') {
      const teams = await getAllTeams();
      return NextResponse.json(teams);
    }

    const result = await listTeams({
      search: searchParams.get('search') || undefined,
      active: searchParams.has('active') ? searchParams.get('active') === 'true' : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] List teams error:', error);
    return NextResponse.json({ error: 'Erro ao listar times' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: 'Nome do time é obrigatório' }, { status: 400 });
    }

    const team = await createTeam(body);
    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error('[API] Create team error:', error);
    return NextResponse.json({ error: 'Erro ao criar time' }, { status: 500 });
  }
}
