import { NextRequest, NextResponse } from 'next/server';
import { getPlayerByToken, updatePlayerByToken } from '@/services/playerService';

export async function GET(_request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const player = await getPlayerByToken(params.token);
    if (!player) {
      return NextResponse.json({ error: 'Link inválido ou expirado' }, { status: 404 });
    }

    // Return player data without sensitive fields
    const { cpf, rg, notes, edit_token, edit_token_expires_at, ...safeData } = player as any;
    return NextResponse.json(safeData);
  } catch (error) {
    console.error('[API] Get player by token error:', error);
    return NextResponse.json({ error: 'Erro ao buscar jogador' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const body = await request.json();
    const player = await updatePlayerByToken(params.token, body);
    if (!player) {
      return NextResponse.json({ error: 'Link inválido ou expirado' }, { status: 404 });
    }

    const { cpf, rg, notes, edit_token, edit_token_expires_at, ...safeData } = player as any;
    return NextResponse.json(safeData);
  } catch (error) {
    console.error('[API] Update player by token error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar jogador' }, { status: 500 });
  }
}
