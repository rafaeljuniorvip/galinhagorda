'use client';

import { Calendar, MapPin, Radio } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import { Match } from '@/types';
import { useRouter } from 'next/navigation';

interface Props {
  match: Match;
  hasLiveStream?: boolean;
}

const statusBadge = (s: string) => {
  if (s === 'Finalizada') return 'bg-[#2e7d32] text-white';
  if (s === 'Em Andamento') return 'bg-[#d32f2f] text-white';
  if (s === 'Agendada') return 'bg-white/10 text-white/60';
  if (s === 'Adiada') return 'bg-[#ed6c02] text-white';
  return 'bg-white/10 text-white/60';
};

export default function MatchCard({ match, hasLiveStream }: Props) {
  const router = useRouter();
  const isLive = match.status === 'Em Andamento';
  const isFinished = match.status === 'Finalizada';
  const showLiveBadge = hasLiveStream || isLive;
  const matchDate = match.match_date ? new Date(match.match_date) : null;

  return (
    <div
      className={cn(
        'rounded-lg overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md relative',
        isLive ? 'ring-2 ring-[#d32f2f]' : 'border border-border',
        match.is_featured && 'ring-2 ring-[#ffd600]'
      )}
    >
      {showLiveBadge && (
        <Badge
          className={cn(
            'absolute -top-2.5 left-1/2 -translate-x-1/2 z-10',
            'bg-[#d32f2f] text-white font-bold text-[0.6rem] border-transparent',
            'hover:bg-[#d32f2f] animate-live-pulse gap-1'
          )}
        >
          <Radio className="h-3 w-3 text-white" />
          AO VIVO
        </Badge>
      )}

      {match.is_featured && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#ffd600] to-[#ffab00]" />
      )}

      <button
        onClick={() => router.push(`/partidas/${match.id}`)}
        className="w-full text-left cursor-pointer bg-transparent border-none p-0"
        type="button"
      >
        {/* Header */}
        <div className="bg-[#0d1b2a] px-3 py-2 flex items-center justify-between">
          <div className="flex gap-1.5 items-center">
            <Badge
              className={cn('text-[0.6rem] h-5 border-transparent font-semibold', statusBadge(match.status))}
            >
              {match.status}
            </Badge>
            {match.match_round && (
              <span className="text-[10px] text-white/40 font-medium">{match.match_round}</span>
            )}
          </div>
        </div>

        {/* Teams & Score */}
        <div className={cn('bg-white px-4 py-4', showLiveBadge && 'pt-5')}>
          <div className="flex items-center justify-center gap-3">
            {/* Home team */}
            <div className="text-center flex-1">
              <Avatar className="h-10 w-10 mx-auto mb-1.5">
                <AvatarImage src={match.home_team_logo || ''} />
                <AvatarFallback className="text-xs font-bold bg-muted">
                  {(match.home_team_short || match.home_team_name || '?')[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-semibold block leading-tight">
                {match.home_team_short || match.home_team_name}
              </span>
            </div>

            {/* Score */}
            <div className="shrink-0 text-center">
              {isFinished || isLive ? (
                <div className="bg-[#0d1b2a] rounded-lg px-3 py-1.5 min-w-[70px]">
                  <span className={cn(
                    'text-xl font-extrabold tabular-nums',
                    isLive ? 'text-[#ef5350]' : 'text-white'
                  )}>
                    {match.home_score ?? 0} - {match.away_score ?? 0}
                  </span>
                </div>
              ) : (
                <div className="bg-muted/60 rounded-lg px-3 py-1.5 min-w-[70px]">
                  <span className="text-base font-bold text-muted-foreground">VS</span>
                </div>
              )}
            </div>

            {/* Away team */}
            <div className="text-center flex-1">
              <Avatar className="h-10 w-10 mx-auto mb-1.5">
                <AvatarImage src={match.away_team_logo || ''} />
                <AvatarFallback className="text-xs font-bold bg-muted">
                  {(match.away_team_short || match.away_team_name || '?')[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-semibold block leading-tight">
                {match.away_team_short || match.away_team_name}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#f8f9fa] px-3 py-2 text-center border-t border-border/30">
          {matchDate && (
            <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {matchDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                {!isFinished && ` ${matchDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
              </span>
              {match.venue && (
                <>
                  <span className="mx-1 text-border">|</span>
                  <MapPin className="h-3 w-3" />
                  <span className="truncate max-w-[100px]">{match.venue}</span>
                </>
              )}
            </div>
          )}
        </div>
      </button>
    </div>
  );
}
