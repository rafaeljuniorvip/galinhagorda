'use client';

import {
  Card,
  CardActionArea,
  CardContent,
  Box,
  Typography,
  Avatar,
  Chip,
} from '@mui/material';
import { LiveTv } from '@mui/icons-material';
import { Match } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Props {
  match: Match;
  hasLiveStream?: boolean;
}

const statusColor = (s: string) => {
  if (s === 'Finalizada') return 'success';
  if (s === 'Em Andamento') return 'primary';
  if (s === 'Agendada') return 'default';
  if (s === 'Adiada') return 'warning';
  return 'error';
};

export default function MatchCard({ match, hasLiveStream }: Props) {
  const router = useRouter();

  const isLive = match.status === 'Em Andamento';
  const showLiveBadge = hasLiveStream || isLive;

  return (
    <Card
      variant="outlined"
      sx={{
        position: 'relative',
        overflow: 'visible',
        transition: 'transform 0.2s, box-shadow 0.2s',
        border: match.is_featured ? '2px solid #ffd600' : undefined,
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        },
      }}
    >
      {showLiveBadge && (
        <Chip
          icon={<LiveTv sx={{ fontSize: 14, color: 'white !important' }} />}
          label="AO VIVO"
          size="small"
          sx={{
            position: 'absolute',
            top: -10,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: '#d32f2f',
            color: 'white',
            fontWeight: 700,
            fontSize: '0.65rem',
            zIndex: 1,
            animation: 'matchCardPulse 1.5s infinite',
            '@keyframes matchCardPulse': {
              '0%': { boxShadow: '0 0 0 0 rgba(211,47,47,0.5)' },
              '70%': { boxShadow: '0 0 0 6px rgba(211,47,47,0)' },
              '100%': { boxShadow: '0 0 0 0 rgba(211,47,47,0)' },
            },
          }}
        />
      )}

      {match.is_featured && (
        <Box
          sx={{
            position: 'absolute',
            top: -1,
            left: -1,
            right: -1,
            height: 3,
            background: 'linear-gradient(90deg, #ffd600 0%, #ffab00 100%)',
            borderRadius: '4px 4px 0 0',
          }}
        />
      )}

      <CardActionArea onClick={() => router.push(`/partidas/${match.id}`)}>
        <CardContent sx={{ pt: showLiveBadge ? 2.5 : 2 }}>
          {/* Teams and score */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
              mb: 1.5,
            }}
          >
            {/* Home team */}
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Avatar
                src={match.home_team_logo || ''}
                sx={{ width: 36, height: 36, mx: 'auto', mb: 0.5 }}
              >
                {(match.home_team_short || match.home_team_name || '?')[0]}
              </Avatar>
              <Typography variant="caption" fontWeight={600} noWrap>
                {match.home_team_short || match.home_team_name}
              </Typography>
            </Box>

            {/* Score */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                minWidth: 70,
                justifyContent: 'center',
              }}
            >
              <Typography
                variant="h4"
                fontWeight={800}
                sx={{ color: '#1a237e', lineHeight: 1 }}
              >
                {match.home_score ?? '-'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mx: 0.25 }}>
                x
              </Typography>
              <Typography
                variant="h4"
                fontWeight={800}
                sx={{ color: '#1a237e', lineHeight: 1 }}
              >
                {match.away_score ?? '-'}
              </Typography>
            </Box>

            {/* Away team */}
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Avatar
                src={match.away_team_logo || ''}
                sx={{ width: 36, height: 36, mx: 'auto', mb: 0.5 }}
              >
                {(match.away_team_short || match.away_team_name || '?')[0]}
              </Avatar>
              <Typography variant="caption" fontWeight={600} noWrap>
                {match.away_team_short || match.away_team_name}
              </Typography>
            </Box>
          </Box>

          {/* Info */}
          <Box sx={{ textAlign: 'center' }}>
            {match.match_date && (
              <Typography variant="caption" color="text.secondary" display="block">
                {formatDateTime(match.match_date)}
              </Typography>
            )}
            {match.venue && (
              <Typography variant="caption" color="text.secondary" display="block">
                {match.venue}
              </Typography>
            )}
            <Box
              sx={{
                display: 'flex',
                gap: 0.5,
                justifyContent: 'center',
                mt: 0.75,
                flexWrap: 'wrap',
              }}
            >
              <Chip
                label={match.status}
                size="small"
                color={statusColor(match.status) as any}
              />
              {match.match_round && (
                <Chip
                  label={match.match_round}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
