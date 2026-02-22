import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTeamById } from '@/services/teamService';
import { getMany } from '@/lib/db';
import { getPublicPhotos } from '@/services/photoPublicService';
import {
  Container, Typography, Box, Avatar, Card, CardContent, Grid, Chip, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, Divider,
} from '@mui/material';
import {
  Instagram, Forum, EmojiEvents, SportsSoccer, OpenInNew,
} from '@mui/icons-material';
import Link from 'next/link';
import PhotoGallery from '@/components/public/PhotoGallery';

export const dynamic = 'force-dynamic';

interface Props { params: { id: string }; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const team = await getTeamById(params.id);
  if (!team) return { title: 'Time nao encontrado' };
  return { title: team.name };
}

export default async function TeamDetailPage({ params }: Props) {
  const team = await getTeamById(params.id);
  if (!team) notFound();

  // Get players registered for this team across championships
  const players = await getMany(
    `SELECT DISTINCT p.id, p.name, p.position, p.photo_url, pr.shirt_number, pr.bid_number, c.name AS championship_name
     FROM player_registrations pr
     JOIN players p ON p.id = pr.player_id
     JOIN championships c ON c.id = pr.championship_id
     WHERE pr.team_id = $1 AND pr.status = 'Ativo'
     ORDER BY p.name`,
    [params.id]
  );

  // Get team stats in current championships (W/D/L record)
  const teamStats = await getMany(
    `SELECT
      c.id AS championship_id,
      c.name AS championship_name,
      c.year,
      c.status,
      COUNT(m.id)::int AS matches_played,
      SUM(CASE
        WHEN (m.home_team_id = $1 AND m.home_score > m.away_score)
          OR (m.away_team_id = $1 AND m.away_score > m.home_score)
        THEN 1 ELSE 0
      END)::int AS wins,
      SUM(CASE WHEN m.home_score = m.away_score THEN 1 ELSE 0 END)::int AS draws,
      SUM(CASE
        WHEN (m.home_team_id = $1 AND m.home_score < m.away_score)
          OR (m.away_team_id = $1 AND m.away_score < m.home_score)
        THEN 1 ELSE 0
      END)::int AS losses,
      COALESCE(SUM(CASE WHEN m.home_team_id = $1 THEN m.home_score WHEN m.away_team_id = $1 THEN m.away_score ELSE 0 END), 0)::int AS goals_for,
      COALESCE(SUM(CASE WHEN m.home_team_id = $1 THEN m.away_score WHEN m.away_team_id = $1 THEN m.home_score ELSE 0 END), 0)::int AS goals_against
     FROM team_championships tc
     JOIN championships c ON c.id = tc.championship_id
     LEFT JOIN matches m ON m.championship_id = c.id
       AND (m.home_team_id = $1 OR m.away_team_id = $1)
       AND m.status = 'Finalizada'
     WHERE tc.team_id = $1
     GROUP BY c.id, c.name, c.year, c.status
     ORDER BY c.year DESC, c.name`,
    [params.id]
  );

  // Get photos
  const photos = await getPublicPhotos('team', params.id);

  return (
    <Box>
      <Box sx={{ background: `linear-gradient(135deg, ${team.primary_color || '#1a237e'} 0%, #283593 100%)`, color: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexDirection: { xs: 'column', md: 'row' }, textAlign: { xs: 'center', md: 'left' } }}>
            <Avatar src={team.logo_url || ''} sx={{ width: 120, height: 120, border: '4px solid white', bgcolor: 'rgba(255,255,255,0.2)', fontSize: 48 }}>
              {team.short_name?.[0] || team.name[0]}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h3" fontWeight={800}>{team.name}</Typography>
              {team.short_name && <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)' }}>{team.short_name}</Typography>}
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>
                {team.city}/{team.state} {team.founded_year ? `| Fundado em ${team.founded_year}` : ''}
              </Typography>
              {/* Instagram link */}
              {team.instagram && (
                <Button
                  component="a"
                  href={team.instagram.startsWith('http') ? team.instagram : `https://instagram.com/${team.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener"
                  startIcon={<Instagram />}
                  sx={{
                    color: 'white',
                    mt: 1,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  {team.instagram.startsWith('http') ? 'Instagram' : team.instagram}
                </Button>
              )}
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Bio */}
        {team.bio && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: '#1a237e' }}>
              SOBRE O TIME
            </Typography>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body1" sx={{ lineHeight: 1.8, color: '#444' }}>
                  {team.bio}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Team Stats by Championship */}
        {teamStats.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: '#1a237e' }}>
              <EmojiEvents sx={{ mr: 1, verticalAlign: 'middle', color: '#ed6c02' }} />
              HISTORICO NOS CAMPEONATOS
            </Typography>
            <Grid container spacing={2}>
              {teamStats.map((s: any) => (
                <Grid item xs={12} sm={6} md={4} key={s.championship_id}>
                  <Card
                    variant="outlined"
                    component={Link}
                    href={`/campeonatos/${s.championship_id}`}
                    sx={{ textDecoration: 'none', '&:hover': { boxShadow: 3 } }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" fontWeight={700}>{s.championship_name}</Typography>
                        <Chip
                          label={s.status}
                          size="small"
                          color={s.status === 'Em Andamento' ? 'success' : s.status === 'Finalizado' ? 'default' : 'primary'}
                          variant="outlined"
                          sx={{ fontSize: '0.65rem' }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                        {s.year}
                      </Typography>
                      {s.matches_played > 0 ? (
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" fontWeight={800} sx={{ color: '#1a237e' }}>{s.matches_played}</Typography>
                            <Typography variant="caption" color="text.secondary">Jogos</Typography>
                          </Box>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" fontWeight={800} sx={{ color: '#2e7d32' }}>{s.wins}</Typography>
                            <Typography variant="caption" color="text.secondary">V</Typography>
                          </Box>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" fontWeight={800} sx={{ color: '#ed6c02' }}>{s.draws}</Typography>
                            <Typography variant="caption" color="text.secondary">E</Typography>
                          </Box>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" fontWeight={800} sx={{ color: '#d32f2f' }}>{s.losses}</Typography>
                            <Typography variant="caption" color="text.secondary">D</Typography>
                          </Box>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" fontWeight={800} sx={{ color: '#1976d2' }}>{s.goals_for}</Typography>
                            <Typography variant="caption" color="text.secondary">GP</Typography>
                          </Box>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" fontWeight={800} sx={{ color: '#999' }}>{s.goals_against}</Typography>
                            <Typography variant="caption" color="text.secondary">GC</Typography>
                          </Box>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Nenhuma partida disputada
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Elenco */}
        <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: '#1a237e' }}>
          ELENCO
        </Typography>
        {players.length > 0 ? (
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Jogador</TableCell>
                  <TableCell>Posicao</TableCell>
                  <TableCell>N</TableCell>
                  <TableCell>BID</TableCell>
                  <TableCell>Campeonato</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {players.map((p: any, i: number) => (
                  <TableRow key={`${p.id}-${i}`} hover component={Link} href={`/jogadores/${p.id}`} sx={{ textDecoration: 'none', cursor: 'pointer' }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar src={p.photo_url || ''} sx={{ width: 32, height: 32 }}>{p.name[0]}</Avatar>
                        <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Chip label={p.position} size="small" /></TableCell>
                    <TableCell>{p.shirt_number || '-'}</TableCell>
                    <TableCell>{p.bid_number || '-'}</TableCell>
                    <TableCell><Typography variant="caption">{p.championship_name}</Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ mb: 4 }}>
            <Typography color="text.secondary">Nenhum jogador inscrito</Typography>
          </Box>
        )}

        {/* Photo Gallery */}
        {photos.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Divider sx={{ mb: 3 }} />
            <PhotoGallery photos={photos} title="FOTOS" />
          </Box>
        )}

        {/* Fan Wall Placeholder */}
        <Box sx={{ mb: 4 }}>
          <Divider sx={{ mb: 3 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Forum sx={{ color: '#1a237e' }} />
            <Typography variant="h5" fontWeight={700} sx={{ color: '#1a237e' }}>
              MURAL DO TORCEDOR
            </Typography>
          </Box>
          <Card variant="outlined" sx={{ textAlign: 'center', py: 4, bgcolor: '#fafafa' }}>
            <Forum sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Em breve voce podera deixar sua mensagem aqui!
            </Typography>
          </Card>
        </Box>
      </Container>
    </Box>
  );
}
