import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPlayerById } from '@/services/playerService';
import { getPlayerStats, getPlayerCareerStats } from '@/services/statsService';
import { getRegistrationsByPlayer } from '@/services/registrationService';
import { getPublicPhotos } from '@/services/photoPublicService';
import PlayerBIDProfile from '@/components/public/PlayerBIDProfile';
import PhotoGallery from '@/components/public/PhotoGallery';
import {
  Box, Container, Typography, Card, CardContent, Button, Divider, Grid,
} from '@mui/material';
import { Instagram, Forum, SportsSoccer, Style, Block } from '@mui/icons-material';
import FanWall from '@/components/public/FanWall';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const player = await getPlayerById(params.id);
  if (!player) return { title: 'Jogador nao encontrado' };
  return {
    title: `${player.name} - BID`,
    description: `Perfil do jogador ${player.full_name} - ${player.position}`,
  };
}

export default async function PlayerProfilePage({ params }: Props) {
  const player = await getPlayerById(params.id);
  if (!player) notFound();

  const [stats, registrations, photos, careerStats] = await Promise.all([
    getPlayerStats(params.id),
    getRegistrationsByPlayer(params.id),
    getPublicPhotos('player', params.id),
    getPlayerCareerStats(params.id),
  ]);

  return (
    <Box>
      <PlayerBIDProfile
        player={player}
        stats={stats}
        registrations={registrations}
      />

      {/* Additional sections below the BID profile */}
      <Container maxWidth="lg" sx={{ pb: 4 }}>
        {/* Bio Section */}
        {player.bio && (
          <Box sx={{ mb: 4 }}>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: '#1a237e' }}>
              SOBRE O JOGADOR
            </Typography>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body1" sx={{ lineHeight: 1.8, color: '#444' }}>
                  {player.bio}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Instagram Link */}
        {player.instagram && (
          <Box sx={{ mb: 4 }}>
            <Button
              component="a"
              href={player.instagram.startsWith('http') ? player.instagram : `https://instagram.com/${player.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener"
              startIcon={<Instagram />}
              variant="outlined"
              sx={{
                color: '#E4405F',
                borderColor: '#E4405F',
                '&:hover': { bgcolor: '#E4405F', color: 'white', borderColor: '#E4405F' },
              }}
            >
              {player.instagram.startsWith('http') ? 'Ver Instagram' : player.instagram}
            </Button>
          </Box>
        )}

        {/* Career Stats */}
        {(careerStats.total_matches > 0 || careerStats.total_goals > 0) && (
          <Box sx={{ mb: 4 }}>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: '#1a237e' }}>
              NUMEROS NA CARREIRA
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Card variant="outlined" sx={{ textAlign: 'center' }}>
                  <CardContent>
                    <SportsSoccer sx={{ color: '#1976d2', fontSize: 32 }} />
                    <Typography variant="h4" fontWeight={800} sx={{ color: '#1a237e' }}>{careerStats.total_matches}</Typography>
                    <Typography variant="caption" color="text.secondary">Partidas</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card variant="outlined" sx={{ textAlign: 'center' }}>
                  <CardContent>
                    <SportsSoccer sx={{ color: '#2e7d32', fontSize: 32 }} />
                    <Typography variant="h4" fontWeight={800} sx={{ color: '#2e7d32' }}>{careerStats.total_goals}</Typography>
                    <Typography variant="caption" color="text.secondary">Gols</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card variant="outlined" sx={{ textAlign: 'center' }}>
                  <CardContent>
                    <Style sx={{ color: '#ffd600', fontSize: 32 }} />
                    <Typography variant="h4" fontWeight={800} sx={{ color: '#ed6c02' }}>{careerStats.total_yellow_cards}</Typography>
                    <Typography variant="caption" color="text.secondary">Amarelos</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card variant="outlined" sx={{ textAlign: 'center' }}>
                  <CardContent>
                    <Block sx={{ color: '#d32f2f', fontSize: 32 }} />
                    <Typography variant="h4" fontWeight={800} sx={{ color: '#d32f2f' }}>{careerStats.total_red_cards}</Typography>
                    <Typography variant="caption" color="text.secondary">Vermelhos</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Photo Gallery */}
        {photos.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Divider sx={{ mb: 3 }} />
            <PhotoGallery photos={photos} title="FOTOS" />
          </Box>
        )}

        {/* Fan Wall */}
        <Box sx={{ mb: 4 }}>
          <Divider sx={{ mb: 3 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Forum sx={{ color: '#1a237e' }} />
            <Typography variant="h5" fontWeight={700} sx={{ color: '#1a237e' }}>
              MURAL DO TORCEDOR
            </Typography>
          </Box>
          <FanWall targetType="player" targetId={params.id} />
        </Box>
      </Container>
    </Box>
  );
}
