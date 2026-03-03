import Link from 'next/link';
import { Calendar, MapPin } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import { Match } from '@/types';

interface Props {
  match: Match;
  highlightTeamId?: string;
}

export default function MatchResultCard({ match, highlightTeamId }: Props) {
  const isFinished = match.status === 'Finalizada';
  const isLive = match.status === 'Em Andamento';
  const matchDate = match.match_date ? new Date(match.match_date) : null;

  let badge: { label: string; bg: string } | null = null;
  if (highlightTeamId && isFinished && match.home_score != null && match.away_score != null) {
    const isHome = match.home_team_id === highlightTeamId;
    const teamScore = isHome ? match.home_score : match.away_score;
    const oppScore = isHome ? match.away_score : match.home_score;
    if (teamScore > oppScore) badge = { label: 'V', bg: '#2e7d32' };
    else if (teamScore === oppScore) badge = { label: 'E', bg: '#ed6c02' };
    else badge = { label: 'D', bg: '#d32f2f' };
  }

  const homeWin = isFinished && match.home_score != null && match.away_score != null && match.home_score > match.away_score;
  const awayWin = isFinished && match.home_score != null && match.away_score != null && match.away_score > match.home_score;

  return (
    <div
      className={cn(
        'rounded-lg overflow-hidden transition-shadow hover:shadow-md',
        isLive ? 'ring-2 ring-[#d32f2f]' : 'border border-border'
      )}
    >
      <Link href={`/partidas/${match.id}`} className="block no-underline text-inherit">
        {/* Header */}
        <div className="bg-[#0d1b2a] px-4 py-2 flex items-center justify-between">
          <span className="text-[11px] text-white/50 font-medium uppercase tracking-wide">
            {match.match_round || (isFinished ? 'Encerrado' : isLive ? 'Em andamento' : 'Agendado')}
          </span>
          <div className="flex items-center gap-1.5">
            {isLive && (
              <Badge className="bg-[#d32f2f] text-white text-[0.6rem] h-5 border-transparent hover:bg-[#d32f2f] gap-1 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-blink" />
                AO VIVO
              </Badge>
            )}
            {badge && (
              <Badge
                className="font-bold text-[0.65rem] h-5 min-w-[24px] justify-center border-transparent text-white"
                style={{ backgroundColor: badge.bg }}
              >
                {badge.label}
              </Badge>
            )}
          </div>
        </div>

        {/* Teams */}
        <div className="bg-white px-4 py-3">
          {/* Home team */}
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={match.home_team_logo || ''} />
              <AvatarFallback className="text-[10px] font-bold bg-muted">
                {(match.home_team_short || match.home_team_name)?.[0]}
              </AvatarFallback>
            </Avatar>
            <span className={cn('flex-1 text-sm', homeWin ? 'font-bold text-foreground' : 'font-medium text-foreground/80')}>
              {match.home_team_name}
            </span>
            {(isFinished || isLive) ? (
              <span className={cn('text-lg font-extrabold tabular-nums w-6 text-right', homeWin ? 'text-[#1a237e]' : 'text-foreground/70')}>
                {match.home_score ?? 0}
              </span>
            ) : (
              <span className="text-sm font-bold text-muted-foreground/40 w-6 text-right">-</span>
            )}
          </div>

          <div className="border-t border-dashed border-border/40 my-2 mx-11" />

          {/* Away team */}
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={match.away_team_logo || ''} />
              <AvatarFallback className="text-[10px] font-bold bg-muted">
                {(match.away_team_short || match.away_team_name)?.[0]}
              </AvatarFallback>
            </Avatar>
            <span className={cn('flex-1 text-sm', awayWin ? 'font-bold text-foreground' : 'font-medium text-foreground/80')}>
              {match.away_team_name}
            </span>
            {(isFinished || isLive) ? (
              <span className={cn('text-lg font-extrabold tabular-nums w-6 text-right', awayWin ? 'text-[#1a237e]' : 'text-foreground/70')}>
                {match.away_score ?? 0}
              </span>
            ) : (
              <span className="text-sm font-bold text-muted-foreground/40 w-6 text-right">-</span>
            )}
          </div>
        </div>

        {/* Footer */}
        {(matchDate || match.venue) && (
          <div className="bg-[#f8f9fa] px-4 py-2 flex items-center gap-3 text-[11px] text-muted-foreground border-t border-border/30">
            {matchDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {matchDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  {!isFinished && ` ${matchDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                </span>
              </div>
            )}
            {match.venue && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{match.venue}</span>
              </div>
            )}
          </div>
        )}
      </Link>
    </div>
  );
}
