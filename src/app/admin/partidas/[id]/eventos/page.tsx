'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box, Typography, Button, Card, CardContent, Grid, MenuItem, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Chip, Alert,
} from '@mui/material';
import { ArrowBack, Add, Delete } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { EVENT_TYPES } from '@/lib/utils';

export default function EventosPartidaPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [match, setMatch] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    player_id: '', team_id: '', event_type: '', minute: '', half: '1T',
  });

  useEffect(() => { if (!authLoading && !isAdmin) router.push('/admin/login'); }, [isAdmin, authLoading, router]);

  const loadData = useCallback(async () => {
    const [matchRes, eventsRes] = await Promise.all([
      fetch(`/api/matches/${params.id}`),
      fetch(`/api/matches/${params.id}/events`),
    ]);
    if (matchRes.ok) {
      const m = await matchRes.json();
      setMatch(m);
      // Load players registered for this championship in both teams
      const regsRes = await fetch(`/api/championships/${m.championship_id}/registrations`);
      if (regsRes.ok) {
        const regs = await regsRes.json();
        const teamPlayers = regs.filter((r: any) =>
          r.team_id === m.home_team_id || r.team_id === m.away_team_id
        );
        setPlayers(teamPlayers);
      }
    }
    if (eventsRes.ok) setEvents(await eventsRes.json());
  }, [params.id]);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  const handleAdd = async () => {
    setError(''); setSuccess('');
    if (!form.player_id || !form.event_type) {
      setError('Jogador e tipo de evento sao obrigatorios');
      return;
    }
    const playerReg = players.find(p => p.player_id === form.player_id);
    const res = await fetch(`/api/matches/${params.id}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: form.player_id,
        team_id: playerReg?.team_id || form.team_id,
        event_type: form.event_type,
        minute: form.minute ? parseInt(form.minute) : null,
        half: form.half || null,
      }),
    });
    if (res.ok) {
      setSuccess('Evento adicionado!');
      setForm({ player_id: '', team_id: '', event_type: '', minute: '', half: '1T' });
      loadData();
    } else { const d = await res.json(); setError(d.error); }
  };

  const handleDelete = async (eventId: string) => {
    await fetch(`/api/matches/${params.id}/events?event_id=${eventId}`, { method: 'DELETE' });
    loadData();
  };

  const eventLabel = (type: string) => {
    const found = EVENT_TYPES.find(e => e.value === type);
    return found?.label || type;
  };

  const eventColor = (type: string) => {
    if (type.includes('GOL')) return 'success';
    if (type.includes('AMARELO')) return 'warning';
    if (type.includes('VERMELHO')) return 'error';
    return 'default';
  };

  if (authLoading || !isAdmin || !match) return null;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button component={Link} href="/admin/partidas" startIcon={<ArrowBack />} color="inherit">Voltar</Button>
        <Box>
          <Typography variant="h4" fontWeight={700}>Eventos da Partida</Typography>
          <Typography variant="body2" color="text.secondary">
            {match.home_team_name} {match.home_score ?? '-'} x {match.away_score ?? '-'} {match.away_team_name}
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Adicionar Evento</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField select label="Jogador" fullWidth size="small" value={form.player_id} onChange={(e) => setForm(prev => ({ ...prev, player_id: e.target.value }))}>
                {players.map((p: any) => (
                  <MenuItem key={p.player_id} value={p.player_id}>
                    {p.player_name} ({p.team_name === match.home_team_name ? 'CASA' : 'VISIT'})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField select label="Tipo" fullWidth size="small" value={form.event_type} onChange={(e) => setForm(prev => ({ ...prev, event_type: e.target.value }))}>
                {EVENT_TYPES.map(e => <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={3} md={2}>
              <TextField label="Minuto" type="number" fullWidth size="small" value={form.minute} onChange={(e) => setForm(prev => ({ ...prev, minute: e.target.value }))} />
            </Grid>
            <Grid item xs={3} md={2}>
              <TextField select label="Tempo" fullWidth size="small" value={form.half} onChange={(e) => setForm(prev => ({ ...prev, half: e.target.value }))}>
                <MenuItem value="1T">1 Tempo</MenuItem>
                <MenuItem value="2T">2 Tempo</MenuItem>
                <MenuItem value="PRO">Prorrogacao</MenuItem>
                <MenuItem value="PEN">Penaltis</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button variant="contained" startIcon={<Add />} onClick={handleAdd} fullWidth>Adicionar</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tempo</TableCell>
              <TableCell>Min</TableCell>
              <TableCell>Jogador</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Evento</TableCell>
              <TableCell align="right">Acao</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{e.half || '-'}</TableCell>
                <TableCell>{e.minute ?? '-'}</TableCell>
                <TableCell>{e.player_name}</TableCell>
                <TableCell>{e.team_name}</TableCell>
                <TableCell><Chip label={eventLabel(e.event_type)} size="small" color={eventColor(e.event_type) as any} /></TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="error" onClick={() => handleDelete(e.id)}><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {events.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                <Typography color="text.secondary">Nenhum evento registrado</Typography>
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
