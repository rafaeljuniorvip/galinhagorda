'use client';

import { Box, Card, CardContent, CardActionArea, Typography, Chip } from '@mui/material';
import Link from 'next/link';
import { NewsArticle } from '@/types';
import { formatDate } from '@/lib/utils';
import { CalendarMonth, Visibility } from '@mui/icons-material';

interface Props {
  article: NewsArticle;
  featured?: boolean;
}

export default function NewsCard({ article, featured = false }: Props) {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
      }}
    >
      <CardActionArea
        component={Link}
        href={`/noticias/${article.slug}`}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
        }}
      >
        {/* Cover Image */}
        <Box
          sx={{
            width: '100%',
            height: featured ? { xs: 200, md: 280 } : 180,
            background: article.cover_image
              ? `url(${article.cover_image}) center/cover no-repeat`
              : 'linear-gradient(135deg, #1a237e 0%, #1565c0 50%, #0d47a1 100%)',
            position: 'relative',
          }}
        >
          {article.is_featured && (
            <Chip
              label="DESTAQUE"
              size="small"
              sx={{
                position: 'absolute',
                top: 12,
                left: 12,
                bgcolor: '#ffd600',
                color: '#1a237e',
                fontWeight: 700,
                fontSize: '0.7rem',
              }}
            />
          )}
          {article.championship_name && (
            <Chip
              label={article.championship_name}
              size="small"
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                bgcolor: 'rgba(0,0,0,0.7)',
                color: 'white',
                fontSize: '0.7rem',
              }}
            />
          )}
        </Box>

        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: featured ? 3 : 2 }}>
          <Typography
            variant={featured ? 'h5' : 'h6'}
            fontWeight={700}
            sx={{
              mb: 1,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.3,
            }}
          >
            {article.title}
          </Typography>

          {article.summary && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                flex: 1,
                display: '-webkit-box',
                WebkitLineClamp: featured ? 4 : 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {article.summary}
            </Typography>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CalendarMonth sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {formatDate(article.published_at)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Visibility sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {article.views_count}
              </Typography>
            </Box>
          </Box>

          <Typography
            variant="caption"
            fontWeight={600}
            sx={{ color: '#1976d2', mt: 1 }}
          >
            Leia mais &rarr;
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
