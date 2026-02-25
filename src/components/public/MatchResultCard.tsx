import { Card, CardActionArea, Box, Avatar, Typography, Chip } from '@mui/material';
import Link from 'next/link';
import { Match } from '@/types';

interface Props {
  match: Match;
  highlightTeamId?: string;
}

export default function MatchResultCard({ match, highlightTeamId }: Props) {
  const isFinished = match.status === 'Finalizada';
  const matchDate = match.match_date ? new Date(match.match_date) : null;

  // Determine V/E/D badge for highlighted team
  let badge: { label: string; color: string; bg: string } | null = null;
  if (highlightTeamId && isFinished && match.home_score !== null && match.away_score !== null) {
    const isHome = match.home_team_id === highlightTeamId;
    const teamScore = isHome ? match.home_score : match.away_score;
    const oppScore = isHome ? match.away_score : match.home_score;
    if (teamScore > oppScore) badge = { label: 'V', color: '#fff', bg: '#2e7d32' };
    else if (teamScore === oppScore) badge = { label: 'E', color: '#fff', bg: '#ed6c02' };
    else badge = { label: 'D', color: '#fff', bg: '#d32f2f' };
  }

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardActionArea component={Link} href={`/partidas/${match.id}`} sx={{ p: 1.5, height: '100%' }}>
        {/* Round / Date */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          {match.match_round && (
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {match.match_round}
            </Typography>
          )}
          {badge && (
            <Chip label={badge.label} size="small" sx={{ bgcolor: badge.bg, color: badge.color, fontWeight: 700, minWidth: 28, height: 22 }} />
          )}
        </Box>

        {/* Teams + Score */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Home */}
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
            <Typography variant="body2" fontWeight={600} noWrap sx={{ textAlign: 'right' }}>
              {match.home_team_short || match.home_team_name}
            </Typography>
            <Avatar src={match.home_team_logo || ''} sx={{ width: 28, height: 28 }}>
              {(match.home_team_short || match.home_team_name)?.[0]}
            </Avatar>
          </Box>

          {/* Score */}
          <Box sx={{ minWidth: 56, textAlign: 'center' }}>
            {isFinished ? (
              <Typography variant="body1" fontWeight={800} sx={{ color: '#1a237e' }}>
                {match.home_score} - {match.away_score}
              </Typography>
            ) : (
              <Typography variant="caption" fontWeight={600} sx={{ color: '#666' }}>VS</Typography>
            )}
          </Box>

          {/* Away */}
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Avatar src={match.away_team_logo || ''} sx={{ width: 28, height: 28 }}>
              {(match.away_team_short || match.away_team_name)?.[0]}
            </Avatar>
            <Typography variant="body2" fontWeight={600} noWrap>
              {match.away_team_short || match.away_team_name}
            </Typography>
          </Box>
        </Box>

        {/* Date / Venue */}
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 1 }}>
          {matchDate && (
            <Typography variant="caption" color="text.secondary">
              {matchDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              {!isFinished && ` ${matchDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
            </Typography>
          )}
          {match.venue && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {match.venue}
            </Typography>
          )}
        </Box>
      </CardActionArea>
    </Card>
  );
}
