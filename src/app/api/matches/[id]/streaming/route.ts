import { NextRequest, NextResponse } from 'next/server';
import {
  getStreamingLinks,
  createStreamingLink,
  deleteStreamingLink,
} from '@/services/streamingService';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const links = await getStreamingLinks(params.id);
    return NextResponse.json(links);
  } catch (error) {
    console.error('[API] Get streaming links error:', error);
    return NextResponse.json({ error: 'Erro ao buscar links de transmissao' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

    const body = await request.json();
    if (!body.platform || !body.url) {
      return NextResponse.json(
        { error: 'Plataforma e URL sao obrigatorios' },
        { status: 400 }
      );
    }

    const link = await createStreamingLink({
      ...body,
      match_id: params.id,
      created_by: user.id,
    });
    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    console.error('[API] Create streaming link error:', error);
    return NextResponse.json({ error: 'Erro ao criar link de transmissao' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('link_id');
    if (!linkId) {
      return NextResponse.json({ error: 'ID do link e obrigatorio' }, { status: 400 });
    }

    const deleted = await deleteStreamingLink(linkId);
    if (!deleted) {
      return NextResponse.json({ error: 'Link nao encontrado' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[API] Delete streaming link error:', error);
    return NextResponse.json({ error: 'Erro ao excluir link de transmissao' }, { status: 500 });
  }
}
