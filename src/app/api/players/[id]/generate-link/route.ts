import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { generateEditToken, getPlayerById } from '@/services/playerService';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const player = await getPlayerById(params.id);
    if (!player) return NextResponse.json({ error: 'Jogador não encontrado' }, { status: 404 });

    const result = await generateEditToken(params.id);
    if (!result) return NextResponse.json({ error: 'Erro ao gerar link' }, { status: 500 });

    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
    const link = `${baseUrl}/jogador/completar/${result.token}`;

    return NextResponse.json({ link, token: result.token, expires_at: result.expires_at });
  } catch (error) {
    console.error('[API] Generate edit link error:', error);
    return NextResponse.json({ error: 'Erro ao gerar link' }, { status: 500 });
  }
}
