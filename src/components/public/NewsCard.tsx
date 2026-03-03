'use client';

import Link from 'next/link';
import { Calendar, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import { NewsArticle } from '@/types';
import { formatDate } from '@/lib/utils';

interface Props {
  article: NewsArticle;
  featured?: boolean;
}

export default function NewsCard({ article, featured = false }: Props) {
  return (
    <div
      className={cn(
        'h-full rounded-lg overflow-hidden border border-border transition-all duration-200',
        'hover:-translate-y-1 hover:shadow-lg group'
      )}
    >
      <Link
        href={`/noticias/${article.slug}`}
        className="flex h-full flex-col no-underline text-inherit"
      >
        {/* Cover Image with overlay */}
        <div
          className={cn(
            'w-full relative overflow-hidden',
            featured ? 'h-[200px] md:h-[280px]' : 'h-[180px]'
          )}
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-300 group-hover:scale-105"
            style={{
              backgroundImage: article.cover_image
                ? `url(${article.cover_image})`
                : undefined,
              background: !article.cover_image
                ? 'linear-gradient(135deg, #1a237e 0%, #1565c0 50%, #0d47a1 100%)'
                : undefined,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {article.is_featured && (
              <Badge className="bg-[#ffd600] text-[#0d1b2a] font-bold text-[0.65rem] hover:bg-[#ffd600]/90 border-transparent shadow-sm">
                DESTAQUE
              </Badge>
            )}
          </div>
          {article.championship_name && (
            <Badge className="absolute top-3 right-3 bg-black/50 text-white text-[0.65rem] hover:bg-black/60 border-transparent backdrop-blur-sm">
              {article.championship_name}
            </Badge>
          )}

          {/* Title overlay on image */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3
              className={cn(
                'text-white font-bold line-clamp-2 leading-tight drop-shadow-sm',
                featured ? 'text-xl' : 'text-base'
              )}
            >
              {article.title}
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className={cn('flex flex-1 flex-col bg-white', featured ? 'p-5' : 'p-4')}>
          {article.summary && (
            <p
              className={cn(
                'text-sm text-muted-foreground mb-4 flex-1 leading-relaxed',
                featured ? 'line-clamp-4' : 'line-clamp-2'
              )}
            >
              {article.summary}
            </p>
          )}

          <div className="flex items-center gap-4 mt-auto pt-2 border-t border-border/30">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">
                {formatDate(article.published_at)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">
                {article.views_count}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-[#1a237e] ml-auto">
              Leia mais &rarr;
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
