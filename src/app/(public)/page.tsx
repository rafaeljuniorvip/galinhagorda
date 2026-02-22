import { Box, Container, Typography, Grid, Card, CardContent, CardActionArea, Button } from '@mui/material';
import { People, Groups, EmojiEvents, SportsSoccer } from '@mui/icons-material';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Galinha Gorda - Gestao de Campeonatos',
  description: 'Sistema de gestao de campeonatos de futebol de Itapecerica-MG',
};

export default function HomePage() {
  return (
    <Box>
      {/* Hero */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #1565c0 100%)',
          color: 'white',
          py: { xs: 6, md: 10 },
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <SportsSoccer sx={{ fontSize: 64, color: '#ffd600', mb: 2 }} />
          <Typography variant="h2" fontWeight={800} sx={{ fontSize: { xs: '2rem', md: '3rem' }, mb: 1 }}>
            GALINHA GORDA
          </Typography>
          <Typography variant="h6" sx={{ color: '#ffd600', mb: 1, fontWeight: 600 }}>
            Itapecerica - MG
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', maxWidth: 500, mx: 'auto', mb: 4 }}>
            Sistema oficial de gestao de campeonatos de futebol.
            Consulte jogadores, times, tabelas e resultados.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              component={Link}
              href="/jogadores"
              variant="contained"
              size="large"
              sx={{ bgcolor: '#ffd600', color: '#1a237e', fontWeight: 700, '&:hover': { bgcolor: '#ffca28' } }}
            >
              Ver Jogadores
            </Button>
            <Button
              component={Link}
              href="/campeonatos"
              variant="outlined"
              size="large"
              sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: '#ffd600', color: '#ffd600' } }}
            >
              Campeonatos
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Quick Links */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={3}>
          {[
            { title: 'Jogadores', desc: 'Consulte o BID e perfil completo dos atletas inscritos', icon: <People sx={{ fontSize: 48, color: '#1976d2' }} />, href: '/jogadores' },
            { title: 'Times', desc: 'Veja todos os times participantes dos campeonatos', icon: <Groups sx={{ fontSize: 48, color: '#2e7d32' }} />, href: '/times' },
            { title: 'Campeonatos', desc: 'Acompanhe tabelas, classificacao e resultados', icon: <EmojiEvents sx={{ fontSize: 48, color: '#ed6c02' }} />, href: '/campeonatos' },
          ].map((item) => (
            <Grid item xs={12} md={4} key={item.title}>
              <Card sx={{ height: '100%' }}>
                <CardActionArea component={Link} href={item.href} sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                  {item.icon}
                  <Typography variant="h5" fontWeight={700} sx={{ mt: 2, mb: 1 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.desc}
                  </Typography>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
