import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getChampionshipById } from '@/services/championshipService';
import { getChampionshipStandings, getTopScorers, getDisciplinaryRanking, getTeamFairPlayRanking } from '@/services/statsService';
import { getEnrolledTeams } from '@/services/registrationService';
import { getNewsByChampionship } from '@/services/newsPublicService';
import { getPublicPhotos } from '@/services/photoPublicService';
import {
  Container, Typography, Box, Card, CardContent, Chip, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid,
  Button, Divider,
} from '@mui/material';
import {
  EmojiEvents, LocationOn, CardGiftcard, Business, Description,
  Category, SportsSoccer, Newspaper, ArrowForward, OpenInNew, Forum,
} from '@mui/icons-material';
import Link from 'next/link';
import ChampionshipMatchesClient from '@/components/public/ChampionshipMatchesClient';
import NewsCard from '@/components/public/NewsCard';
import PhotoGallery from '@/components/public/PhotoGallery';
import FanWall from '@/components/public/FanWall';

export const dynamic = 'force-dynamic';

interface Props { params: { id: string }; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getChampionshipById(params.id);
  if (!c) return { title: 'Campeonato nao encontrado' };
  return { title: `${c.name} ${c.year}` };
}

export default async function ChampionshipDetailPage({ params }: Props) {
  const championship = await getChampionshipById(params.id);
  if (!championship) notFound();

  const [standings, topScorers, enrolledTeams, relatedNews, photos, disciplinary, fairPlay] = await Promise.all([
    getChampionshipStandings(params.id),
    getTopScorers(params.id),
    getEnrolledTeams(params.id),
    getNewsByChampionship(params.id, 4),
    getPublicPhotos('championship', params.id),
    getDisciplinaryRanking(params.id),
    getTeamFairPlayRanking(params.id),
  ]);

  const hasInfoCards = championship.prize || championship.location || championship.sponsor || championship.format || championship.category;

  return (
    <Box>
      {/* Hero Banner */}
      <Box
        sx={{
          background: championship.banner_url
            ? `linear-gradient(to bottom, rgba(230, 81, 0, 0.85) 0%, rgba(245, 124, 0, 0.9) 100%), url(${championship.banner_url}) center/cover no-repeat`
            : 'linear-gradient(135deg, #e65100 0%, #f57c00 100%)',
          color: 'white',
          py: 5,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EmojiEvents sx={{ fontSize: 48 }} />
            <Box>
              <Typography variant="h4" fontWeight={800}>{championship.name}</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                {championship.category} | {championship.format} | {championship.year}
              </Typography>
              {championship.description && (
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>
                  {championship.description}
                </Typography>
              )}
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Info Cards */}
        {hasInfoCards && (
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={2}>
              {championship.location && (
                <Grid item xs={6} sm={4} md={2}>
                  <Card variant="outlined" sx={{ textAlign: 'center', height: '100%' }}>
                    <CardContent sx={{ py: 2 }}>
                      <LocationOn sx={{ color: '#1976d2', mb: 0.5 }} />
                      <Typography variant="caption" color="text.secondary" display="block">Local</Typography>
                      <Typography variant="body2" fontWeight={600}>{championship.location}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              {championship.prize && (
                <Grid item xs={6} sm={4} md={2}>
                  <Card variant="outlined" sx={{ textAlign: 'center', height: '100%' }}>
                    <CardContent sx={{ py: 2 }}>
                      <CardGiftcard sx={{ color: '#ffd600', mb: 0.5 }} />
                      <Typography variant="caption" color="text.secondary" display="block">Premiacao</Typography>
                      <Typography variant="body2" fontWeight={600}>{championship.prize}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              {championship.sponsor && (
                <Grid item xs={6} sm={4} md={2}>
                  <Card variant="outlined" sx={{ textAlign: 'center', height: '100%' }}>
                    <CardContent sx={{ py: 2 }}>
                      <Business sx={{ color: '#2e7d32', mb: 0.5 }} />
                      <Typography variant="caption" color="text.secondary" display="block">Patrocinador</Typography>
                      <Typography variant="body2" fontWeight={600}>{championship.sponsor}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              <Grid item xs={6} sm={4} md={2}>
                <Card variant="outlined" sx={{ textAlign: 'center', height: '100%' }}>
                  <CardContent sx={{ py: 2 }}>
                    <SportsSoccer sx={{ color: '#ed6c02', mb: 0.5 }} />
                    <Typography variant="caption" color="text.secondary" display="block">Formato</Typography>
                    <Typography variant="body2" fontWeight={600}>{championship.format}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card variant="outlined" sx={{ textAlign: 'center', height: '100%' }}>
                  <CardContent sx={{ py: 2 }}>
                    <Category sx={{ color: '#7b1fa2', mb: 0.5 }} />
                    <Typography variant="caption" color="text.secondary" display="block">Categoria</Typography>
                    <Typography variant="body2" fontWeight={600}>{championship.category}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              {championship.rules_url && (
                <Grid item xs={6} sm={4} md={2}>
                  <Card variant="outlined" sx={{ textAlign: 'center', height: '100%' }}>
                    <CardContent sx={{ py: 2 }}>
                      <Description sx={{ color: '#0288d1', mb: 0.5 }} />
                      <Typography variant="caption" color="text.secondary" display="block">Regulamento</Typography>
                      <Button
                        component="a"
                        href={championship.rules_url}
                        target="_blank"
                        rel="noopener"
                        size="small"
                        startIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                        sx={{ fontSize: '0.75rem' }}
                      >
                        Abrir PDF
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {/* Classificacao */}
        {standings.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: '#1a237e' }}>CLASSIFICACAO</Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 40 }}>#</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell align="center">P</TableCell>
                    <TableCell align="center">J</TableCell>
                    <TableCell align="center">V</TableCell>
                    <TableCell align="center">E</TableCell>
                    <TableCell align="center">D</TableCell>
                    <TableCell align="center">GP</TableCell>
                    <TableCell align="center">GC</TableCell>
                    <TableCell align="center">SG</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {standings.map((s, i) => {
                    const posColor = i < 4 ? '#2e7d32' : (i >= standings.length - 2 ? '#d32f2f' : 'transparent');
                    return (
                    <TableRow key={s.team_id} hover sx={{ borderLeft: `4px solid ${posColor}` }}>
                      <TableCell sx={{ fontWeight: 700 }}>{i + 1}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar src={s.logo_url || ''} sx={{ width: 24, height: 24 }}>{s.short_name?.[0]}</Avatar>
                          <Typography variant="body2" fontWeight={600}>{s.team_name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center"><Typography fontWeight={700}>{s.points}</Typography></TableCell>
                      <TableCell align="center">{s.matches_played}</TableCell>
                      <TableCell align="center">{s.wins}</TableCell>
                      <TableCell align="center">{s.draws}</TableCell>
                      <TableCell align="center">{s.losses}</TableCell>
                      <TableCell align="center">{s.goals_for}</TableCell>
                      <TableCell align="center">{s.goals_against}</TableCell>
                      <TableCell align="center">{s.goals_for - s.goals_against}</TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Artilharia */}
        {topScorers.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: '#1a237e' }}>ARTILHARIA</Typography>
            <Grid container spacing={2}>
              {topScorers.map((s: any, i: number) => (
                <Grid item xs={12} sm={6} md={4} key={s.player_id}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h5" fontWeight={800} sx={{ color: i < 3 ? '#ed6c02' : '#666', width: 36 }}>
                        {i + 1}
                      </Typography>
                      <Avatar src={s.photo_url || ''} sx={{ width: 40, height: 40 }}>{s.player_name[0]}</Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600}>{s.player_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{s.team_name}</Typography>
                      </Box>
                      <Chip label={`${s.goals} gol${s.goals > 1 ? 's' : ''}`} color="primary" size="small" />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Cartoes / Disciplinar */}
        {(disciplinary.length > 0 || fairPlay.length > 0) && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: '#1a237e' }}>CARTOES</Typography>
            <Grid container spacing={3}>
              {disciplinary.length > 0 && (
                <Grid item xs={12} md={7}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Ranking Disciplinar</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>#</TableCell>
                          <TableCell>Jogador</TableCell>
                          <TableCell>Time</TableCell>
                          <TableCell align="center">AM</TableCell>
                          <TableCell align="center">VM</TableCell>
                          <TableCell align="center">Pts</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {disciplinary.map((d, i) => (
                          <TableRow key={d.player_id} hover>
                            <TableCell>{i + 1}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar src={d.photo_url || ''} sx={{ width: 24, height: 24 }}>{d.player_name[0]}</Avatar>
                                <Typography variant="body2" fontWeight={600}>{d.player_name}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Avatar src={d.team_logo || ''} sx={{ width: 18, height: 18 }}>{d.team_name[0]}</Avatar>
                                <Typography variant="caption">{d.team_name}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Chip label={d.yellow_cards} size="small" sx={{ bgcolor: '#ffd600', color: '#333', fontWeight: 700, minWidth: 28 }} />
                            </TableCell>
                            <TableCell align="center">
                              <Chip label={d.red_cards} size="small" sx={{ bgcolor: d.red_cards > 0 ? '#d32f2f' : '#eee', color: d.red_cards > 0 ? '#fff' : '#666', fontWeight: 700, minWidth: 28 }} />
                            </TableCell>
                            <TableCell align="center"><Typography fontWeight={700}>{d.penalty_points}</Typography></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}
              {fairPlay.length > 0 && (
                <Grid item xs={12} md={5}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Fair Play por Time</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Time</TableCell>
                          <TableCell align="center">AM</TableCell>
                          <TableCell align="center">VM</TableCell>
                          <TableCell align="center">Pts</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {fairPlay.map((fp) => (
                          <TableRow key={fp.team_id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar src={fp.logo_url || ''} sx={{ width: 24, height: 24 }}>{fp.team_name[0]}</Avatar>
                                <Typography variant="body2" fontWeight={600}>{fp.team_name}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center">{fp.yellow_cards}</TableCell>
                            <TableCell align="center">{fp.red_cards}</TableCell>
                            <TableCell align="center"><Typography fontWeight={700}>{fp.penalty_points}</Typography></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {/* Partidas */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: '#1a237e' }}>PARTIDAS</Typography>
          <ChampionshipMatchesClient championshipId={params.id} />
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Photo Gallery */}
        {photos.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <PhotoGallery photos={photos} title="FOTOS DO CAMPEONATO" />
          </Box>
        )}

        {/* Related News */}
        {relatedNews.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h5" fontWeight={700} sx={{ color: '#1a237e' }}>
                <Newspaper sx={{ mr: 1, verticalAlign: 'middle' }} />
                NOTICIAS
              </Typography>
              <Button
                component={Link}
                href={`/noticias?campeonato=${params.id}`}
                endIcon={<ArrowForward />}
                size="small"
                sx={{ color: '#1976d2' }}
              >
                Ver todas
              </Button>
            </Box>
            <Grid container spacing={2}>
              {relatedNews.map((article) => (
                <Grid item xs={12} sm={6} md={3} key={article.id}>
                  <NewsCard article={article} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Fan Wall */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Forum sx={{ color: '#1a237e' }} />
            <Typography variant="h5" fontWeight={700} sx={{ color: '#1a237e' }}>
              MURAL DO TORCEDOR
            </Typography>
          </Box>
          <FanWall targetType="championship" targetId={params.id} />
        </Box>
      </Container>
    </Box>
  );
}
