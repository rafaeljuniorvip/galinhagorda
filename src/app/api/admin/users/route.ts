import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getMany, getOne, query } from '@/lib/db';
import { User } from '@/types';

async function getSuperAdmin(): Promise<{ id: string; role: string } | null> {
  const session = await auth();
  if (!session?.user?.email) return null;
  const user = session.user as any;
  if (user.role !== 'superadmin') return null;
  return { id: user.id, role: user.role };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await getSuperAdmin();
    if (!admin) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    let sql = `SELECT id, email, name, avatar_url, role, is_active, created_at FROM users`;
    const params: any[] = [];

    if (search) {
      sql += ` WHERE (name ILIKE $1 OR email ILIKE $1)`;
      params.push(`%${search}%`);
    }

    sql += ` ORDER BY CASE role WHEN 'superadmin' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, name ASC`;

    const users = await getMany(sql, params);
    return NextResponse.json(users);
  } catch (error) {
    console.error('[API] List users error:', error);
    return NextResponse.json({ error: 'Erro ao listar usuarios' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getSuperAdmin();
    if (!admin) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId e role sao obrigatorios' }, { status: 400 });
    }

    if (!['admin', 'fan'].includes(role)) {
      return NextResponse.json({ error: 'Role invalido. Use admin ou fan.' }, { status: 400 });
    }

    // Prevent changing own role
    if (userId === admin.id) {
      return NextResponse.json({ error: 'Voce nao pode alterar seu proprio role' }, { status: 400 });
    }

    // Prevent changing another superadmin
    const target = await getOne<User>('SELECT role FROM users WHERE id = $1', [userId]);
    if (!target) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });
    }
    if (target.role === 'superadmin') {
      return NextResponse.json({ error: 'Nao e possivel alterar um superadmin' }, { status: 400 });
    }

    await query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [role, userId]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[API] Update user role error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar role' }, { status: 500 });
  }
}
