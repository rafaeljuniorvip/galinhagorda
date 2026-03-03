import Link from 'next/link';
import type { Metadata } from 'next';
import { Newspaper, ArrowLeft, ArrowRight } from 'lucide-react';
import { getPublishedNews, getFeaturedNews } from '@/services/newsPublicService';
import { getAllChampionships } from '@/services/championshipService';
import { Button } from '@/components/ui/button';
import NewsCard from '@/components/public/NewsCard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Noticias - Galinha Gorda',
  description: 'Ultimas noticias dos campeonatos de futebol de Itapecerica-MG',
};

interface Props {
  searchParams: Promise<{ page?: string; campeonato?: string }>;
}

export default async function NoticiasPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const championshipId = params.campeonato || undefined;
  const limit = 9;

  const [{ news, total }, featured, championships] = await Promise.all([
    getPublishedNews(page, limit, championshipId),
    page === 1 && !championshipId ? getFeaturedNews(1) : Promise.resolve([]),
    getAllChampionships(),
  ]);

  const totalPages = Math.ceil(total / limit);
  const featuredArticle = featured[0] || null;

  const gridNews = featuredArticle
    ? news.filter(n => n.id !== featuredArticle.id)
    : news;

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1a237e] to-[#1565c0] text-white py-10 md:py-16 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <Newspaper className="h-12 w-12 text-yellow-400 mx-auto mb-2" />
          <h1 className="text-3xl md:text-4xl font-extrabold">NOTICIAS</h1>
          <p className="text-white/80 mt-2">
            Fique por dentro de tudo que acontece nos campeonatos
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Championship Filter */}
        {championships.length > 0 && (
          <div className="mb-6 flex justify-end flex-wrap gap-1.5">
            <Link
              href="/noticias"
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                !championshipId ? 'bg-[#1a237e] text-white border-[#1a237e]' : 'bg-background hover:bg-muted'
              }`}
            >
              Todos
            </Link>
            {championships.map((c) => (
              <Link
                key={c.id}
                href={`/noticias?campeonato=${c.id}`}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  championshipId === c.id ? 'bg-[#1a237e] text-white border-[#1a237e]' : 'bg-background hover:bg-muted'
                }`}
              >
                {c.name} ({c.year})
              </Link>
            ))}
          </div>
        )}

        {/* Featured News */}
        {featuredArticle && page === 1 && (
          <div className="mb-6">
            <NewsCard article={featuredArticle} featured />
          </div>
        )}

        {/* News Grid */}
        {gridNews.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {gridNews.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Newspaper className="h-16 w-16 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-muted-foreground">
              Nenhuma noticia encontrada
            </h3>
            {championshipId && (
              <Button variant="link" asChild className="mt-2">
                <Link href="/noticias">Ver todas as noticias</Link>
              </Button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            {page > 1 && (
              <Button variant="outline" asChild>
                <Link href={`/noticias?page=${page - 1}${championshipId ? `&campeonato=${championshipId}` : ''}`}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Link>
              </Button>
            )}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'ghost'}
                  size="sm"
                  asChild
                  className={p === page ? 'bg-[#1a237e] hover:bg-[#0d1642]' : ''}
                >
                  <Link href={`/noticias?page=${p}${championshipId ? `&campeonato=${championshipId}` : ''}`}>
                    {p}
                  </Link>
                </Button>
              ))}
            </div>
            {page < totalPages && (
              <Button variant="outline" asChild>
                <Link href={`/noticias?page=${page + 1}${championshipId ? `&campeonato=${championshipId}` : ''}`}>
                  Proxima
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
