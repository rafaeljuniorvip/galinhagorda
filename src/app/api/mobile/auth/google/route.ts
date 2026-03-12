import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { getOne } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me'
);
const TOKEN_EXPIRY = '7d';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'superadmin';
  active: boolean;
}

// POST /api/mobile/auth/google - Login with Google ID token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id_token } = body;

    if (!id_token) {
      return jsonResponse({ error: 'Token do Google não fornecido' }, 400);
    }

    // Verify Google ID token
    const googleRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`
    );

    if (!googleRes.ok) {
      return jsonResponse({ error: 'Token do Google inválido' }, 401);
    }

    const googleData = await googleRes.json();
    const { email, name, picture } = googleData;

    if (!email) {
      return jsonResponse({ error: 'Email não disponível no token do Google' }, 400);
    }

    // Check if email exists in admin_users
    const user = await getOne<AdminUser>(
      'SELECT id, name, email, role, active FROM admin_users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (!user) {
      return jsonResponse(
        { error: 'Acesso negado. Este email não está cadastrado como administrador.' },
        403
      );
    }

    if (!user.active) {
      return jsonResponse({ error: 'Usuário desativado' }, 403);
    }

    // Generate JWT
    const token = await new SignJWT({
      sub: user.id,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(TOKEN_EXPIRY)
      .sign(JWT_SECRET);

    return jsonResponse({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('[Mobile Auth Google] Error:', error);
    return jsonResponse({ error: 'Erro interno do servidor' }, 500);
  }
}
