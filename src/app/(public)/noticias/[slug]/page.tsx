import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  Box, Container, Typography, Grid, Chip, Avatar, Divider, IconButton, Button,
  Card, CardContent,
} from '@mui/material';
import {
  CalendarMonth, Visibility, Person, Share, ArrowBack,
} from '@mui/icons-material';
import Link from 'next/link';
import { getNewsBySlug, getRelatedNews } from '@/services/newsPublicService';
import { formatDate, formatDateTime } from '@/lib/utils';
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

  // Build share URLs
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/noticias/${article.slug}`
    : `/noticias/${article.slug}`;
  const shareText = encodeURIComponent(article.title);

  return (
    <Box>
      {/* Cover Image Hero */}
      <Box
        sx={{
          width: '100%',
          height: { xs: 250, md: 400 },
          background: article.cover_image
            ? `linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%), url(${article.cover_image}) center/cover no-repeat`
            : 'linear-gradient(135deg, #1a237e 0%, #1565c0 100%)',
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        <Container maxWidth="lg" sx={{ pb: 4 }}>
          <Button
            component={Link}
            href="/noticias"
            startIcon={<ArrowBack />}
            sx={{ color: 'white', mb: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
          >
            Voltar para noticias
          </Button>
          {article.championship_name && (
            <Chip
              label={article.championship_name}
              size="small"
              sx={{
                bgcolor: '#ffd600',
                color: '#1a237e',
                fontWeight: 700,
                mb: 1,
                display: 'block',
                width: 'fit-content',
              }}
            />
          )}
          <Typography
            variant="h3"
            fontWeight={800}
            sx={{
              color: 'white',
              fontSize: { xs: '1.6rem', md: '2.4rem' },
              textShadow: '0 2px 8px rgba(0,0,0,0.4)',
              maxWidth: 800,
            }}
          >
            {article.title}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            {/* Meta info */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 3, mb: 3 }}>
              {article.author_name && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {article.author_name}
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarMonth sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {formatDateTime(article.published_at)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Visibility sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {article.views_count} visualizacoes
                </Typography>
              </Box>
            </Box>

            {/* Summary */}
            {article.summary && (
              <Typography
                variant="h6"
                sx={{
                  color: '#555',
                  fontWeight: 400,
                  fontStyle: 'italic',
                  mb: 3,
                  borderLeft: '4px solid #1976d2',
                  pl: 2,
                }}
              >
                {article.summary}
              </Typography>
            )}

            <Divider sx={{ mb: 3 }} />

            {/* Content */}
            <Box
              sx={{
                '& p': { mb: 2, lineHeight: 1.8, fontSize: '1.05rem', color: '#333' },
                '& h2': { mt: 4, mb: 2, fontWeight: 700, color: '#1a237e' },
                '& h3': { mt: 3, mb: 1.5, fontWeight: 600, color: '#1a237e' },
                '& img': { maxWidth: '100%', borderRadius: 1, my: 2 },
                '& ul, & ol': { pl: 3, mb: 2 },
                '& li': { mb: 0.5, lineHeight: 1.7 },
                '& blockquote': {
                  borderLeft: '4px solid #ffd600',
                  pl: 2,
                  py: 1,
                  my: 2,
                  bgcolor: '#f5f5f5',
                  borderRadius: '0 4px 4px 0',
                },
              }}
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            <Divider sx={{ my: 4 }} />

            {/* Share Buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Share sx={{ color: 'text.secondary' }} />
              <Typography variant="body2" fontWeight={600} color="text.secondary">
                Compartilhar:
              </Typography>
              <Button
                component="a"
                href={`https://api.whatsapp.com/send?text=${shareText}%20${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener"
                size="small"
                variant="outlined"
                sx={{
                  color: '#25D366',
                  borderColor: '#25D366',
                  '&:hover': { bgcolor: '#25D366', color: 'white', borderColor: '#25D366' },
                }}
              >
                WhatsApp
              </Button>
              <Button
                component="a"
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener"
                size="small"
                variant="outlined"
                sx={{
                  color: '#1877F2',
                  borderColor: '#1877F2',
                  '&:hover': { bgcolor: '#1877F2', color: 'white', borderColor: '#1877F2' },
                }}
              >
                Facebook
              </Button>
              <Button
                component="a"
                href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener"
                size="small"
                variant="outlined"
                sx={{
                  color: '#1DA1F2',
                  borderColor: '#1DA1F2',
                  '&:hover': { bgcolor: '#1DA1F2', color: 'white', borderColor: '#1DA1F2' },
                }}
              >
                Twitter
              </Button>
            </Box>
          </Grid>

          {/* Sidebar - Related News */}
          <Grid item xs={12} md={4}>
            {relatedNews.length > 0 && (
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ color: '#1a237e', mb: 2 }}>
                  NOTICIAS RELACIONADAS
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {relatedNews.map((related) => (
                    <NewsCard key={related.id} article={related} />
                  ))}
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
