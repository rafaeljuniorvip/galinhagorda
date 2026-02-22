import { NextRequest, NextResponse } from 'next/server';
import { listNews, createNews } from '@/services/newsService';
import { getAuthUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await listNews({
      search: searchParams.get('search') || undefined,
      championshipId: searchParams.get('championship_id') || undefined,
      published: searchParams.has('published') ? searchParams.get('published') === 'true' : undefined,
      featured: searchParams.has('featured') ? searchParams.get('featured') === 'true' : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] List news error:', error);
    return NextResponse.json({ error: 'Erro ao listar noticias' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    if (!body.title || !body.content) {
      return NextResponse.json({ error: 'Titulo e conteudo sao obrigatorios' }, { status: 400 });
    }

    const slug = body.slug || slugify(body.title);

    const news = await createNews({
      ...body,
      slug,
      author_id: user.id,
    });
    return NextResponse.json(news, { status: 201 });
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Ja existe uma noticia com este slug' }, { status: 409 });
    }
    console.error('[API] Create news error:', error);
    return NextResponse.json({ error: 'Erro ao criar noticia' }, { status: 500 });
  }
}
