import { NextRequest, NextResponse } from 'next/server';
import { listReferees, getAllReferees, createReferee } from '@/services/refereeService';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    if (searchParams.get('all') === 'true') {
      const referees = await getAllReferees();
      return NextResponse.json(referees);
    }

    const result = await listReferees({
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      active: searchParams.has('active') ? searchParams.get('active') === 'true' : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] List referees error:', error);
    return NextResponse.json({ error: 'Erro ao listar arbitros' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: 'Nome e obrigatorio' }, { status: 400 });
    }

    const referee = await createReferee(body);
    return NextResponse.json(referee, { status: 201 });
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'CPF ja cadastrado' }, { status: 400 });
    }
    console.error('[API] Create referee error:', error);
    return NextResponse.json({ error: 'Erro ao criar arbitro' }, { status: 500 });
  }
}
