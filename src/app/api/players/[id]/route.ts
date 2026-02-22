import { NextRequest, NextResponse } from 'next/server';
import { getPlayerById, updatePlayer, deletePlayer } from '@/services/playerService';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const player = await getPlayerById(params.id);
    if (!player) return NextResponse.json({ error: 'Jogador não encontrado' }, { status: 404 });
    return NextResponse.json(player);
  } catch (error) {
    console.error('[API] Get player error:', error);
    return NextResponse.json({ error: 'Erro ao buscar jogador' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const player = await updatePlayer(params.id, body);
    if (!player) return NextResponse.json({ error: 'Jogador não encontrado' }, { status: 404 });
    return NextResponse.json(player);
  } catch (error) {
    console.error('[API] Update player error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar jogador' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const deleted = await deletePlayer(params.id);
    if (!deleted) return NextResponse.json({ error: 'Jogador não encontrado' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[API] Delete player error:', error);
    return NextResponse.json({ error: 'Erro ao excluir jogador' }, { status: 500 });
  }
}
