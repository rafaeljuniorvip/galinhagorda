import { Box, Typography } from '@mui/material';
import { Match, MatchEvent } from '@/types';

interface MatchEventsImageProps {
  match: Match;
  events: MatchEvent[];
  championshipName: string;
}

const EVENT_ICONS: Record<string, { icon: string; color: string; label: string }> = {
  GOL: { icon: '\u26BD', color: '#2e7d32', label: 'Gol' },
  GOL_PENALTI: { icon: '\u26BD', color: '#1565c0', label: 'Gol (Pen)' },
  GOL_CONTRA: { icon: '\u26BD', color: '#d32f2f', label: 'Gol Contra' },
  CARTAO_AMARELO: { icon: '\uD83D\uDFE8', color: '#f9a825', label: 'Amarelo' },
  CARTAO_VERMELHO: { icon: '\uD83D\uDFE5', color: '#d32f2f', label: 'Vermelho' },
  SEGUNDO_AMARELO: { icon: '\uD83D\uDFE7', color: '#e65100', label: '2 Amarelo' },
  SUBSTITUICAO_ENTRADA: { icon: '\u2B06\uFE0F', color: '#1565c0', label: 'Entrou' },
  SUBSTITUICAO_SAIDA: { icon: '\u2B07\uFE0F', color: '#757575', label: 'Saiu' },
};

function formatMatchDate(date: string | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function MatchEventsImage({ match, events, championshipName }: MatchEventsImageProps) {
  const homeEvents = events.filter(e => e.team_name === match.home_team_name);
  const awayEvents = events.filter(e => e.team_name === match.away_team_name);

  const countEvents = (evts: MatchEvent[], types: string[]) =>
    evts.filter(e => types.includes(e.event_type)).length;

  const homeGoals = countEvents(homeEvents, ['GOL', 'GOL_PENALTI']);
  const awayGoals = countEvents(awayEvents, ['GOL', 'GOL_PENALTI']);
  const homeYellows = countEvents(homeEvents, ['CARTAO_AMARELO', 'SEGUNDO_AMARELO']);
  const awayYellows = countEvents(awayEvents, ['CARTAO_AMARELO', 'SEGUNDO_AMARELO']);
  const homeReds = countEvents(homeEvents, ['CARTAO_VERMELHO']);
  const awayReds = countEvents(awayEvents, ['CARTAO_VERMELHO']);

  const renderEvent = (e: MatchEvent) => {
    const info = EVENT_ICONS[e.event_type] || { icon: '', color: '#333', label: e.event_type };
    return (
      <Box key={e.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
        <span style={{ fontSize: 16 }}>{info.icon}</span>
        <Typography sx={{ fontSize: 13, color: '#333' }}>
          <span style={{ fontWeight: 600 }}>{e.minute ? `${e.minute}'` : ''}</span>
          {' '}{e.player_name}
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ width: 1080, fontFamily: '"Inter", sans-serif', bgcolor: '#ffffff' }}>
      {/* Header */}
      <Box sx={{ background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)', px: 4, py: 1.5, textAlign: 'center' }}>
        <Typography sx={{ color: '#ffc107', fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
          {championshipName} {match.match_round ? `- ${match.match_round}` : ''}
        </Typography>
      </Box>

      {/* Score Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3, px: 4, bgcolor: '#f5f5f5' }}>
        {/* Home */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
          <Typography sx={{ fontSize: 22, fontWeight: 700, textAlign: 'right' }}>
            {match.home_team_name}
          </Typography>
          {match.home_team_logo && (
            <img src={match.home_team_logo} alt="" width={56} height={56} style={{ objectFit: 'contain' }} />
          )}
        </Box>

        {/* Score */}
        <Box sx={{ mx: 3, px: 4, py: 1, bgcolor: '#1a237e', borderRadius: 2 }}>
          <Typography sx={{ fontSize: 36, fontWeight: 700, color: '#ffffff', letterSpacing: 4 }}>
            {match.home_score ?? 0} - {match.away_score ?? 0}
          </Typography>
        </Box>

        {/* Away */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 2 }}>
          {match.away_team_logo && (
            <img src={match.away_team_logo} alt="" width={56} height={56} style={{ objectFit: 'contain' }} />
          )}
          <Typography sx={{ fontSize: 22, fontWeight: 700 }}>
            {match.away_team_name}
          </Typography>
        </Box>
      </Box>

      {/* Match Info */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, py: 1, bgcolor: '#e8eaf6', fontSize: 12, color: '#444' }}>
        {match.match_date && <span>{formatMatchDate(match.match_date)}</span>}
        {match.venue && <span>{match.venue}</span>}
        {match.referee && <span>Arbitro: {match.referee}</span>}
      </Box>

      {/* Events two columns */}
      <Box sx={{ display: 'flex', px: 4, py: 2, minHeight: 120 }}>
        {/* Home events */}
        <Box sx={{ flex: 1, pr: 3, borderRight: '1px solid #e0e0e0' }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#1a237e', mb: 1, textTransform: 'uppercase' }}>
            {match.home_team_name}
          </Typography>
          {homeEvents.length > 0 ? homeEvents.map(renderEvent) : (
            <Typography sx={{ fontSize: 12, color: '#999' }}>Sem eventos</Typography>
          )}
        </Box>
        {/* Away events */}
        <Box sx={{ flex: 1, pl: 3 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#1a237e', mb: 1, textTransform: 'uppercase' }}>
            {match.away_team_name}
          </Typography>
          {awayEvents.length > 0 ? awayEvents.map(renderEvent) : (
            <Typography sx={{ fontSize: 12, color: '#999' }}>Sem eventos</Typography>
          )}
        </Box>
      </Box>

      {/* Summary Stats */}
      <Box sx={{ display: 'flex', bgcolor: '#263238', color: '#ffffff', px: 4, py: 1.5 }}>
        {[
          { label: 'Gols', home: homeGoals, away: awayGoals },
          { label: 'C. Amarelos', home: homeYellows, away: awayYellows },
          { label: 'C. Vermelhos', home: homeReds, away: awayReds },
        ].map((stat) => (
          <Box key={stat.label} sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700, width: 30, textAlign: 'right' }}>{stat.home}</Typography>
            <Typography sx={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase' }}>{stat.label}</Typography>
            <Typography sx={{ fontSize: 16, fontWeight: 700, width: 30, textAlign: 'left' }}>{stat.away}</Typography>
          </Box>
        ))}
      </Box>

      {/* Footer */}
      <Box sx={{ background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)', px: 4, py: 1.5, textAlign: 'center' }}>
        <Typography sx={{ color: '#ffc107', fontSize: 14, fontWeight: 700 }}>galinhagorda.vip</Typography>
      </Box>
    </Box>
  );
}
