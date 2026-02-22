import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPlayerById } from '@/services/playerService';
import { getPlayerStats } from '@/services/statsService';
import { getRegistrationsByPlayer } from '@/services/registrationService';
import { getPublicPhotos } from '@/services/photoPublicService';
import PlayerBIDProfile from '@/components/public/PlayerBIDProfile';
import PhotoGallery from '@/components/public/PhotoGallery';
import {
  Box, Container, Typography, Card, CardContent, Button, Divider,
} from '@mui/material';
import { Instagram, Forum } from '@mui/icons-material';

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

  const [stats, registrations, photos] = await Promise.all([
    getPlayerStats(params.id),
    getRegistrationsByPlayer(params.id),
    getPublicPhotos('player', params.id),
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
