'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress,
  Skeleton,
  Alert,
  Snackbar,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import TimerIcon from '@mui/icons-material/Timer';
import { VoteResult } from '@/types';

interface MatchPlayer {
  player_id: string;
  player_name: string;
  player_photo: string | null;
  team_id: string;
  team_name: string;
  team_logo: string | null;
  shirt_number: number | null;
  position: string;
}

interface VotingData {
  results: VoteResult[];
  status: {
    isOpen: boolean;
    deadline: string | null;
    totalVotes: number;
    winner: VoteResult | null;
  };
  userVotedFor: string | null;
  players: MatchPlayer[];
}

interface Props {
  matchId: string;
}

function CountdownTimer({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const end = new Date(deadline).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('Encerrado');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <TimerIcon sx={{ fontSize: 18, color: '#ffd600' }} />
      <Typography variant="body2" sx={{ color: '#ffd600', fontWeight: 600 }}>
        {timeLeft}
      </Typography>
    </Box>
  );
}

export default function MatchVoting({ matchId }: Props) {
  const [data, setData] = useState<VotingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [voterName, setVoterName] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/votes?matchId=${matchId}&include=players`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Error fetching voting data:', error);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleVoteClick = (playerId: string) => {
    setSelectedPlayer(playerId);
    setShowNameDialog(true);
  };

  const handleConfirmVote = async () => {
    if (!selectedPlayer) return;
    setVoting(true);
    setShowNameDialog(false);

    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          playerId: selectedPlayer,
          voterName: voterName || undefined,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        setSnackbar({ open: true, message: json.message, severity: 'success' });
        await fetchData();
      } else {
        setSnackbar({ open: true, message: json.error, severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Erro ao registrar voto', severity: 'error' });
    } finally {
      setVoting(false);
      setVoterName('');
      setSelectedPlayer(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{
        background: 'linear-gradient(135deg, #1a237e 0%, #0d1642 100%)',
        borderRadius: 3,
        p: 3,
      }}>
        <Skeleton variant="text" width={200} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={6} sm={4} md={3} key={i}>
              <Skeleton variant="rounded" height={140} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (!data) return null;

  const { status, results, userVotedFor, players } = data;

  // Group players by team
  const teamGroups: Record<string, MatchPlayer[]> = {};
  (players || []).forEach((p) => {
    if (!teamGroups[p.team_id]) teamGroups[p.team_id] = [];
    teamGroups[p.team_id].push(p);
  });

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
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,214,0,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {status.isOpen && status.deadline && (
            <CountdownTimer deadline={status.deadline} />
          )}
          <Chip
            label={status.isOpen ? 'Votacao Aberta' : 'Votacao Encerrada'}
            size="small"
            sx={{
              bgcolor: status.isOpen ? 'rgba(76,175,80,0.2)' : 'rgba(255,255,255,0.1)',
              color: status.isOpen ? '#66bb6a' : 'rgba(255,255,255,0.5)',
              fontWeight: 600,
              border: status.isOpen ? '1px solid rgba(76,175,80,0.3)' : '1px solid rgba(255,255,255,0.1)',
            }}
          />
        </Box>
      </Box>

      {status.totalVotes > 0 && (
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 2 }}>
          {status.totalVotes} {status.totalVotes === 1 ? 'voto' : 'votos'} registrados
        </Typography>
      )}

      {/* Voting Open State */}
      {status.isOpen && !userVotedFor && (
        <>
          {Object.entries(teamGroups).map(([teamId, teamPlayers]) => (
            <Box key={teamId} sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Avatar
                  src={teamPlayers[0]?.team_logo || ''}
                  sx={{ width: 24, height: 24 }}
                >
                  {teamPlayers[0]?.team_name?.[0]}
                </Avatar>
                <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                  {teamPlayers[0]?.team_name}
                </Typography>
              </Box>
              <Grid container spacing={1.5}>
                {teamPlayers.map((player) => (
                  <Grid item xs={6} sm={4} md={3} key={player.player_id}>
                    <Card
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'rgba(255,214,0,0.1)',
                          borderColor: 'rgba(255,214,0,0.3)',
                          transform: 'translateY(-2px)',
                        },
                      }}
                      onClick={() => handleVoteClick(player.player_id)}
                    >
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, textAlign: 'center' }}>
                        <Avatar
                          src={player.player_photo || ''}
                          sx={{
                            width: 48,
                            height: 48,
                            mx: 'auto',
                            mb: 1,
                            border: '2px solid rgba(255,214,0,0.3)',
                          }}
                        >
                          {player.player_name?.[0]}
                        </Avatar>
                        {player.shirt_number && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#ffd600',
                              fontWeight: 800,
                              fontSize: '0.65rem',
                            }}
                          >
                            #{player.shirt_number}
                          </Typography>
                        )}
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            lineHeight: 1.2,
                            mb: 0.5,
                          }}
                          noWrap
                        >
                          {player.player_name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}
                        >
                          {player.position}
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<HowToVoteIcon sx={{ fontSize: 14 }} />}
                          disabled={voting}
                          sx={{
                            mt: 1,
                            width: '100%',
                            fontSize: '0.65rem',
                            py: 0.3,
                            color: '#ffd600',
                            borderColor: 'rgba(255,214,0,0.4)',
                            '&:hover': {
                              borderColor: '#ffd600',
                              bgcolor: 'rgba(255,214,0,0.1)',
                            },
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVoteClick(player.player_id);
                          }}
                        >
                          Votar
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </>
      )}

      {/* User already voted */}
      {status.isOpen && userVotedFor && (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <CheckCircleIcon sx={{ fontSize: 48, color: '#66bb6a', mb: 1 }} />
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
            Voto registrado!
          </Typography>
          {(() => {
            const votedPlayer = (players || []).find((p) => p.player_id === userVotedFor);
            if (!votedPlayer) return null;
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                <Avatar src={votedPlayer.player_photo || ''} sx={{ width: 40, height: 40 }}>
                  {votedPlayer.player_name?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="body1" sx={{ color: '#fff', fontWeight: 600 }}>
                    {votedPlayer.player_name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    {votedPlayer.team_name}
                  </Typography>
                </Box>
              </Box>
            );
          })()}

          {/* Show partial results after voting */}
          {results.length > 0 && (
            <Box sx={{ mt: 3, textAlign: 'left' }}>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1.5, textAlign: 'center' }}>
                Resultados parciais
              </Typography>
              {results.slice(0, 5).map((r, idx) => (
                <Box key={r.player_id} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', width: 20, fontWeight: 700 }}>
                      {idx + 1}.
                    </Typography>
                    <Avatar src={r.player_photo || ''} sx={{ width: 24, height: 24 }}>
                      {r.player_name?.[0]}
                    </Avatar>
                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, flex: 1 }} noWrap>
                      {r.player_name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#ffd600', fontWeight: 700 }}>
                      {r.percentage}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={r.percentage}
                    sx={{
                      ml: 3.5,
                      height: 6,
                      borderRadius: 3,
                      bgcolor: 'rgba(255,255,255,0.05)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        bgcolor: idx === 0 ? '#ffd600' : '#1976d2',
                      },
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Voting Closed - Show Results */}
      {!status.isOpen && results.length > 0 && (
        <VotingResultsInline results={results} totalVotes={status.totalVotes} />
      )}

      {/* No votes */}
      {!status.isOpen && results.length === 0 && (
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', py: 3 }}>
          Nenhum voto registrado para esta partida
        </Typography>
      )}

      {/* Name dialog */}
      <Dialog
        open={showNameDialog}
        onClose={() => { setShowNameDialog(false); setSelectedPlayer(null); }}
        PaperProps={{
          sx: {
            bgcolor: '#1a237e',
            color: '#fff',
            borderRadius: 3,
            minWidth: 300,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Confirmar voto</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
            Insira seu nome para registrar o voto (opcional):
          </Typography>
          <TextField
            fullWidth
            placeholder="Seu nome"
            value={voterName}
            onChange={(e) => setVoterName(e.target.value)}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                '&:hover fieldset': { borderColor: 'rgba(255,214,0,0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#ffd600' },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => { setShowNameDialog(false); setSelectedPlayer(null); }}
            sx={{ color: 'rgba(255,255,255,0.5)' }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmVote}
            disabled={voting}
            sx={{
              bgcolor: '#ffd600',
              color: '#1a237e',
              fontWeight: 700,
              '&:hover': { bgcolor: '#ffca00' },
            }}
          >
            {voting ? 'Votando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function VotingResultsInline({ results, totalVotes }: { results: VoteResult[]; totalVotes: number }) {
  const top3 = results.slice(0, 3);
  const rest = results.slice(3);

  return (
    <Box>
      {/* Podium */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: { xs: 1, sm: 2 },
          mb: 3,
          pt: 2,
        }}
      >
        {/* 2nd Place */}
        {top3[1] && (
          <PodiumCard
            result={top3[1]}
            position={2}
            totalVotes={totalVotes}
          />
        )}
        {/* 1st Place */}
        {top3[0] && (
          <PodiumCard
            result={top3[0]}
            position={1}
            totalVotes={totalVotes}
          />
        )}
        {/* 3rd Place */}
        {top3[2] && (
          <PodiumCard
            result={top3[2]}
            position={3}
            totalVotes={totalVotes}
          />
        )}
      </Box>

      {/* Rest of results */}
      {rest.map((r, idx) => (
        <Box key={r.player_id} sx={{ mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', width: 24, fontWeight: 700, textAlign: 'center' }}>
              {idx + 4}
            </Typography>
            <Avatar src={r.player_photo || ''} sx={{ width: 28, height: 28 }}>
              {r.player_name?.[0]}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }} noWrap>
                {r.player_name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                {r.team_name}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700 }}>
                {r.votes}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                {r.percentage}%
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
                bgcolor: 'rgba(255,255,255,0.2)',
              },
            }}
          />
        </Box>
      ))}

      {/* Total */}
      <Box sx={{ textAlign: 'center', mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
          Total de votos: {totalVotes}
        </Typography>
      </Box>
    </Box>
  );
}

function PodiumCard({
  result,
  position,
  totalVotes,
}: {
  result: VoteResult;
  position: 1 | 2 | 3;
  totalVotes: number;
}) {
  const configs = {
    1: {
      color: '#ffd600',
      borderColor: 'rgba(255,214,0,0.4)',
      bgGradient: 'linear-gradient(180deg, rgba(255,214,0,0.15) 0%, rgba(255,214,0,0.05) 100%)',
      avatarSize: 64,
      height: 160,
      label: '1o',
    },
    2: {
      color: '#bdbdbd',
      borderColor: 'rgba(189,189,189,0.3)',
      bgGradient: 'linear-gradient(180deg, rgba(189,189,189,0.1) 0%, rgba(189,189,189,0.03) 100%)',
      avatarSize: 52,
      height: 130,
      label: '2o',
    },
    3: {
      color: '#a1887f',
      borderColor: 'rgba(161,136,127,0.3)',
      bgGradient: 'linear-gradient(180deg, rgba(161,136,127,0.1) 0%, rgba(161,136,127,0.03) 100%)',
      avatarSize: 48,
      height: 120,
      label: '3o',
    },
  };

  const config = configs[position];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: { xs: 100, sm: 120 },
        minHeight: config.height,
        background: config.bgGradient,
        border: `1px solid ${config.borderColor}`,
        borderRadius: 2,
        p: 1.5,
        pt: 2,
        position: 'relative',
      }}
    >
      {position === 1 && (
        <EmojiEventsIcon
          sx={{
            position: 'absolute',
            top: -12,
            color: '#ffd600',
            fontSize: 28,
            filter: 'drop-shadow(0 2px 4px rgba(255,214,0,0.4))',
          }}
        />
      )}
      <Typography
        variant="caption"
        sx={{
          color: config.color,
          fontWeight: 800,
          fontSize: position === 1 ? '0.85rem' : '0.7rem',
          mb: 0.5,
        }}
      >
        {config.label}
      </Typography>
      <Avatar
        src={result.player_photo || ''}
        sx={{
          width: config.avatarSize,
          height: config.avatarSize,
          mb: 1,
          border: `2px solid ${config.color}`,
        }}
      >
        {result.player_name?.[0]}
      </Avatar>
      <Typography
        variant="body2"
        sx={{
          color: '#fff',
          fontWeight: 700,
          textAlign: 'center',
          fontSize: '0.75rem',
          lineHeight: 1.2,
        }}
        noWrap
      >
        {result.player_name}
      </Typography>
      <Typography
        variant="caption"
        sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.6rem', mb: 0.5 }}
        noWrap
      >
        {result.team_name}
      </Typography>
      <Typography variant="body1" sx={{ color: config.color, fontWeight: 800, mt: 'auto' }}>
        {result.votes}
      </Typography>
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem' }}>
        {result.percentage}%
      </Typography>
    </Box>
  );
}
