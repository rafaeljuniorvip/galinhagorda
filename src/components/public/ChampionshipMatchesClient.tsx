'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Match } from '@/types';
import MatchCard from './MatchCard';

interface Props { championshipId: string; }

export default function ChampionshipMatchesClient({ championshipId }: Props) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/matches?championship_id=${championshipId}&limit=50`)
      .then(r => r.json())
      .then(d => { setMatches(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [championshipId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-[160px] rounded-lg" />
        ))}
      </div>
    );
  }

  if (matches.length === 0) {
    return <p className="text-muted-foreground">Nenhuma partida cadastrada</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {matches.map((m) => (
        <MatchCard key={m.id} match={m} />
      ))}
    </div>
  );
}
