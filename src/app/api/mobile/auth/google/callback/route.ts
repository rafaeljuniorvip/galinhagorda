import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { getOne, query } from '@/lib/db';
import { generateDemoData } from '@/services/demoDataService';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me'
);
const TOKEN_EXPIRY = '7d';
const MOBILE_SCHEME = 'galinhagorda';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

// GET /api/mobile/auth/google/callback - Google OAuth callback for mobile
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(
      `${MOBILE_SCHEME}://auth?error=${encodeURIComponent(error || 'Código de autorização não recebido')}`
    );
  }

  try {
    const clientId = process.env.AUTH_GOOGLE_ID!;
    const clientSecret = process.env.AUTH_GOOGLE_SECRET!;
    const redirectUri = `${process.env.NEXTAUTH_URL || 'https://galinhagorda.vip'}/api/mobile/auth/google/callback`;

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errData = await tokenRes.json();
      console.error('[Mobile Google Callback] Token exchange failed:', errData);
      return NextResponse.redirect(
        `${MOBILE_SCHEME}://auth?error=${encodeURIComponent('Falha na troca do token com Google')}`
      );
    }

    const tokenData = await tokenRes.json();

    // Get user info from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoRes.ok) {
      return NextResponse.redirect(
        `${MOBILE_SCHEME}://auth?error=${encodeURIComponent('Falha ao obter dados do Google')}`
      );
    }

    const googleUser = await userInfoRes.json();
    const { email, name, picture } = googleUser;

    if (!email) {
      return NextResponse.redirect(
        `${MOBILE_SCHEME}://auth?error=${encodeURIComponent('Email não disponível na conta Google')}`
      );
    }

    const emailLower = email.toLowerCase().trim();

    // Check if user exists
    let user = await getOne<UserRow>(
      `SELECT id, name, email, role, is_active FROM users WHERE email = $1`,
      [emailLower]
    );

    if (user && !user.is_active) {
      return NextResponse.redirect(
        `${MOBILE_SCHEME}://auth?error=${encodeURIComponent('Usuário desativado')}`
      );
    }

    // If user doesn't exist or is not admin, create/promote and generate demo data
    if (!user) {
      // Create new user as admin
      const result = await query(
        `INSERT INTO users (id, email, name, avatar_url, provider, role, is_active)
         VALUES (gen_random_uuid(), $1, $2, $3, 'google', 'admin', true)
         RETURNING id, name, email, role, is_active`,
        [emailLower, name || emailLower.split('@')[0], picture || null]
      );
      user = result.rows[0];

      // Generate demo championship for new user
      try {
        await generateDemoData();
        console.log(`[Mobile Google Callback] Demo data generated for new user: ${emailLower}`);
      } catch (demoErr) {
        console.error('[Mobile Google Callback] Failed to generate demo data:', demoErr);
        // Continue login even if demo data fails
      }
    } else if (user.role !== 'admin' && user.role !== 'superadmin') {
      // Promote existing non-admin user to admin
      await query(
        `UPDATE users SET role = 'admin' WHERE id = $1`,
        [user.id]
      );
      user = { ...user, role: 'admin' };

      // Generate demo championship
      try {
        await generateDemoData();
        console.log(`[Mobile Google Callback] Demo data generated for promoted user: ${emailLower}`);
      } catch (demoErr) {
        console.error('[Mobile Google Callback] Failed to generate demo data:', demoErr);
      }
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

    // Redirect to mobile app with token and user data
    const userData = encodeURIComponent(JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }));

    return NextResponse.redirect(
      `${MOBILE_SCHEME}://auth?token=${token}&user=${userData}`
    );
  } catch (err) {
    console.error('[Mobile Google Callback] Error:', err);
    return NextResponse.redirect(
      `${MOBILE_SCHEME}://auth?error=${encodeURIComponent('Erro interno do servidor')}`
    );
  }
}
