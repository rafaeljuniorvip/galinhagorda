import { NextRequest, NextResponse } from 'next/server';
import { getNewsById, updateNews, deleteNews, incrementViews } from '@/services/newsService';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const news = await getNewsById(params.id);
    if (!news) return NextResponse.json({ error: 'Noticia nao encontrada' }, { status: 404 });

    // Increment views for public access
    const user = await getAuthUser(request);
    if (!user) {
      await incrementViews(params.id);
    }

    return NextResponse.json(news);
  } catch (error) {
    console.error('[API] Get news error:', error);
    return NextResponse.json({ error: 'Erro ao buscar noticia' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const news = await updateNews(params.id, body);
    if (!news) return NextResponse.json({ error: 'Noticia nao encontrada' }, { status: 404 });
    return NextResponse.json(news);
  } catch (error) {
    console.error('[API] Update news error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar noticia' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const deleted = await deleteNews(params.id);
    if (!deleted) return NextResponse.json({ error: 'Noticia nao encontrada' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[API] Delete news error:', error);
    return NextResponse.json({ error: 'Erro ao excluir noticia' }, { status: 500 });
  }
}
