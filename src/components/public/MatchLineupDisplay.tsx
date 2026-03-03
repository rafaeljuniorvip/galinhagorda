'use client';

import { cn } from '@/lib/cn';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, User } from 'lucide-react';
import { MatchLineup, Match } from '@/types';

interface Props {
  homeLineup: MatchLineup[];
  awayLineup: MatchLineup[];
  match: Match;
}

const positionGroups = [
  { key: 'Goleiro', label: 'Goleiro', positions: ['Goleiro'] },
  {
    key: 'Defesa',
    label: 'Defesa',
    positions: ['Zagueiro', 'Lateral Direito', 'Lateral Esquerdo'],
  },
  {
    key: 'Meio',
    label: 'Meio-campo',
    positions: ['Volante', 'Meia', 'Meia Atacante'],
  },
  {
    key: 'Ataque',
    label: 'Ataque',
    positions: ['Atacante', 'Ponta Direita', 'Ponta Esquerda'],
  },
];

function groupPlayersByPosition(players: MatchLineup[]) {
  const starters = players.filter((p) => p.is_starter);
  const substitutes = players.filter((p) => !p.is_starter);

  const grouped: { label: string; players: MatchLineup[] }[] = [];

  for (const group of positionGroups) {
    const groupPlayers = starters.filter((p) =>
      group.positions.includes(p.position || '')
    );
    if (groupPlayers.length > 0) {
      grouped.push({ label: group.label, players: groupPlayers });
    }
  }

  // Players without matching position group
  const allGroupedIds = new Set(grouped.flatMap((g) => g.players.map((p) => p.id)));
  const ungroupedStarters = starters.filter((p) => !allGroupedIds.has(p.id));
  if (ungroupedStarters.length > 0) {
    grouped.push({ label: 'Outros', players: ungroupedStarters });
  }

  return { grouped, substitutes };
}

function PlayerRow({ player }: { player: MatchLineup }) {
  return (
    <div className="flex items-center gap-3 py-1.5 px-2 rounded transition-colors hover:bg-accent">
      <Avatar className="h-8 w-8 bg-gray-200">
        <AvatarImage src={player.player_photo || ''} alt={player.player_name || 'Jogador'} />
        <AvatarFallback className="bg-gray-200">
          <User className="h-4 w-4 text-gray-400" />
        </AvatarFallback>
      </Avatar>
      {player.shirt_number != null && (
        <span className="text-sm font-extrabold min-w-[24px] text-center text-[#1a237e]">
          {player.shirt_number}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">
          {player.player_name || 'Jogador'}
        </p>
        {player.position && (
          <p className="text-xs text-muted-foreground">{player.position}</p>
        )}
      </div>
    </div>
  );
}

function TeamLineup({
  lineup,
  teamName,
  teamLogo,
  teamColor,
}: {
  lineup: MatchLineup[];
  teamName: string;
  teamLogo?: string | null;
  teamColor: string;
}) {
  const { grouped, substitutes } = groupPlayersByPosition(lineup);

  if (lineup.length === 0) {
    return (
      <div className="border rounded-lg p-6 text-center">
        <p className="text-sm text-muted-foreground">Escalacao nao definida</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Team header */}
      <div
        className="px-4 py-3 flex items-center gap-3 text-white"
        style={{ background: teamColor }}
      >
        <Avatar className="h-7 w-7 bg-white/20">
          <AvatarImage src={teamLogo || ''} alt={teamName} />
          <AvatarFallback className="bg-white/20">
            <Shield className="h-4 w-4 text-white" />
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-bold">{teamName}</span>
        <Badge className="ml-auto bg-white/20 text-white border-transparent text-[0.65rem] hover:bg-white/30">
          {lineup.filter((p) => p.is_starter).length} titulares
        </Badge>
      </div>

      {/* Starters by position group */}
      <div className="p-3">
        {grouped.map((group, i) => (
          <div key={group.label} className={cn(i < grouped.length - 1 ? 'mb-2' : '')}>
            <p className="text-xs font-bold text-muted-foreground px-2 uppercase tracking-wide">
              {group.label}
            </p>
            {group.players.map((player) => (
              <PlayerRow key={player.id} player={player} />
            ))}
          </div>
        ))}
      </div>

      {/* Substitutes */}
      {substitutes.length > 0 && (
        <>
          <Separator />
          <div className="p-3">
            <p className="text-xs font-bold text-muted-foreground px-2 uppercase tracking-wide">
              Reservas
            </p>
            {substitutes.map((player) => (
              <PlayerRow key={player.id} player={player} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function MatchLineupDisplay({
  homeLineup,
  awayLineup,
  match,
}: Props) {
  const hasLineup = homeLineup.length > 0 || awayLineup.length > 0;

  if (!hasLineup) return null;

  return (
    <div>
      <h3 className="text-lg font-bold text-[#1a237e] mb-2 flex items-center gap-2">
        <Shield className="h-5 w-5" />
        ESCALACAO
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TeamLineup
          lineup={homeLineup}
          teamName={match.home_team_name || 'Mandante'}
          teamLogo={match.home_team_logo}
          teamColor="linear-gradient(135deg, #1a237e 0%, #283593 100%)"
        />
        <TeamLineup
          lineup={awayLineup}
          teamName={match.away_team_name || 'Visitante'}
          teamLogo={match.away_team_logo}
          teamColor="linear-gradient(135deg, #b71c1c 0%, #c62828 100%)"
        />
      </div>
    </div>
  );
}
