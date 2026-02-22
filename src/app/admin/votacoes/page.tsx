'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, Grid, MenuItem, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, Chip, Alert, Avatar, LinearProgress, Switch, FormControlLabel,
} from '@mui/material';
import { HowToVote, EmojiEvents } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { Match, Championship, VoteResult } from '@/types';
import { formatDateTime } from '@/lib/utils';

interface MatchWithVoting extends Match {
  votingStatus?: {
    isOpen: boolean;
    deadline: string | null;
    totalVotes: number;
    winner: VoteResult | null;
  };
}

export default function AdminVotacoesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<MatchWithVoting[]>([]);
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [championshipFilter, setChampionshipFilter] = useState('');
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [voteResults, setVoteResults] = useState<VoteResult[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/admin/login');
  }, [user, loading, router]);

  useEffect(() => {
    fetch('/api/championships?all=true')
      .then(r => r.json())
      .then(setChampionships)
      .catch(() => {});
  }, []);

  const loadMatches = useCallback(async () => {
    const params = new URLSearchParams({ page: '1', limit: '50' });
    if (championshipFilter) params.set('championship_id', championshipFilter);
    const res = await fetch(`/api/matches?${params}`);
    if (!res.ok) return;
    const data = await res.json();

    // Load voting status for each match
    const matchesWithVoting: MatchWithVoting[] = [];
    for (const match of data.data) {
      try {
        const vRes = await fetch(`/api/votes?matchId=${match.id}`);
        if (vRes.ok) {
          const vData = await vRes.json();
          matchesWithVoting.push({ ...match, votingStatus: vData.status });
        } else {
          matchesWithVoting.push(match);
        }
      } catch {
        matchesWithVoting.push(match);
      }
    }
    setMatches(matchesWithVoting);
  }, [championshipFilter]);

  useEffect(() => {
    if (user) loadMatches();
  }, [user, loadMatches]);

  const loadVoteResults = async (matchId: string) => {
    setSelectedMatch(matchId);
    const res = await fetch(`/api/votes?matchId=${matchId}`);
    if (res.ok) {
      const data = await res.json();
      setVoteResults(data.results || []);
    }
  };

  const handleToggleVoting = async (matchId: string, currentOpen: boolean) => {
    setError('');
    setSuccess('');

    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const body: any = {
      ...match,
      voting_open: !currentOpen,
    };

    if (!currentOpen && deadline) {
      body.voting_deadline = deadline;
    }

    const res = await fetch(`/api/matches/${matchId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setSuccess(!currentOpen ? 'Votacao aberta!' : 'Votacao encerrada!');
      loadMatches();
    } else {
      setError('Erro ao alterar votacao');
    }
  };

  const handleSetDeadline = async (matchId: string) => {
    setError('');
    setSuccess('');

    if (!deadline) {
      setError('Defina um prazo');
      return;
    }

    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const res = await fetch(`/api/matches/${matchId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...match,
        voting_deadline: deadline,
      }),
    });

    if (res.ok) {
      setSuccess('Prazo definido!');
      loadMatches();
    } else {
      setError('Erro ao definir prazo');
    }
  };

  if (loading || !user) return null;

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>Votacoes</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          select
          label="Campeonato"
          size="small"
          value={championshipFilter}
          onChange={(e) => setChampionshipFilter(e.target.value)}
          sx={{ width: { xs: '100%', md: 300 } }}
        >
          <MenuItem value="">Todos</MenuItem>
          {championships.map(c => <MenuItem key={c.id} value={c.id}>{c.name} ({c.year})</MenuItem>)}
        </TextField>
        <TextField
          label="Prazo para votacao"
          type="datetime-local"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          sx={{ width: { xs: '100%', md: 250 } }}
        />
      </Box>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Partida</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Votos</TableCell>
              <TableCell>Vencedor</TableCell>
              <TableCell>Prazo</TableCell>
              <TableCell align="right">Acoes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {matches.map((match) => {
              const vs = match.votingStatus;
              return (
                <TableRow key={match.id} hover selected={selectedMatch === match.id}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => loadVoteResults(match.id)}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar src={match.home_team_logo || ''} sx={{ width: 24, height: 24 }}>
                        {match.home_team_short?.[0]}
                      </Avatar>
                      <Typography variant="body2" fontWeight={600}>
                        {match.home_team_short || match.home_team_name} x {match.away_team_short || match.away_team_name}
                      </Typography>
                      <Avatar src={match.away_team_logo || ''} sx={{ width: 24, height: 24 }}>
                        {match.away_team_short?.[0]}
                      </Avatar>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={<HowToVote />}
                      label={vs?.isOpen ? 'Aberta' : 'Fechada'}
                      size="small"
                      color={vs?.isOpen ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{vs?.totalVotes || 0}</TableCell>
                  <TableCell>
                    {vs?.winner ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar src={vs.winner.player_photo || ''} sx={{ width: 24, height: 24 }}>
                          {vs.winner.player_name[0]}
                        </Avatar>
                        <Typography variant="body2">{vs.winner.player_name}</Typography>
                      </Box>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {vs?.deadline ? formatDateTime(vs.deadline) : '-'}
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        variant={vs?.isOpen ? 'outlined' : 'contained'}
                        color={vs?.isOpen ? 'error' : 'success'}
                        onClick={() => handleToggleVoting(match.id, vs?.isOpen || false)}
                      >
                        {vs?.isOpen ? 'Fechar' : 'Abrir'}
                      </Button>
                      {deadline && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleSetDeadline(match.id)}
                        >
                          Definir Prazo
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
            {matches.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">Nenhuma partida encontrada</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedMatch && voteResults.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Resultados da Votacao
            </Typography>
            {voteResults.map((result, index) => (
              <Box key={result.player_id} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                  {index === 0 && <EmojiEvents sx={{ color: '#ffc107' }} />}
                  <Avatar src={result.player_photo || ''} sx={{ width: 32, height: 32 }}>
                    {result.player_name[0]}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {result.player_name}
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        {result.team_name}
                      </Typography>
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={600}>
                    {result.votes} votos ({result.percentage}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={result.percentage}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      bgcolor: index === 0 ? '#ffc107' : '#1976d2',
                    },
                  }}
                />
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {selectedMatch && voteResults.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <HowToVote sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography color="text.secondary">Nenhum voto registrado para esta partida</Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
