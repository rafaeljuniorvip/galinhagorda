'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box, Typography, Button, Card, CardContent, Grid, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Checkbox, Alert, Avatar, Chip,
} from '@mui/material';
import { ArrowBack, Save, Delete } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { Match, MatchLineup } from '@/types';
import { POSITIONS } from '@/lib/utils';

interface PlayerReg {
  player_id: string;
  player_name: string;
  player_photo: string | null;
  team_id: string;
  team_name: string;
  shirt_number: number | null;
  position: string;
}

interface LineupEntry {
  player_id: string;
  player_name: string;
  player_photo: string | null;
  position: string;
  shirt_number: number | null;
  is_starter: boolean;
}

export default function EscalacaoPartidaPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [match, setMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<PlayerReg[]>([]);
  const [homeLineup, setHomeLineup] = useState<LineupEntry[]>([]);
  const [awayLineup, setAwayLineup] = useState<LineupEntry[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/admin/login');
  }, [user, authLoading, router]);

  const loadData = useCallback(async () => {
    const matchRes = await fetch(`/api/matches/${params.id}`);
    if (!matchRes.ok) return;
    const m = await matchRes.json();
    setMatch(m);

    const [regsRes, lineupsRes] = await Promise.all([
      fetch(`/api/championships/${m.championship_id}/registrations`),
      fetch(`/api/matches/${params.id}/lineups`),
    ]);

    if (regsRes.ok) {
      const regs = await regsRes.json();
      const filtered = regs.filter((r: any) =>
        r.team_id === m.home_team_id || r.team_id === m.away_team_id
      );
      setPlayers(filtered.map((r: any) => ({
        player_id: r.player_id,
        player_name: r.player_name,
        player_photo: r.player_photo || null,
        team_id: r.team_id,
        team_name: r.team_name,
        shirt_number: r.shirt_number,
        position: r.player_position || '',
      })));
    }

    if (lineupsRes.ok) {
      const lineups = await lineupsRes.json();
      const mapLineup = (arr: MatchLineup[]): LineupEntry[] =>
        arr.map(l => ({
          player_id: l.player_id,
          player_name: l.player_name || '',
          player_photo: l.player_photo || null,
          position: l.position || '',
          shirt_number: l.shirt_number,
          is_starter: l.is_starter,
        }));
      setHomeLineup(mapLineup(lineups.home || []));
      setAwayLineup(mapLineup(lineups.away || []));
    }
  }, [params.id]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const addPlayerToLineup = (player: PlayerReg, side: 'home' | 'away') => {
    const entry: LineupEntry = {
      player_id: player.player_id,
      player_name: player.player_name,
      player_photo: player.player_photo,
      position: player.position,
      shirt_number: player.shirt_number,
      is_starter: true,
    };

    if (side === 'home') {
      if (homeLineup.find(e => e.player_id === player.player_id)) return;
      setHomeLineup(prev => [...prev, entry]);
    } else {
      if (awayLineup.find(e => e.player_id === player.player_id)) return;
      setAwayLineup(prev => [...prev, entry]);
    }
  };

  const removeFromLineup = (playerId: string, side: 'home' | 'away') => {
    if (side === 'home') {
      setHomeLineup(prev => prev.filter(e => e.player_id !== playerId));
    } else {
      setAwayLineup(prev => prev.filter(e => e.player_id !== playerId));
    }
  };

  const updateLineupEntry = (playerId: string, side: 'home' | 'away', field: string, value: any) => {
    const updater = (prev: LineupEntry[]) =>
      prev.map(e => e.player_id === playerId ? { ...e, [field]: value } : e);
    if (side === 'home') setHomeLineup(updater);
    else setAwayLineup(updater);
  };

  const handleSave = async (side: 'home' | 'away') => {
    setError('');
    setSuccess('');
    setSaving(true);

    const teamId = side === 'home' ? match?.home_team_id : match?.away_team_id;
    const lineup = side === 'home' ? homeLineup : awayLineup;

    try {
      const res = await fetch(`/api/matches/${params.id}/lineups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: teamId,
          players: lineup.map(e => ({
            player_id: e.player_id,
            position: e.position || null,
            shirt_number: e.shirt_number,
            is_starter: e.is_starter,
          })),
        }),
      });

      if (res.ok) {
        setSuccess(`Escalacao ${side === 'home' ? 'mandante' : 'visitante'} salva!`);
      } else {
        const d = await res.json();
        setError(d.error || 'Erro ao salvar escalacao');
      }
    } catch {
      setError('Erro ao salvar escalacao');
    } finally {
      setSaving(false);
    }
  };

  const homePlayers = players.filter(p => p.team_id === match?.home_team_id);
  const awayPlayers = players.filter(p => p.team_id === match?.away_team_id);

  const renderTeamLineup = (
    teamName: string,
    teamPlayers: PlayerReg[],
    lineup: LineupEntry[],
    side: 'home' | 'away'
  ) => {
    const starterCount = lineup.filter(e => e.is_starter).length;
    const availablePlayers = teamPlayers.filter(p => !lineup.find(e => e.player_id === p.player_id));

    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>{teamName}</Typography>
              <Typography variant="caption" color="text.secondary">
                Titulares: {starterCount}/11 | Total: {lineup.length}
              </Typography>
            </Box>
            <Button variant="contained" size="small" startIcon={<Save />} onClick={() => handleSave(side)} disabled={saving}>
              Salvar
            </Button>
          </Box>

          {availablePlayers.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <TextField
                select
                label="Adicionar jogador"
                fullWidth
                size="small"
                value=""
                onChange={(e) => {
                  const player = teamPlayers.find(p => p.player_id === e.target.value);
                  if (player) addPlayerToLineup(player, side);
                }}
              >
                {availablePlayers.map(p => (
                  <MenuItem key={p.player_id} value={p.player_id}>
                    {p.shirt_number ? `${p.shirt_number} - ` : ''}{p.player_name} ({p.position})
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          )}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">Titular</TableCell>
                  <TableCell>Jogador</TableCell>
                  <TableCell>Posicao</TableCell>
                  <TableCell>Camisa</TableCell>
                  <TableCell align="right">Acao</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lineup.map((entry) => (
                  <TableRow key={entry.player_id}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={entry.is_starter}
                        onChange={(e) => updateLineupEntry(entry.player_id, side, 'is_starter', e.target.checked)}
                        disabled={!entry.is_starter && starterCount >= 11}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar src={entry.player_photo || ''} sx={{ width: 28, height: 28, fontSize: 12 }}>
                          {entry.player_name[0]}
                        </Avatar>
                        <Typography variant="body2">{entry.player_name}</Typography>
                        {entry.is_starter && <Chip label="Titular" size="small" color="primary" variant="outlined" />}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={entry.position}
                        onChange={(e) => updateLineupEntry(entry.player_id, side, 'position', e.target.value)}
                        sx={{ minWidth: 120 }}
                      >
                        <MenuItem value="">-</MenuItem>
                        {POSITIONS.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={entry.shirt_number ?? ''}
                        onChange={(e) => updateLineupEntry(entry.player_id, side, 'shirt_number', e.target.value ? parseInt(e.target.value) : null)}
                        sx={{ width: 70 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="error" onClick={() => removeFromLineup(entry.player_id, side)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {lineup.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">Nenhum jogador na escalacao</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  if (authLoading || !user || !match) return null;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button component={Link} href="/admin/partidas" startIcon={<ArrowBack />} color="inherit">Voltar</Button>
        <Box>
          <Typography variant="h4" fontWeight={700}>Escalacao</Typography>
          <Typography variant="body2" color="text.secondary">
            {match.home_team_name} {match.home_score ?? '-'} x {match.away_score ?? '-'} {match.away_team_name}
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {renderTeamLineup(match.home_team_name || 'Mandante', homePlayers, homeLineup, 'home')}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderTeamLineup(match.away_team_name || 'Visitante', awayPlayers, awayLineup, 'away')}
        </Grid>
      </Grid>
    </Box>
  );
}
