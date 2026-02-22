import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { linkPlayerToUser } from '@/services/userService';

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { playerId } = body;

    if (!playerId) {
      return NextResponse.json({ error: 'ID do jogador obrigatorio' }, { status: 400 });
    }

    const updated = await linkPlayerToUser((session.user as any).id, playerId);

    if (!updated) {
      return NextResponse.json({ error: 'Falha ao vincular jogador' }, { status: 500 });
    }

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('[API] Error linking player:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
