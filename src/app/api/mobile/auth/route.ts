import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { getOne } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me'
);
const TOKEN_EXPIRY = '7d';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'superadmin';
  active: boolean;
}

function userResponse(user: Omit<AdminUser, 'password_hash' | 'active'>) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

// POST /api/mobile/auth - Login with email & password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const user = await getOne<AdminUser>(
      'SELECT id, name, email, password_hash, role, active FROM admin_users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    if (!user.active) {
      return NextResponse.json(
        { error: 'Usuário desativado' },
        { status: 403 }
      );
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    const token = await new SignJWT({
      sub: user.id,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(TOKEN_EXPIRY)
      .sign(JWT_SECRET);

    return NextResponse.json({
      token,
      user: userResponse(user),
    });
  } catch (error) {
    console.error('[Mobile Auth] Login error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET /api/mobile/auth - Validate token & return user info
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);

    let payload;
    try {
      const result = await jwtVerify(token, JWT_SECRET);
      payload = result.payload;
    } catch {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    const user = await getOne<AdminUser>(
      'SELECT id, name, email, role, active FROM admin_users WHERE id = $1',
      [payload.sub]
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 401 }
      );
    }

    if (!user.active) {
      return NextResponse.json(
        { error: 'Usuário desativado' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      user: userResponse(user),
    });
  } catch (error) {
    console.error('[Mobile Auth] Token validation error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
