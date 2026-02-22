'use client';

import { Box, Typography, Paper, Chip } from '@mui/material';
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
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">
          Nenhum evento registrado para esta partida
        </Typography>
      </Box>
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
      <Box
        key={event.id}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 1.5,
          flexDirection: isHome ? 'row' : 'row-reverse',
        }}
      >
        {/* Event info */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: isHome ? 'rgba(26,35,126,0.04)' : 'rgba(183,28,28,0.04)',
            borderRadius: 2,
            flexDirection: isHome ? 'row' : 'row-reverse',
            transition: 'background-color 0.2s',
            '&:hover': {
              bgcolor: isHome ? 'rgba(26,35,126,0.08)' : 'rgba(183,28,28,0.08)',
            },
          }}
        >
          <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>{config.icon}</Typography>
          <Box sx={{ flex: 1, textAlign: isHome ? 'left' : 'right' }}>
            <Typography variant="body2" fontWeight={600}>
              {event.player_name}
            </Typography>
            {event.notes && (
              <Typography variant="caption" color="text.secondary">
                {event.notes}
              </Typography>
            )}
          </Box>
        </Paper>

        {/* Minute badge */}
        <Chip
          label={event.minute ? `${event.minute}'` : '-'}
          size="small"
          sx={{
            minWidth: 44,
            fontWeight: 700,
            bgcolor: config.color,
            color: 'white',
            fontSize: '0.75rem',
          }}
        />

        {/* Spacer for the other side */}
        <Box sx={{ flex: 1 }} />
      </Box>
    );
  };

  const renderHalfSection = (title: string, halfEvents: MatchEvent[]) => {
    if (halfEvents.length === 0) return null;
    return (
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 2,
          }}
        >
          <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
          <Chip
            label={title}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 600, fontSize: '0.7rem' }}
          />
          <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
        </Box>
        {halfEvents.map(renderEvent)}
      </Box>
    );
  };

  return (
    <Box>
      <Typography
        variant="h6"
        fontWeight={700}
        gutterBottom
        sx={{ color: '#1a237e' }}
      >
        LANCE A LANCE
      </Typography>

      {/* Team headers */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: 2,
          px: 1,
        }}
      >
        <Typography variant="body2" fontWeight={700} color="primary">
          {match.home_team_short || match.home_team_name}
        </Typography>
        <Typography variant="body2" fontWeight={700} sx={{ color: '#b71c1c' }}>
          {match.away_team_short || match.away_team_name}
        </Typography>
      </Box>

      {renderHalfSection('1o TEMPO', firstHalf)}
      {renderHalfSection('2o TEMPO', secondHalf)}
      {renderHalfSection('OUTROS', other)}
    </Box>
  );
}
