import { NextRequest, NextResponse } from 'next/server';
import { listChampionships, getAllChampionships, createChampionship } from '@/services/championshipService';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    if (searchParams.get('all') === 'true') {
      const championships = await getAllChampionships();
      return NextResponse.json(championships);
    }

    const result = await listChampionships({
      search: searchParams.get('search') || undefined,
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
      status: searchParams.get('status') || undefined,
      active: searchParams.has('active') ? searchParams.get('active') === 'true' : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] List championships error:', error);
    return NextResponse.json({ error: 'Erro ao listar campeonatos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    if (!body.name || !body.year) {
      return NextResponse.json({ error: 'Nome e ano são obrigatórios' }, { status: 400 });
    }

    const championship = await createChampionship(body);
    return NextResponse.json(championship, { status: 201 });
  } catch (error) {
    console.error('[API] Create championship error:', error);
    return NextResponse.json({ error: 'Erro ao criar campeonato' }, { status: 500 });
  }
}
