import {
  Box, Container, Typography, Grid, Card, CardContent, CardActionArea, Button,
  Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip,
} from '@mui/material';
import { People, Groups, EmojiEvents, SportsSoccer, Newspaper, ArrowForward } from '@mui/icons-material';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getMany, getOne } from '@/lib/db';
import { Championship, Match, NewsArticle } from '@/types';
import { getChampionshipStandings, getTopScorers } from '@/services/statsService';
import { getPublishedNews } from '@/services/newsPublicService';
import FeaturedMatches from '@/components/public/FeaturedMatches';
import NewsCard from '@/components/public/NewsCard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Galinha Gorda - Gestao de Campeonatos',
  description: 'Sistema de gestao de campeonatos de futebol de Itapecerica-MG',
};

async function getActiveChampionship(): Promise<Championship | null> {
  return getOne<Championship>(
    `SELECT * FROM championships
     WHERE active = true AND status IN ('Em Andamento', 'Inscricoes Abertas')
     ORDER BY
       CASE WHEN status = 'Em Andamento' THEN 0 ELSE 1 END,
       year DESC
     LIMIT 1`
  );
}

async function getFeaturedMatchesData(): Promise<Match[]> {
  return getMany<Match>(
    `SELECT m.*,
      ht.name AS home_team_name, ht.logo_url AS home_team_logo, ht.short_name AS home_team_short,
      at.name AS away_team_name, at.logo_url AS away_team_logo, at.short_name AS away_team_short,
      c.name AS championship_name
     FROM matches m
     JOIN teams ht ON ht.id = m.home_team_id
     JOIN teams at ON at.id = m.away_team_id
     JOIN championships c ON c.id = m.championship_id
     WHERE m.is_featured = true OR m.status = 'Em Andamento'
        OR (m.status = 'Finalizada' AND m.match_date >= NOW() - INTERVAL '7 days')
     ORDER BY
       CASE WHEN m.status = 'Em Andamento' THEN 0
            WHEN m.is_featured = true THEN 1
            ELSE 2 END,
       m.match_date DESC NULLS LAST
     LIMIT 10`
  );
}

export default async function HomePage() {
  const [activeChampionship, featuredMatches, newsResult] = await Promise.all([
    getActiveChampionship(),
    getFeaturedMatchesData(),
    getPublishedNews(1, 4),
  ]);

  // Load standings and top scorers if there's an active championship
  let standings: any[] = [];
  let topScorers: any[] = [];
  if (activeChampionship) {
    [standings, topScorers] = await Promise.all([
      getChampionshipStandings(activeChampionship.id),
      getTopScorers(activeChampionship.id, 5),
    ]);
  }

  const latestNews = newsResult.news;

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
          {activeChampionship ? (
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', maxWidth: 500, mx: 'auto', mb: 1 }}>
              {activeChampionship.name} {activeChampionship.year}
            </Typography>
          ) : null}
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

      {/* Featured Matches */}
      {featuredMatches.length > 0 && (
        <Box sx={{ bgcolor: '#f5f5f5', py: 4 }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h5" fontWeight={700} sx={{ color: '#1a237e' }}>
                <SportsSoccer sx={{ mr: 1, verticalAlign: 'middle', color: '#ed6c02' }} />
                PARTIDAS EM DESTAQUE
              </Typography>
            </Box>
            <FeaturedMatches initialMatches={featuredMatches} />
          </Container>
        </Box>
      )}

      {/* Latest News */}
      {latestNews.length > 0 && (
        <Box sx={{ py: 5 }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h5" fontWeight={700} sx={{ color: '#1a237e' }}>
                <Newspaper sx={{ mr: 1, verticalAlign: 'middle', color: '#1976d2' }} />
                ULTIMAS NOTICIAS
              </Typography>
              <Button
                component={Link}
                href="/noticias"
                endIcon={<ArrowForward />}
                sx={{ color: '#1976d2', fontWeight: 600 }}
              >
                Ver todas
              </Button>
            </Box>
            <Grid container spacing={3}>
              {latestNews.map((article, index) => (
                <Grid item xs={12} sm={6} md={index === 0 ? 6 : 3} key={article.id}>
                  <NewsCard article={article} featured={index === 0} />
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      )}

      {/* Standings & Top Scorers side by side */}
      {activeChampionship && (standings.length > 0 || topScorers.length > 0) && (
        <Box sx={{ bgcolor: '#f5f5f5', py: 5 }}>
          <Container maxWidth="lg">
            <Grid container spacing={4}>
              {/* Quick Standings */}
              {standings.length > 0 && (
                <Grid item xs={12} md={7}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h5" fontWeight={700} sx={{ color: '#1a237e' }}>
                      <EmojiEvents sx={{ mr: 1, verticalAlign: 'middle', color: '#ed6c02' }} />
                      CLASSIFICACAO
                    </Typography>
                    <Button
                      component={Link}
                      href={`/campeonatos/${activeChampionship.id}`}
                      endIcon={<ArrowForward />}
                      size="small"
                      sx={{ color: '#1976d2', fontWeight: 600 }}
                    >
                      Ver completa
                    </Button>
                  </Box>
                  <TableContainer component={Paper} elevation={1}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#1a237e' }}>
                          <TableCell sx={{ color: 'white', fontWeight: 700, width: 40 }}>#</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700 }}>Time</TableCell>
                          <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>P</TableCell>
                          <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>J</TableCell>
                          <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>V</TableCell>
                          <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>E</TableCell>
                          <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>D</TableCell>
                          <TableCell align="center" sx={{ color: 'white', fontWeight: 700 }}>SG</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {standings.slice(0, 5).map((s, i) => (
                          <TableRow key={s.team_id} hover>
                            <TableCell>
                              <Typography
                                fontWeight={700}
                                sx={{
                                  color: i < 4 ? '#2e7d32' : '#666',
                                  bgcolor: i < 4 ? '#e8f5e9' : 'transparent',
                                  width: 24,
                                  height: 24,
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.85rem',
                                }}
                              >
                                {i + 1}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar src={s.logo_url || ''} sx={{ width: 24, height: 24 }}>
                                  {s.short_name?.[0]}
                                </Avatar>
                                <Typography variant="body2" fontWeight={600}>{s.team_name}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Typography fontWeight={700} sx={{ color: '#1a237e' }}>{s.points}</Typography>
                            </TableCell>
                            <TableCell align="center">{s.matches_played}</TableCell>
                            <TableCell align="center">{s.wins}</TableCell>
                            <TableCell align="center">{s.draws}</TableCell>
                            <TableCell align="center">{s.losses}</TableCell>
                            <TableCell align="center">{s.goals_for - s.goals_against}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}

              {/* Top Scorers */}
              {topScorers.length > 0 && (
                <Grid item xs={12} md={5}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h5" fontWeight={700} sx={{ color: '#1a237e' }}>
                      <SportsSoccer sx={{ mr: 1, verticalAlign: 'middle', color: '#2e7d32' }} />
                      ARTILHARIA
                    </Typography>
                    <Button
                      component={Link}
                      href={`/campeonatos/${activeChampionship.id}`}
                      endIcon={<ArrowForward />}
                      size="small"
                      sx={{ color: '#1976d2', fontWeight: 600 }}
                    >
                      Ver todos
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {topScorers.map((s: any, i: number) => (
                      <Card key={s.player_id} variant="outlined" sx={{ bgcolor: i === 0 ? '#fff8e1' : 'white' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '12px !important' }}>
                          <Typography
                            variant="h6"
                            fontWeight={800}
                            sx={{
                              color: i === 0 ? '#ffd600' : i < 3 ? '#ed6c02' : '#999',
                              width: 30,
                              textAlign: 'center',
                            }}
                          >
                            {i + 1}
                          </Typography>
                          <Avatar src={s.photo_url || ''} sx={{ width: 40, height: 40 }}>
                            {s.player_name[0]}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600} noWrap>
                              {s.player_name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Avatar src={s.team_logo || ''} sx={{ width: 16, height: 16 }}>
                                {s.team_name[0]}
                              </Avatar>
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {s.team_name}
                              </Typography>
                            </Box>
                          </Box>
                          <Chip
                            label={`${s.goals} gol${s.goals > 1 ? 's' : ''}`}
                            size="small"
                            sx={{
                              bgcolor: i === 0 ? '#ffd600' : '#1976d2',
                              color: i === 0 ? '#1a237e' : 'white',
                              fontWeight: 700,
                            }}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
          </Container>
        </Box>
      )}

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
