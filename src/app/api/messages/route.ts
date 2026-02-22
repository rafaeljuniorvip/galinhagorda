import { NextRequest, NextResponse } from 'next/server';
import { getMessages, createMessage, getAllMessages } from '@/services/fanMessageService';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('targetType');
    const targetId = searchParams.get('targetId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const all = searchParams.get('all');

    // Admin listing: all messages with optional approval filter
    if (all === 'true') {
      const user = await getAuthUser(request);
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

      const approved = searchParams.has('approved') ? searchParams.get('approved') === 'true' : undefined;
      const result = await getAllMessages(page, limit, approved);
      return NextResponse.json(result);
    }

    if (!targetType || !targetId) {
      return NextResponse.json({ error: 'targetType e targetId so obrigatrios' }, { status: 400 });
    }

    const validTypes = ['match', 'player', 'team', 'championship'];
    if (!validTypes.includes(targetType)) {
      return NextResponse.json({ error: 'targetType invlido' }, { status: 400 });
    }

    const result = await getMessages(targetType, targetId, page, limit);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Get messages error:', error);
    return NextResponse.json({ error: 'Erro ao buscar mensagens' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetType, targetId, message, authorName } = body;

    if (!targetType || !targetId || !message) {
      return NextResponse.json({ error: 'targetType, targetId e message so obrigatrios' }, { status: 400 });
    }

    const validTypes = ['match', 'player', 'team', 'championship'];
    if (!validTypes.includes(targetType)) {
      return NextResponse.json({ error: 'targetType invlido' }, { status: 400 });
    }

    if (message.length > 280) {
      return NextResponse.json({ error: 'Mensagem deve ter no mximo 280 caracteres' }, { status: 400 });
    }

    let userId: string | undefined;
    let userName: string = authorName || 'Torcedor Annimo';
    let userAvatar: string | undefined;

    try {
      const user = await getAuthUser(request);
      if (user) {
        userId = user.id;
        userName = user.name;
      }
    } catch {
      // anonymous message
    }

    if (!authorName && !userId) {
      return NextResponse.json({ error: 'Nome do autor obrigatrio para mensagens annimas' }, { status: 400 });
    }

    const newMessage = await createMessage({
      userId,
      authorName: userName,
      authorAvatar: userAvatar,
      targetType,
      targetId,
      message,
    });

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error('[API] Create message error:', error);
    return NextResponse.json({ error: 'Erro ao criar mensagem' }, { status: 500 });
  }
}
