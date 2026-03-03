import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPlayerById } from '@/services/playerService';
import { getPlayerStats, getPlayerCareerStats } from '@/services/statsService';
import { getRegistrationsByPlayer } from '@/services/registrationService';
import { getPublicPhotos } from '@/services/photoPublicService';
import PlayerBIDProfile from '@/components/public/PlayerBIDProfile';
import PhotoGallery from '@/components/public/PhotoGallery';
import { CircleDot, CreditCard, Ban, MessageSquare, Instagram } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
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
    <div>
      <PlayerBIDProfile
        player={player}
        stats={stats}
        registrations={registrations}
      />

      <div className="max-w-7xl mx-auto px-4 pb-8">
        {/* Bio Section */}
        {player.bio && (
          <div className="mb-6">
            <Separator className="mb-6" />
            <h2 className="text-xl font-bold mb-3 text-[#1a237e]">SOBRE O JOGADOR</h2>
            <Card>
              <CardContent className="p-4">
                <p className="leading-7 text-muted-foreground">{player.bio}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Instagram Link */}
        {player.instagram && (
          <div className="mb-6">
            <Button
              variant="outline"
              asChild
              className="border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white"
            >
              <a
                href={player.instagram.startsWith('http') ? player.instagram : `https://instagram.com/${player.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener"
              >
                <Instagram className="h-4 w-4 mr-2" />
                {player.instagram.startsWith('http') ? 'Ver Instagram' : player.instagram}
              </a>
            </Button>
          </div>
        )}

        {/* Career Stats */}
        {(careerStats.total_matches > 0 || careerStats.total_goals > 0) && (
          <div className="mb-6">
            <Separator className="mb-6" />
            <h2 className="text-xl font-bold mb-3 text-[#1a237e]">NUMEROS NA CARREIRA</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="text-center">
                <CardContent className="p-4">
                  <CircleDot className="h-8 w-8 text-blue-600 mx-auto mb-1" />
                  <p className="text-3xl font-extrabold text-[#1a237e]">{careerStats.total_matches}</p>
                  <p className="text-xs text-muted-foreground">Partidas</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-4">
                  <CircleDot className="h-8 w-8 text-green-600 mx-auto mb-1" />
                  <p className="text-3xl font-extrabold text-green-700">{careerStats.total_goals}</p>
                  <p className="text-xs text-muted-foreground">Gols</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-4">
                  <CreditCard className="h-8 w-8 text-yellow-500 mx-auto mb-1" />
                  <p className="text-3xl font-extrabold text-orange-600">{careerStats.total_yellow_cards}</p>
                  <p className="text-xs text-muted-foreground">Amarelos</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-4">
                  <Ban className="h-8 w-8 text-red-600 mx-auto mb-1" />
                  <p className="text-3xl font-extrabold text-red-600">{careerStats.total_red_cards}</p>
                  <p className="text-xs text-muted-foreground">Vermelhos</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Photo Gallery */}
        {photos.length > 0 && (
          <div className="mb-6">
            <Separator className="mb-6" />
            <PhotoGallery photos={photos} title="FOTOS" />
          </div>
        )}

        {/* Fan Wall */}
        <div className="mb-6">
          <Separator className="mb-6" />
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-6 w-6 text-[#1a237e]" />
            <h2 className="text-xl font-bold text-[#1a237e]">MURAL DO TORCEDOR</h2>
          </div>
          <FanWall targetType="player" targetId={params.id} />
        </div>
      </div>
    </div>
  );
}
