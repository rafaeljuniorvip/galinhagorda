import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserById, updateUserProfile } from '@/services/userService';

export async function GET(_request: NextRequest) {
  const session = await auth();

  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
  }

  const user = await getUserById((session.user as any).id);
  if (!user) {
    return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PUT(request: NextRequest) {
  const session = await auth();

  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, bio, phone, city, state } = body;

    const updated = await updateUserProfile((session.user as any).id, {
      name,
      bio,
      phone,
      city,
      state,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Falha ao atualizar perfil' }, { status: 500 });
    }

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('[API] Error updating profile:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
