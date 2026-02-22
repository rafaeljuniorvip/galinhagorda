import { NextRequest, NextResponse } from 'next/server';
import { getMatchById, updateMatch, deleteMatch } from '@/services/matchService';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const match = await getMatchById(params.id);
    if (!match) return NextResponse.json({ error: 'Partida não encontrada' }, { status: 404 });
    return NextResponse.json(match);
  } catch (error) {
    console.error('[API] Get match error:', error);
    return NextResponse.json({ error: 'Erro ao buscar partida' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const match = await updateMatch(params.id, body);
    if (!match) return NextResponse.json({ error: 'Partida não encontrada' }, { status: 404 });
    return NextResponse.json(match);
  } catch (error) {
    console.error('[API] Update match error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar partida' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const deleted = await deleteMatch(params.id);
    if (!deleted) return NextResponse.json({ error: 'Partida não encontrada' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[API] Delete match error:', error);
    return NextResponse.json({ error: 'Erro ao excluir partida' }, { status: 500 });
  }
}
