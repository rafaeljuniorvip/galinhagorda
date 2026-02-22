import { NextRequest, NextResponse } from 'next/server';
import { likeMessage } from '@/services/fanMessageService';
import { getAuthUser } from '@/lib/auth';

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let userId: string | undefined;
    try {
      const user = await getAuthUser(request);
      if (user) userId = user.id;
    } catch {
      // anonymous like
    }

    const voterIp = getClientIp(request);

    const result = await likeMessage(id, userId, voterIp);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Like message error:', error);
    return NextResponse.json({ error: 'Erro ao curtir mensagem' }, { status: 500 });
  }
}
