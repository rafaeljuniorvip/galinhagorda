import { NextRequest, NextResponse } from 'next/server';
import { getChampionshipById, updateChampionship, deleteChampionship } from '@/services/championshipService';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const championship = await getChampionshipById(params.id);
    if (!championship) return NextResponse.json({ error: 'Campeonato não encontrado' }, { status: 404 });
    return NextResponse.json(championship);
  } catch (error) {
    console.error('[API] Get championship error:', error);
    return NextResponse.json({ error: 'Erro ao buscar campeonato' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const championship = await updateChampionship(params.id, body);
    if (!championship) return NextResponse.json({ error: 'Campeonato não encontrado' }, { status: 404 });
    return NextResponse.json(championship);
  } catch (error) {
    console.error('[API] Update championship error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar campeonato' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const deleted = await deleteChampionship(params.id);
    if (!deleted) return NextResponse.json({ error: 'Campeonato não encontrado' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[API] Delete championship error:', error);
    return NextResponse.json({ error: 'Erro ao excluir campeonato' }, { status: 500 });
  }
}
