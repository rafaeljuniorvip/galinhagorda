import { NextRequest, NextResponse } from 'next/server';
import { getRefereeById, updateReferee, deleteReferee } from '@/services/refereeService';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const referee = await getRefereeById(params.id);
    if (!referee) return NextResponse.json({ error: 'Arbitro nao encontrado' }, { status: 404 });
    return NextResponse.json(referee);
  } catch (error) {
    console.error('[API] Get referee error:', error);
    return NextResponse.json({ error: 'Erro ao buscar arbitro' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

    const body = await request.json();
    const referee = await updateReferee(params.id, body);
    if (!referee) return NextResponse.json({ error: 'Arbitro nao encontrado' }, { status: 404 });
    return NextResponse.json(referee);
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'CPF ja cadastrado' }, { status: 400 });
    }
    console.error('[API] Update referee error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar arbitro' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

    const deleted = await deleteReferee(params.id);
    if (!deleted) return NextResponse.json({ error: 'Arbitro nao encontrado' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[API] Delete referee error:', error);
    return NextResponse.json({ error: 'Erro ao excluir arbitro' }, { status: 500 });
  }
}
