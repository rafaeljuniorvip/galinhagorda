import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { linkTeamToUser } from '@/services/userService';

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { teamId } = body;

    if (!teamId) {
      return NextResponse.json({ error: 'ID do time obrigatorio' }, { status: 400 });
    }

    const updated = await linkTeamToUser((session.user as any).id, teamId);

    if (!updated) {
      return NextResponse.json({ error: 'Falha ao vincular time' }, { status: 500 });
    }

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('[API] Error linking team:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
