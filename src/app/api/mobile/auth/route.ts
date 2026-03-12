import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { getOne } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me'
);
const TOKEN_EXPIRY = '7d';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders });
}

// OPTIONS /api/mobile/auth - CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string | null;
  role: string;
  is_active: boolean;
  avatar_url: string | null;
}

function userResponse(user: UserRow) {
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
      return jsonResponse({ error: 'Email e senha são obrigatórios' }, 400);
    }

    const user = await getOne<UserRow>(
      `SELECT id, name, email, password_hash, role, is_active, avatar_url
       FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    if (!user) {
      return jsonResponse({ error: 'Credenciais inválidas' }, 401);
    }

    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return jsonResponse({ error: 'Acesso restrito a administradores' }, 403);
    }

    if (!user.is_active) {
      return jsonResponse({ error: 'Usuário desativado' }, 403);
    }

    if (!user.password_hash) {
      return jsonResponse({ error: 'Este usuário não possui senha. Use o login com Google.' }, 400);
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      return jsonResponse({ error: 'Credenciais inválidas' }, 401);
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

    return jsonResponse({ token, user: userResponse(user) });
  } catch (error) {
    console.error('[Mobile Auth] Login error:', error);
    return jsonResponse({ error: 'Erro interno do servidor' }, 500);
  }
}

// GET /api/mobile/auth - Validate token & return user info
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Token não fornecido' }, 401);
    }

    const token = authHeader.slice(7);

    let payload;
    try {
      const result = await jwtVerify(token, JWT_SECRET);
      payload = result.payload;
    } catch {
      return jsonResponse({ error: 'Token inválido ou expirado' }, 401);
    }

    const user = await getOne<UserRow>(
      `SELECT id, name, email, role, is_active, avatar_url
       FROM users WHERE id = $1`,
      [payload.sub]
    );

    if (!user) {
      return jsonResponse({ error: 'Usuário não encontrado' }, 401);
    }

    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return jsonResponse({ error: 'Acesso restrito a administradores' }, 403);
    }

    if (!user.is_active) {
      return jsonResponse({ error: 'Usuário desativado' }, 403);
    }

    return jsonResponse({ user: userResponse(user) });
  } catch (error) {
    console.error('[Mobile Auth] Token validation error:', error);
    return jsonResponse({ error: 'Erro interno do servidor' }, 500);
  }
}
