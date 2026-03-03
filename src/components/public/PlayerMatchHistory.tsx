'use client';

import { useState, useEffect } from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Match } from '@/types';
import { formatDateTime } from '@/lib/utils';

interface Props {
  playerId: string;
  championshipId: string;
}

export default function PlayerMatchHistory({ playerId, championshipId }: Props) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (championshipId) params.set('championship_id', championshipId);
      const res = await fetch(`/api/players/${playerId}/matches?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMatches(Array.isArray(data) ? data : data.data || []);
      }
      setLoading(false);
    }
    load();
  }, [playerId, championshipId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-[120px] rounded-lg" />
        ))}
      </div>
    );
  }

  if (matches.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-bold text-[#1a237e] mb-4">
        RESULTADOS DOS JOGOS
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {matches.filter(m => m.status === 'Finalizada').map((match) => (
          <Card key={match.id} className="border hover:border-[#1976d2] transition-colors">
            <CardContent className="p-4">
              {/* Placar */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="text-center flex-1">
                  <Avatar className="h-8 w-8 mx-auto mb-1">
                    <AvatarImage src={match.home_team_logo || ''} />
                    <AvatarFallback className="text-xs">
                      {match.home_team_short?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-semibold truncate block">
                    {match.home_team_short || match.home_team_name}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-xl font-extrabold">{match.home_score}</span>
                  <span className="text-sm text-muted-foreground">x</span>
                  <span className="text-xl font-extrabold">{match.away_score}</span>
                </div>

                <div className="text-center flex-1">
                  <Avatar className="h-8 w-8 mx-auto mb-1">
                    <AvatarImage src={match.away_team_logo || ''} />
                    <AvatarFallback className="text-xs">
                      {match.away_team_short?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-semibold truncate block">
                    {match.away_team_short || match.away_team_name}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="flex flex-col gap-1 items-center">
                {match.match_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(match.match_date)}
                    </span>
                  </div>
                )}
                {match.venue && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{match.venue}</span>
                  </div>
                )}
                {match.match_round && (
                  <Badge variant="outline" className="mt-1 text-xs">
                    {match.match_round}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
