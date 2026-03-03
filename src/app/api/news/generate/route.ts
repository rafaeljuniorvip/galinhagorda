import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { generateAINews } from '@/services/aiNewsService';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { championship_id, count = 3 } = body;

    if (count < 1 || count > 10) {
      return NextResponse.json({ error: 'Quantidade deve ser entre 1 e 10' }, { status: 400 });
    }

    const result = await generateAINews({
      championship_id: championship_id || undefined,
      count,
      author_id: user.id,
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      articles: result.articles,
    });
  } catch (error: any) {
    console.error('[API] Generate AI news error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar noticias com IA' },
      { status: 500 }
    );
  }
}
