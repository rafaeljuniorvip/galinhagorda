'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  LinearProgress,
  Skeleton,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { VoteResult } from '@/types';

interface Props {
  matchId: string;
}

export default function VotingResults({ matchId }: Props) {
  const [results, setResults] = useState<VoteResult[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await fetch(`/api/votes?matchId=${matchId}`);
        const json = await res.json();
        setResults(json.results || []);
        setTotalVotes(json.status?.totalVotes || 0);
      } catch (error) {
        console.error('Error fetching voting results:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, [matchId]);

  if (loading) {
    return (
      <Box sx={{
        background: 'linear-gradient(135deg, #1a237e 0%, #0d1642 100%)',
        borderRadius: 3,
        p: 3,
      }}>
        <Skeleton variant="text" width={200} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.1)', mx: 'auto' }} />
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" width={120} height={160} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
          ))}
        </Box>
      </Box>
    );
  }

  if (results.length === 0) {
    return (
      <Box sx={{
        background: 'linear-gradient(135deg, #1a237e 0%, #0d1642 100%)',
        borderRadius: 3,
        p: 3,
        textAlign: 'center',
      }}>
        <EmojiEventsIcon sx={{ color: 'rgba(255,214,0,0.3)', fontSize: 48, mb: 1 }} />
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
          Nenhum voto registrado
        </Typography>
      </Box>
    );
  }

  const top3 = results.slice(0, 3);
  const rest = results.slice(3);

  const podiumColors = {
    0: { main: '#ffd600', border: 'rgba(255,214,0,0.5)', bg: 'rgba(255,214,0,0.12)' },
    1: { main: '#bdbdbd', border: 'rgba(189,189,189,0.4)', bg: 'rgba(189,189,189,0.08)' },
    2: { main: '#a1887f', border: 'rgba(161,136,127,0.4)', bg: 'rgba(161,136,127,0.08)' },
  };

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #1a237e 0%, #0d1642 100%)',
        borderRadius: 3,
        p: { xs: 2, md: 3 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <Box
        sx={{
          position: 'absolute',
          top: -80,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,214,0,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 3 }}>
        <EmojiEventsIcon sx={{ color: '#ffd600', fontSize: 32 }} />
        <Typography
          variant="h6"
          sx={{
            color: '#fff',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Craque do Jogo
        </Typography>
      </Box>

      {/* Winner highlight */}
      {results[0] && (
        <Box
          sx={{
            textAlign: 'center',
            mb: 3,
            position: 'relative',
            animation: 'fadeInScale 0.5s ease-out',
            '@keyframes fadeInScale': {
              '0%': { opacity: 0, transform: 'scale(0.9)' },
              '100%': { opacity: 1, transform: 'scale(1)' },
            },
          }}
        >
          <EmojiEventsIcon
            sx={{
              fontSize: 40,
              color: '#ffd600',
              filter: 'drop-shadow(0 4px 8px rgba(255,214,0,0.4))',
              mb: 1,
            }}
          />
          <Avatar
            src={results[0].player_photo || ''}
            sx={{
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 1,
              border: '3px solid #ffd600',
              boxShadow: '0 0 20px rgba(255,214,0,0.3)',
            }}
          >
            {results[0].player_name?.[0]}
          </Avatar>
          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, mb: 0.25 }}>
            {results[0].player_name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
            <Avatar src={results[0].team_logo || ''} sx={{ width: 20, height: 20 }}>
              {results[0].team_name?.[0]}
            </Avatar>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              {results[0].team_name}
            </Typography>
          </Box>
          <Typography variant="h4" sx={{ color: '#ffd600', fontWeight: 900 }}>
            {results[0].votes}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            {results[0].percentage}% dos votos
          </Typography>
        </Box>
      )}

      {/* Podium - 2nd and 3rd */}
      {top3.length > 1 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: { xs: 2, sm: 4 },
            mb: 3,
          }}
        >
          {top3.slice(1).map((result, idx) => {
            const posIdx = idx + 1;
            const colors = podiumColors[posIdx as keyof typeof podiumColors];
            return (
              <Box
                key={result.player_id}
                sx={{
                  textAlign: 'center',
                  p: 2,
                  borderRadius: 2,
                  bgcolor: colors.bg,
                  border: `1px solid ${colors.border}`,
                  minWidth: { xs: 100, sm: 130 },
                }}
              >
                <Typography variant="subtitle2" sx={{ color: colors.main, fontWeight: 800, mb: 1 }}>
                  {posIdx + 1}o Lugar
                </Typography>
                <Avatar
                  src={result.player_photo || ''}
                  sx={{
                    width: 52,
                    height: 52,
                    mx: 'auto',
                    mb: 1,
                    border: `2px solid ${colors.main}`,
                  }}
                >
                  {result.player_name?.[0]}
                </Avatar>
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700, mb: 0.25 }} noWrap>
                  {result.player_name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mb: 0.5 }} noWrap>
                  {result.team_name}
                </Typography>
                <Typography variant="h6" sx={{ color: colors.main, fontWeight: 800 }}>
                  {result.votes}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                  {result.percentage}%
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Rest of results */}
      {rest.length > 0 && (
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {rest.map((r, idx) => (
            <Box key={r.player_id} sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255,255,255,0.3)', width: 24, fontWeight: 700, textAlign: 'center' }}
                >
                  {idx + 4}
                </Typography>
                <Avatar src={r.player_photo || ''} sx={{ width: 28, height: 28 }}>
                  {r.player_name?.[0]}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }} noWrap>
                    {r.player_name}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right', minWidth: 50 }}>
                  <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700 }}>
                    {r.votes}
                  </Typography>
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={r.percentage}
                sx={{
                  ml: 4,
                  height: 4,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.15)',
                  },
                }}
              />
            </Box>
          ))}
        </Box>
      )}

      {/* Total footer */}
      <Box sx={{ textAlign: 'center', mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>
          Total: {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'}
        </Typography>
      </Box>
    </Box>
  );
}
