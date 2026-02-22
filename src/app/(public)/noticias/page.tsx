import {
  Box, Container, Typography, Grid, Button, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { Newspaper, ArrowBack, ArrowForward } from '@mui/icons-material';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getPublishedNews, getFeaturedNews } from '@/services/newsPublicService';
import { getAllChampionships } from '@/services/championshipService';
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

  // Filter out featured from the grid if on first page
  const gridNews = featuredArticle
    ? news.filter(n => n.id !== featuredArticle.id)
    : news;

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1a237e 0%, #1565c0 100%)',
          color: 'white',
          py: { xs: 4, md: 6 },
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Newspaper sx={{ fontSize: 48, color: '#ffd600', mb: 1 }} />
          <Typography variant="h3" fontWeight={800} sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
            NOTICIAS
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mt: 1 }}>
            Fique por dentro de tudo que acontece nos campeonatos
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Championship Filter */}
        {championships.length > 0 && (
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <FormControl size="small" sx={{ minWidth: 250 }}>
              <InputLabel>Filtrar por campeonato</InputLabel>
              <Select
                value={championshipId || ''}
                label="Filtrar por campeonato"
              >
                <MenuItem value="" component={'a' as any} href="/noticias">
                  Todos os campeonatos
                </MenuItem>
                {championships.map((c) => (
                  <MenuItem
                    key={c.id}
                    value={c.id}
                    component={'a' as any}
                    href={`/noticias?campeonato=${c.id}`}
                  >
                    {c.name} ({c.year})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Featured News (large card at top, first page only) */}
        {featuredArticle && page === 1 && (
          <Box sx={{ mb: 4 }}>
            <NewsCard article={featuredArticle} featured />
          </Box>
        )}

        {/* News Grid */}
        {gridNews.length > 0 ? (
          <Grid container spacing={3}>
            {gridNews.map((article) => (
              <Grid item xs={12} sm={6} md={4} key={article.id}>
                <NewsCard article={article} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Newspaper sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Nenhuma noticia encontrada
            </Typography>
            {championshipId && (
              <Button component={Link} href="/noticias" sx={{ mt: 2 }}>
                Ver todas as noticias
              </Button>
            )}
          </Box>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
            {page > 1 && (
              <Button
                component={Link}
                href={`/noticias?page=${page - 1}${championshipId ? `&campeonato=${championshipId}` : ''}`}
                startIcon={<ArrowBack />}
                variant="outlined"
              >
                Anterior
              </Button>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  component={Link}
                  href={`/noticias?page=${p}${championshipId ? `&campeonato=${championshipId}` : ''}`}
                  variant={p === page ? 'contained' : 'text'}
                  size="small"
                  sx={{
                    minWidth: 36,
                    ...(p === page && { bgcolor: '#1a237e' }),
                  }}
                >
                  {p}
                </Button>
              ))}
            </Box>
            {page < totalPages && (
              <Button
                component={Link}
                href={`/noticias?page=${page + 1}${championshipId ? `&campeonato=${championshipId}` : ''}`}
                endIcon={<ArrowForward />}
                variant="outlined"
              >
                Proxima
              </Button>
            )}
          </Box>
        )}
      </Container>
    </Box>
  );
}
