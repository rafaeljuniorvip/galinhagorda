'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Card, CardActionArea, Avatar, Chip, IconButton,
} from '@mui/material';
import { ChevronLeft, ChevronRight, FiberManualRecord } from '@mui/icons-material';
import Link from 'next/link';
import { Match } from '@/types';
import { formatDate } from '@/lib/utils';

interface Props {
  initialMatches: Match[];
}

export default function FeaturedMatches({ initialMatches }: Props) {
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-refresh every 60 seconds for live scores
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/public/featured-matches');
        if (res.ok) {
          const data = await res.json();
          setMatches(data);
        }
      } catch {
        // Silently fail, keep showing current data
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  if (matches.length === 0) return null;

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Navigation arrows */}
      {matches.length > 3 && (
        <>
          <IconButton
            onClick={() => scroll('left')}
            sx={{
              position: 'absolute',
              left: -16,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 2,
              bgcolor: 'white',
              boxShadow: 2,
              display: { xs: 'none', md: 'flex' },
              '&:hover': { bgcolor: '#f5f5f5' },
            }}
          >
            <ChevronLeft />
          </IconButton>
          <IconButton
            onClick={() => scroll('right')}
            sx={{
              position: 'absolute',
              right: -16,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 2,
              bgcolor: 'white',
              boxShadow: 2,
              display: { xs: 'none', md: 'flex' },
              '&:hover': { bgcolor: '#f5f5f5' },
            }}
          >
            <ChevronRight />
          </IconButton>
        </>
      )}

      {/* Scrollable strip */}
      <Box
        ref={scrollRef}
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          pb: 1,
          scrollSnapType: 'x mandatory',
          '&::-webkit-scrollbar': { height: 6 },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'rgba(0,0,0,0.2)',
            borderRadius: 3,
          },
        }}
      >
        {matches.map((match) => {
          const isLive = match.status === 'Em Andamento';
          const isFinished = match.status === 'Finalizada';

          return (
            <Card
              key={match.id}
              sx={{
                minWidth: 300,
                maxWidth: 300,
                flexShrink: 0,
                scrollSnapAlign: 'start',
                border: isLive ? '2px solid #d32f2f' : '1px solid #e0e0e0',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
              }}
            >
              <CardActionArea
                component={Link}
                href={`/campeonatos/${match.championship_id}`}
                sx={{ p: 2 }}
              >
                {/* Status */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 180 }}>
                    {match.championship_name}
                  </Typography>
                  {isLive && (
                    <Chip
                      icon={<FiberManualRecord sx={{ fontSize: '10px !important', animation: 'pulse 1.5s infinite' }} />}
                      label="AO VIVO"
                      size="small"
                      sx={{
                        bgcolor: '#d32f2f',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        height: 22,
                        '@keyframes pulse': {
                          '0%, 100%': { opacity: 1 },
                          '50%': { opacity: 0.3 },
                        },
                      }}
                    />
                  )}
                  {!isLive && (
                    <Chip
                      label={match.status}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.65rem', height: 22 }}
                    />
                  )}
                </Box>

                {/* Teams & Score */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  {/* Home team */}
                  <Box sx={{ flex: 1, textAlign: 'center' }}>
                    <Avatar
                      src={match.home_team_logo || ''}
                      sx={{ width: 48, height: 48, mx: 'auto', mb: 0.5 }}
                    >
                      {match.home_team_short?.[0] || match.home_team_name?.[0]}
                    </Avatar>
                    <Typography variant="caption" fontWeight={600} noWrap display="block">
                      {match.home_team_short || match.home_team_name}
                    </Typography>
                  </Box>

                  {/* Score */}
                  <Box sx={{ textAlign: 'center', px: 1 }}>
                    {isFinished || isLive ? (
                      <Typography
                        variant="h5"
                        fontWeight={800}
                        sx={{ color: isLive ? '#d32f2f' : '#1a237e' }}
                      >
                        {match.home_score ?? 0} x {match.away_score ?? 0}
                      </Typography>
                    ) : (
                      <Typography variant="body2" fontWeight={600} color="text.secondary">
                        VS
                      </Typography>
                    )}
                  </Box>

                  {/* Away team */}
                  <Box sx={{ flex: 1, textAlign: 'center' }}>
                    <Avatar
                      src={match.away_team_logo || ''}
                      sx={{ width: 48, height: 48, mx: 'auto', mb: 0.5 }}
                    >
                      {match.away_team_short?.[0] || match.away_team_name?.[0]}
                    </Avatar>
                    <Typography variant="caption" fontWeight={600} noWrap display="block">
                      {match.away_team_short || match.away_team_name}
                    </Typography>
                  </Box>
                </Box>

                {/* Date & Round */}
                <Box sx={{ mt: 1.5, textAlign: 'center' }}>
                  {match.match_round && (
                    <Typography variant="caption" color="text.secondary">
                      {match.match_round}
                    </Typography>
                  )}
                  {match.match_date && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {formatDate(match.match_date)}
                      {match.venue ? ` | ${match.venue}` : ''}
                    </Typography>
                  )}
                </Box>
              </CardActionArea>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}
