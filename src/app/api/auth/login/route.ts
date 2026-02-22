import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, generateToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha obrigatórios' }, { status: 400 });
    }

    const user = await authenticateUser(email, password);
    if (!user) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const token = generateToken(user);

    const response = NextResponse.json({ user });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24h
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
