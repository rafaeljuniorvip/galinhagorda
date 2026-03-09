import type { Metadata } from 'next';
import PlayersDashboard from '@/components/public/PlayersDashboard';
import PlayersListClient from '@/components/public/PlayersListClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Jogadores',
  description: 'Lista de jogadores inscritos nos campeonatos',
};

export default function JogadoresPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Jogadores</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Consulte o perfil e estatisticas dos atletas inscritos
      </p>
      <PlayersDashboard />
      <PlayersListClient />
    </div>
  );
}
