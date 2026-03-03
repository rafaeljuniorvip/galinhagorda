'use client';

import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/badge';
import { MatchEvent, Match } from '@/types';

interface Props {
  events: MatchEvent[];
  match: Match;
}

const eventConfig: Record<string, { icon: string; color: string; label: string }> = {
  GOL: { icon: '\u26BD', color: '#2e7d32', label: 'Gol' },
  GOL_CONTRA: { icon: '\u26BD', color: '#c62828', label: 'Gol Contra' },
  GOL_PENALTI: { icon: '\u26BD', color: '#1565c0', label: 'Penalti' },
  CARTAO_AMARELO: { icon: '\uD83D\uDFE8', color: '#f9a825', label: 'Amarelo' },
  CARTAO_VERMELHO: { icon: '\uD83D\uDFE5', color: '#c62828', label: 'Vermelho' },
  SEGUNDO_AMARELO: { icon: '\uD83D\uDFE8', color: '#e65100', label: '2o Amarelo' },
  SUBSTITUICAO_ENTRADA: { icon: '\uD83D\uDD04', color: '#1565c0', label: 'Entrou' },
  SUBSTITUICAO_SAIDA: { icon: '\uD83D\uDD04', color: '#757575', label: 'Saiu' },
};

function getEventConfig(type: string) {
  return eventConfig[type] || { icon: '\u2022', color: '#757575', label: type };
}

export default function MatchTimeline({ events, match }: Props) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Nenhum evento registrado para esta partida
        </p>
      </div>
    );
  }

  // Group events by half
  const firstHalf = events.filter((e) => e.half === '1');
  const secondHalf = events.filter((e) => e.half === '2');
  const other = events.filter((e) => !e.half || (e.half !== '1' && e.half !== '2'));

  const renderEvent = (event: MatchEvent) => {
    const config = getEventConfig(event.event_type);
    const isHome = event.team_id === match.home_team_id;

    return (
      <div
        key={event.id}
        className={cn(
          'flex items-center gap-2 mb-3',
          isHome ? 'flex-row' : 'flex-row-reverse'
        )}
      >
        {/* Event info */}
        <div
          className={cn(
            'flex-1 p-3 flex items-center gap-2 rounded-lg transition-colors',
            isHome ? 'flex-row' : 'flex-row-reverse',
            isHome
              ? 'bg-[#1a237e]/[0.04] hover:bg-[#1a237e]/[0.08]'
              : 'bg-[#b71c1c]/[0.04] hover:bg-[#b71c1c]/[0.08]'
          )}
        >
          <span className="text-xl leading-none">{config.icon}</span>
          <div className={cn('flex-1', isHome ? 'text-left' : 'text-right')}>
            <p className="text-sm font-semibold">{event.player_name}</p>
            {event.notes && (
              <p className="text-xs text-muted-foreground">{event.notes}</p>
            )}
          </div>
        </div>

        {/* Minute badge */}
        <Badge
          className="min-w-[44px] justify-center font-bold text-xs text-white"
          style={{ backgroundColor: config.color }}
        >
          {event.minute ? `${event.minute}'` : '-'}
        </Badge>

        {/* Spacer for the other side */}
        <div className="flex-1" />
      </div>
    );
  };

  const renderHalfSection = (title: string, halfEvents: MatchEvent[]) => {
    if (halfEvents.length === 0) return null;
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 h-px bg-border" />
          <Badge variant="outline" className="font-semibold text-[0.7rem]">
            {title}
          </Badge>
          <div className="flex-1 h-px bg-border" />
        </div>
        {halfEvents.map(renderEvent)}
      </div>
    );
  };

  return (
    <div>
      <h3 className="text-lg font-bold text-[#1a237e] mb-2">
        LANCE A LANCE
      </h3>

      {/* Team headers */}
      <div className="flex justify-between mb-4 px-2">
        <span className="text-sm font-bold text-[#1a237e]">
          {match.home_team_short || match.home_team_name}
        </span>
        <span className="text-sm font-bold text-[#b71c1c]">
          {match.away_team_short || match.away_team_name}
        </span>
      </div>

      {renderHalfSection('1o TEMPO', firstHalf)}
      {renderHalfSection('2o TEMPO', secondHalf)}
      {renderHalfSection('OUTROS', other)}
    </div>
  );
}
