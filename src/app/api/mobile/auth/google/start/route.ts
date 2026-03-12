import { NextResponse } from 'next/server';

// GET /api/mobile/auth/google/start - Redirect to Google OAuth consent screen
export async function GET() {
  const clientId = process.env.AUTH_GOOGLE_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL || 'https://galinhagorda.vip'}/api/mobile/auth/google/callback`;

  if (!clientId) {
    return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 500 });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
