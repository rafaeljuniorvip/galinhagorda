import { NextRequest, NextResponse } from 'next/server';
import { deleteMessage, toggleApproval, togglePin, getMessageById } from '@/services/fanMessageService';
import { getAuthUser } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Check if user owns the message or is admin
    const message = await getMessageById(id);
    if (!message) {
      return NextResponse.json({ error: 'Mensagem no encontrada' }, { status: 404 });
    }

    if (message.user_id !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permisso para excluir esta mensagem' }, { status: 403 });
    }

    await deleteMessage(id);
    return NextResponse.json({ message: 'Mensagem excluida com sucesso' });
  } catch (error) {
    console.error('[API] Delete message error:', error);
    return NextResponse.json({ error: 'Erro ao excluir mensagem' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Apenas administradores podem moderar mensagens' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'toggleApproval') {
      const updated = await toggleApproval(id);
      return NextResponse.json(updated);
    }

    if (action === 'togglePin') {
      const updated = await togglePin(id);
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'Ao invlida' }, { status: 400 });
  } catch (error) {
    console.error('[API] Patch message error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar mensagem' }, { status: 500 });
  }
}
