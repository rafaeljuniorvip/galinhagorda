import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getChampionshipById } from '@/services/championshipService';
import { getChampionshipStandings, getTopScorers } from '@/services/statsService';
import { getEnrolledTeams } from '@/services/registrationService';
import {
  Container, Typography, Box, Card, CardContent, Chip, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid,
} from '@mui/material';
import { EmojiEvents } from '@mui/icons-material';
import ChampionshipMatchesClient from '@/components/public/ChampionshipMatchesClient';

interface Props { params: { id: string }; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getChampionshipById(params.id);
  if (!c) return { title: 'Campeonato nao encontrado' };
  return { title: `${c.name} ${c.year}` };
}

export default async function ChampionshipDetailPage({ params }: Props) {
  const championship = await getChampionshipById(params.id);
  if (!championship) notFound();

  const [standings, topScorers, enrolledTeams] = await Promise.all([
    getChampionshipStandings(params.id),
    getTopScorers(params.id),
    getEnrolledTeams(params.id),
  ]);

  return (
    <Box>
      <Box sx={{ background: 'linear-gradient(135deg, #e65100 0%, #f57c00 100%)', color: 'white', py: 5 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EmojiEvents sx={{ fontSize: 48 }} />
            <Box>
              <Typography variant="h4" fontWeight={800}>{championship.name}</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                {championship.category} | {championship.format} | {championship.year}
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
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
                  {standings.map((s, i) => (
                    <TableRow key={s.team_id} hover>
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
                  ))}
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

        {/* Partidas */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: '#1a237e' }}>PARTIDAS</Typography>
          <ChampionshipMatchesClient championshipId={params.id} />
        </Box>
      </Container>
    </Box>
  );
}
