import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Calendar, Eye, User, Share2 } from 'lucide-react';
import { getNewsBySlug, getRelatedNews } from '@/services/newsPublicService';
import { formatDateTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import NewsCard from '@/components/public/NewsCard';

export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getNewsBySlug(params.slug);
  if (!article) return { title: 'Noticia nao encontrada' };

  return {
    title: `${article.title} - Galinha Gorda`,
    description: article.summary || article.title,
    openGraph: {
      title: article.title,
      description: article.summary || article.title,
      type: 'article',
      publishedTime: article.published_at,
      ...(article.cover_image && { images: [article.cover_image] }),
    },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const article = await getNewsBySlug(params.slug);
  if (!article) notFound();

  const relatedNews = await getRelatedNews(article.id, 3);

  const shareUrl = `/noticias/${article.slug}`;
  const shareText = encodeURIComponent(article.title);

  return (
    <div>
      {/* Cover Image Hero */}
      <div
        className="w-full h-[250px] md:h-[400px] flex items-end"
        style={{
          background: article.cover_image
            ? `linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%), url(${article.cover_image}) center/cover no-repeat`
            : 'linear-gradient(135deg, #1a237e 0%, #1565c0 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 pb-8 w-full">
          <Button
            variant="ghost"
            asChild
            className="text-white hover:bg-white/10 mb-3"
          >
            <Link href="/noticias">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar para noticias
            </Link>
          </Button>
          {article.championship_name && (
            <Badge className="bg-yellow-400 text-[#1a237e] font-bold mb-2 block w-fit">
              {article.championship_name}
            </Badge>
          )}
          <h1 className="text-2xl md:text-4xl font-extrabold text-white max-w-[800px] drop-shadow-lg">
            {article.title}
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8">
          {/* Main Content */}
          <div>
            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              {article.author_name && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  {article.author_name}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {formatDateTime(article.published_at || article.created_at)}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                {article.views_count} visualizacoes
              </div>
            </div>

            {/* Summary */}
            {article.summary && (
              <p className="text-lg text-muted-foreground italic mb-4 border-l-4 border-blue-600 pl-3">
                {article.summary}
              </p>
            )}

            <Separator className="mb-4" />

            {/* Content */}
            <div
              className="prose prose-lg max-w-none
                [&_p]:mb-4 [&_p]:leading-7 [&_p]:text-foreground
                [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:font-bold [&_h2]:text-[#1a237e]
                [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-semibold [&_h3]:text-[#1a237e]
                [&_img]:max-w-full [&_img]:rounded [&_img]:my-4
                [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:pl-6 [&_ol]:mb-4
                [&_li]:mb-1 [&_li]:leading-7
                [&_blockquote]:border-l-4 [&_blockquote]:border-yellow-400 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:my-4 [&_blockquote]:bg-muted [&_blockquote]:rounded-r"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            <Separator className="my-6" />

            {/* Share Buttons */}
            <div className="flex items-center gap-3 mb-6">
              <Share2 className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-semibold text-muted-foreground">Compartilhar:</span>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
              >
                <a
                  href={`https://api.whatsapp.com/send?text=${shareText}%20${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener"
                >
                  WhatsApp
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
              >
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener"
                >
                  Facebook
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-sky-500 text-sky-500 hover:bg-sky-500 hover:text-white"
              >
                <a
                  href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener"
                >
                  Twitter
                </a>
              </Button>
            </div>
          </div>

          {/* Sidebar - Related News */}
          <div>
            {relatedNews.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-[#1a237e] mb-3">
                  NOTICIAS RELACIONADAS
                </h3>
                <div className="flex flex-col gap-3">
                  {relatedNews.map((related) => (
                    <NewsCard key={related.id} article={related} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
