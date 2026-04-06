'use client';

import { useState, useEffect, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Match } from '@/types';
import MatchCard from './MatchCard';
import { Trophy, Swords, Calendar } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Props { championshipId: string; }

function formatRoundDate(matches: Match[]): string {
  const dates = matches
    .map(m => m.match_date ? new Date(m.match_date) : null)
    .filter(Boolean) as Date[];
  if (dates.length === 0) return '';
  const unique = Array.from(new Set(dates.map(d => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }))));
  return unique.join(' e ');
}

function getRoundStyle(round: string) {
  const r = round.toLowerCase();
  if (r.includes('final') && !r.includes('semi')) return { icon: Trophy, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' };
  if (r.includes('semi')) return { icon: Swords, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' };
  return { icon: Calendar, color: 'text-[#1a237e]', bg: 'bg-[#f0f2ff] border-[#c5cae9]' };
}

function getRoundStats(matches: Match[]) {
  const finished = matches.filter(m => m.status === 'Finalizada').length;
  const total = matches.length;
  const goals = matches.reduce((sum, m) => sum + (m.home_score ?? 0) + (m.away_score ?? 0), 0);
  return { finished, total, goals };
}

export default function ChampionshipMatchesClient({ championshipId }: Props) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/matches?championship_id=${championshipId}&limit=100`)
      .then(r => r.json())
      .then(d => { setMatches(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [championshipId]);

  // Group by round, maintaining order
  const grouped = useMemo(() => {
    const map = new Map<string, Match[]>();
    for (const m of matches) {
      const key = m.match_round || 'Sem rodada';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries());
  }, [matches]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => <Skeleton key={i} className="h-[200px] rounded-lg" />)}
      </div>
    );
  }

  if (matches.length === 0) {
    return <p className="text-muted-foreground">Nenhuma partida cadastrada</p>;
  }

  return (
    <div className="space-y-6">
      {grouped.map(([round, roundMatches]) => {
        const style = getRoundStyle(round);
        const IconComp = style.icon;
        const stats = getRoundStats(roundMatches);
        const dateStr = formatRoundDate(roundMatches);
        const allFinished = stats.finished === stats.total;

        return (
          <div key={round}>
            {/* Round Header */}
            <div className={cn('flex items-center justify-between px-4 py-2.5 rounded-t-lg border', style.bg)}>
              <div className="flex items-center gap-2">
                <IconComp className={cn('h-5 w-5', style.color)} />
                <h3 className={cn('text-sm font-bold', style.color)}>{round}</h3>
                {dateStr && (
                  <span className="text-[11px] text-muted-foreground hidden sm:inline">— {dateStr}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {allFinished && stats.goals > 0 && (
                  <Badge variant="outline" className="text-[10px] font-medium">
                    {stats.goals} gol{stats.goals !== 1 ? 's' : ''}
                  </Badge>
                )}
                <Badge variant="outline" className={cn('text-[10px]', allFinished ? 'border-green-300 text-green-700' : 'text-muted-foreground')}>
                  {allFinished ? 'Encerrada' : `${stats.finished}/${stats.total} jogos`}
                </Badge>
              </div>
            </div>

            {/* Matches Grid */}
            <div className="border border-t-0 rounded-b-lg bg-white p-3">
              <div className={cn(
                'grid gap-3',
                roundMatches.length === 1 ? 'grid-cols-1 max-w-md' :
                roundMatches.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
              )}>
                {roundMatches.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
