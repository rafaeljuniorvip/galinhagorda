'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Avatar, Chip, Skeleton,
} from '@mui/material';
import { CalendarMonth, LocationOn } from '@mui/icons-material';
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
      const res = await fetch(`/api/matches?championship_id=${championshipId}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setMatches(data.data || []);
      }
      setLoading(false);
    }
    load();
  }, [playerId, championshipId]);

  if (loading) {
    return (
      <Grid container spacing={2}>
        {[1, 2, 3].map(i => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Skeleton variant="rounded" height={120} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (matches.length === 0) return null;

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: '#1a237e' }}>
        RESULTADOS DOS JOGOS
      </Typography>
      <Grid container spacing={2}>
        {matches.filter(m => m.status === 'Finalizada').map((match) => (
          <Grid item xs={12} sm={6} md={4} key={match.id}>
            <Card variant="outlined" sx={{ '&:hover': { borderColor: '#1976d2' } }}>
              <CardContent>
                {/* Placar */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 2 }}>
                  <Box sx={{ textAlign: 'center', flex: 1 }}>
                    <Avatar src={match.home_team_logo || ''} sx={{ width: 32, height: 32, mx: 'auto', mb: 0.5 }}>
                      {match.home_team_short?.[0]}
                    </Avatar>
                    <Typography variant="caption" fontWeight={600} noWrap>
                      {match.home_team_short || match.home_team_name}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="h5" fontWeight={800}>{match.home_score}</Typography>
                    <Typography variant="body2" color="text.secondary">x</Typography>
                    <Typography variant="h5" fontWeight={800}>{match.away_score}</Typography>
                  </Box>

                  <Box sx={{ textAlign: 'center', flex: 1 }}>
                    <Avatar src={match.away_team_logo || ''} sx={{ width: 32, height: 32, mx: 'auto', mb: 0.5 }}>
                      {match.away_team_short?.[0]}
                    </Avatar>
                    <Typography variant="caption" fontWeight={600} noWrap>
                      {match.away_team_short || match.away_team_name}
                    </Typography>
                  </Box>
                </Box>

                {/* Info */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
                  {match.match_date && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarMonth sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(match.match_date)}
                      </Typography>
                    </Box>
                  )}
                  {match.venue && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationOn sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">{match.venue}</Typography>
                    </Box>
                  )}
                  {match.match_round && (
                    <Chip label={match.match_round} size="small" variant="outlined" sx={{ mt: 0.5 }} />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
