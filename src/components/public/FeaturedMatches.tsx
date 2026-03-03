'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, MapPin } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import Link from 'next/link';
import { Match } from '@/types';

interface Props {
  initialMatches: Match[];
}

export default function FeaturedMatches({ initialMatches }: Props) {
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/public/featured-matches');
        if (res.ok) {
          const data = await res.json();
          setMatches(data);
        }
      } catch {
        // Silently fail
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -340 : 340,
      behavior: 'smooth',
    });
  };

  if (matches.length === 0) return null;

  return (
    <div className="relative">
      {matches.length > 3 && (
        <>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-[2] bg-white shadow-md hover:bg-gray-50 hidden md:flex rounded-full h-10 w-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-[2] bg-white shadow-md hover:bg-gray-50 hidden md:flex rounded-full h-10 w-10"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin"
      >
        {matches.map((match) => {
          const isLive = match.status === 'Em Andamento';
          const isFinished = match.status === 'Finalizada';
          const matchDate = match.match_date ? new Date(match.match_date) : null;

          return (
            <div
              key={match.id}
              className={cn(
                'min-w-[320px] max-w-[320px] flex-shrink-0 snap-start rounded-lg overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg',
                isLive ? 'ring-2 ring-[#d32f2f]' : 'border border-border'
              )}
            >
              <Link href={`/partidas/${match.id}`} className="block no-underline text-inherit">
                {/* Header */}
                <div className="bg-[#0d1b2a] px-4 py-2.5 flex items-center justify-between">
                  <span className="text-[11px] text-white/50 font-medium truncate max-w-[180px] uppercase tracking-wide">
                    {match.championship_name}
                  </span>
                  {isLive ? (
                    <Badge className="bg-[#d32f2f] text-white font-bold text-[0.6rem] h-5 border-transparent hover:bg-[#d32f2f] gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-blink" />
                      AO VIVO
                    </Badge>
                  ) : (
                    <Badge
                      className={cn(
                        'text-[0.6rem] h-5 border-transparent font-semibold',
                        isFinished
                          ? 'bg-[#2e7d32] text-white'
                          : 'bg-white/10 text-white/60'
                      )}
                    >
                      {match.status}
                    </Badge>
                  )}
                </div>

                {/* Match Content */}
                <div className="bg-white px-4 py-5">
                  <div className="flex items-center justify-between gap-2">
                    {/* Home team */}
                    <div className="flex-1 text-center">
                      <Avatar className="h-14 w-14 mx-auto mb-2">
                        <AvatarImage src={match.home_team_logo || ''} alt={match.home_team_name || ''} />
                        <AvatarFallback className="text-base font-bold bg-muted">
                          {match.home_team_short?.[0] || match.home_team_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-semibold block leading-tight">
                        {match.home_team_short || match.home_team_name}
                      </span>
                    </div>

                    {/* Score */}
                    <div className="shrink-0 text-center px-2">
                      {isFinished || isLive ? (
                        <div className="bg-[#0d1b2a] rounded-lg px-4 py-2 min-w-[80px]">
                          <span
                            className={cn(
                              'text-2xl font-extrabold tabular-nums',
                              isLive ? 'text-[#ef5350]' : 'text-white'
                            )}
                          >
                            {match.home_score ?? 0} - {match.away_score ?? 0}
                          </span>
                        </div>
                      ) : (
                        <div className="bg-muted/60 rounded-lg px-4 py-2 min-w-[80px]">
                          <span className="text-lg font-bold text-muted-foreground">VS</span>
                        </div>
                      )}
                    </div>

                    {/* Away team */}
                    <div className="flex-1 text-center">
                      <Avatar className="h-14 w-14 mx-auto mb-2">
                        <AvatarImage src={match.away_team_logo || ''} alt={match.away_team_name || ''} />
                        <AvatarFallback className="text-base font-bold bg-muted">
                          {match.away_team_short?.[0] || match.away_team_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-semibold block leading-tight">
                        {match.away_team_short || match.away_team_name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-[#f8f9fa] px-4 py-2 flex items-center justify-center gap-3 text-[11px] text-muted-foreground border-t border-border/30">
                  {match.match_round && (
                    <span className="font-medium">{match.match_round}</span>
                  )}
                  {match.match_round && matchDate && <span className="text-border">|</span>}
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
                    <>
                      <span className="text-border">|</span>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate max-w-[120px]">{match.venue}</span>
                      </div>
                    </>
                  )}
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
