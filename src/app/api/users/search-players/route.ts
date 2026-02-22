import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { searchPlayers } from '@/services/userService';

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  if (q.length < 2) {
    return NextResponse.json({ players: [] });
  }

  const players = await searchPlayers(q);
  return NextResponse.json({ players });
}
