import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPlayerById } from '@/services/playerService';
import { getPlayerStats } from '@/services/statsService';
import { getRegistrationsByPlayer } from '@/services/registrationService';
import PlayerBIDProfile from '@/components/public/PlayerBIDProfile';

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

  const [stats, registrations] = await Promise.all([
    getPlayerStats(params.id),
    getRegistrationsByPlayer(params.id),
  ]);

  return (
    <PlayerBIDProfile
      player={player}
      stats={stats}
      registrations={registrations}
    />
  );
}
