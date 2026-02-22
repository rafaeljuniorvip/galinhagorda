'use client';

import { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, Avatar, Chip, Skeleton } from '@mui/material';
import { Match } from '@/types';
import { formatDateTime } from '@/lib/utils';

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

  if (loading) return <Grid container spacing={2}>{[1,2,3].map(i => <Grid item xs={12} sm={6} md={4} key={i}><Skeleton variant="rounded" height={130} /></Grid>)}</Grid>;
  if (matches.length === 0) return <Typography color="text.secondary">Nenhuma partida cadastrada</Typography>;

  const statusColor = (s: string) => {
    if (s === 'Finalizada') return 'success';
    if (s === 'Em Andamento') return 'primary';
    if (s === 'Agendada') return 'default';
    return 'error';
  };

  return (
    <Grid container spacing={2}>
      {matches.map((m) => (
        <Grid item xs={12} sm={6} md={4} key={m.id}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 1.5 }}>
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Avatar src={m.home_team_logo || ''} sx={{ width: 32, height: 32, mx: 'auto', mb: 0.5 }}>{m.home_team_short?.[0]}</Avatar>
                  <Typography variant="caption" fontWeight={600} noWrap>{m.home_team_short || m.home_team_name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 60, justifyContent: 'center' }}>
                  <Typography variant="h5" fontWeight={800}>{m.home_score ?? '-'}</Typography>
                  <Typography variant="body2" color="text.secondary">x</Typography>
                  <Typography variant="h5" fontWeight={800}>{m.away_score ?? '-'}</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Avatar src={m.away_team_logo || ''} sx={{ width: 32, height: 32, mx: 'auto', mb: 0.5 }}>{m.away_team_short?.[0]}</Avatar>
                  <Typography variant="caption" fontWeight={600} noWrap>{m.away_team_short || m.away_team_name}</Typography>
                </Box>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                {m.match_date && <Typography variant="caption" color="text.secondary" display="block">{formatDateTime(m.match_date)}</Typography>}
                {m.venue && <Typography variant="caption" color="text.secondary" display="block">{m.venue}</Typography>}
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', mt: 0.5 }}>
                  <Chip label={m.status} size="small" color={statusColor(m.status) as any} />
                  {m.match_round && <Chip label={m.match_round} size="small" variant="outlined" />}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
