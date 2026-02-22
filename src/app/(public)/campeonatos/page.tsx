import { Container, Typography, Box, Grid, Card, CardContent, CardActionArea, Chip } from '@mui/material';
import type { Metadata } from 'next';
import { getAllChampionships } from '@/services/championshipService';
import { EmojiEvents } from '@mui/icons-material';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Campeonatos' };

const statusColor = (s: string) => {
  if (s === 'Em Andamento') return 'primary';
  if (s === 'Finalizado') return 'success';
  if (s === 'Cancelado') return 'error';
  if (s === 'Inscricoes Abertas') return 'warning';
  return 'default';
};

export default async function CampeonatosPage() {
  const championships = await getAllChampionships();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>Campeonatos</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Acompanhe os campeonatos organizados
      </Typography>

      <Grid container spacing={3}>
        {championships.map((c) => (
          <Grid item xs={12} sm={6} md={4} key={c.id}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea component={Link} href={`/campeonatos/${c.id}`} sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <EmojiEvents sx={{ fontSize: 32, color: '#ed6c02' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={700}>{c.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{c.category} | {c.year}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={c.status} size="small" color={statusColor(c.status) as any} />
                    <Chip label={c.format} size="small" variant="outlined" />
                  </Box>
                  {c.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {c.description.substring(0, 100)}{c.description.length > 100 ? '...' : ''}
                    </Typography>
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {championships.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">Nenhum campeonato cadastrado</Typography>
        </Box>
      )}
    </Container>
  );
}
