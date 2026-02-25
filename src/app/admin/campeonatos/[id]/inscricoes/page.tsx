'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box, Typography, Button, Card, CardContent, Grid, MenuItem, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Avatar, Chip, Alert, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { ArrowBack, PersonAdd, Delete, GroupAdd, SwapHoriz } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

export default function InscricoesPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [championship, setChampionship] = useState<any>(null);
  const [enrolledTeams, setEnrolledTeams] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog states
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [playerDialogOpen, setPlayerDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [selectedPlayerTeam, setSelectedPlayerTeam] = useState('');
  const [shirtNumber, setShirtNumber] = useState('');

  // Swap team dialog
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [swapRegistration, setSwapRegistration] = useState<any>(null);
  const [swapNewTeam, setSwapNewTeam] = useState('');

  useEffect(() => { if (!authLoading && !isAdmin) router.push('/admin/login'); }, [isAdmin, authLoading, router]);

  const loadData = useCallback(async () => {
    const [champRes, teamsRes, regsRes, allTeamsRes, allPlayersRes] = await Promise.all([
      fetch(`/api/championships/${params.id}`),
      fetch(`/api/championships/${params.id}/registrations?type=teams`),
      fetch(`/api/championships/${params.id}/registrations`),
      fetch('/api/teams?all=true'),
      fetch('/api/players?limit=500'),
    ]);
    if (champRes.ok) setChampionship(await champRes.json());
    if (teamsRes.ok) setEnrolledTeams(await teamsRes.json());
    if (regsRes.ok) setRegistrations(await regsRes.json());
    if (allTeamsRes.ok) setAllTeams(await allTeamsRes.json());
    if (allPlayersRes.ok) { const d = await allPlayersRes.json(); setAllPlayers(d.data || []); }
  }, [params.id]);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  const enrollTeam = async () => {
    setError(''); setSuccess('');
    const res = await fetch(`/api/championships/${params.id}/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'team', team_id: selectedTeam }),
    });
    if (res.ok) { setSuccess('Time inscrito!'); setTeamDialogOpen(false); setSelectedTeam(''); loadData(); }
    else { const d = await res.json(); setError(d.error); }
  };

  const registerPlayer = async () => {
    setError(''); setSuccess('');
    const res = await fetch(`/api/championships/${params.id}/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: selectedPlayer, team_id: selectedPlayerTeam, shirt_number: shirtNumber ? parseInt(shirtNumber) : null }),
    });
    if (res.ok) { setSuccess('Jogador inscrito (BID gerado)!'); setPlayerDialogOpen(false); setSelectedPlayer(''); setSelectedPlayerTeam(''); setShirtNumber(''); loadData(); }
    else { const d = await res.json(); setError(d.error); }
  };

  const removeTeamEnrollment = async (teamId: string, name: string) => {
    if (!confirm(`Remover time "${name}" do campeonato?`)) return;
    await fetch(`/api/championships/${params.id}/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'remove_team', team_id: teamId }),
    });
    loadData();
  };

  const removePlayerRegistration = async (registrationId: string, playerName: string) => {
    if (!confirm(`Remover inscrição de "${playerName}"?`)) return;
    setError(''); setSuccess('');
    const res = await fetch(`/api/championships/${params.id}/registrations`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registration_id: registrationId }),
    });
    if (res.ok) { setSuccess('Inscrição removida!'); loadData(); }
    else { const d = await res.json(); setError(d.error); }
  };

  const openSwapDialog = (registration: any) => {
    setSwapRegistration(registration);
    setSwapNewTeam('');
    setSwapDialogOpen(true);
  };

  const swapTeam = async () => {
    if (!swapRegistration || !swapNewTeam) return;
    setError(''); setSuccess('');
    const res = await fetch(`/api/championships/${params.id}/registrations`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registration_id: swapRegistration.id, team_id: swapNewTeam }),
    });
    if (res.ok) { setSuccess('Time do jogador atualizado!'); setSwapDialogOpen(false); setSwapRegistration(null); loadData(); }
    else { const d = await res.json(); setError(d.error); }
  };

  if (authLoading || !isAdmin || !championship) return null;

  // Group registrations by team
  const regsByTeam: Record<string, any[]> = {};
  registrations.forEach(r => {
    if (!regsByTeam[r.team_name]) regsByTeam[r.team_name] = [];
    regsByTeam[r.team_name].push(r);
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button component={Link} href="/admin/campeonatos" startIcon={<ArrowBack />} color="inherit">Voltar</Button>
        <Box>
          <Typography variant="h4" fontWeight={700}>Inscricoes - BID</Typography>
          <Typography variant="body2" color="text.secondary">{championship.name} ({championship.year})</Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button variant="contained" startIcon={<GroupAdd />} onClick={() => setTeamDialogOpen(true)}>Inscrever Time</Button>
        <Button variant="outlined" startIcon={<PersonAdd />} onClick={() => setPlayerDialogOpen(true)} disabled={enrolledTeams.length === 0}>Inscrever Jogador</Button>
      </Box>

      <Typography variant="h6" gutterBottom>Times Inscritos ({enrolledTeams.length})</Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {enrolledTeams.map((t: any) => (
          <Grid item xs={6} md={3} key={t.team_id}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
                <Avatar src={t.team_logo || ''} sx={{ width: 32, height: 32 }}>{t.team_name?.[0]}</Avatar>
                <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>{t.team_name}</Typography>
                <IconButton size="small" color="error" onClick={() => removeTeamEnrollment(t.team_id, t.team_name)}><Delete fontSize="small" /></IconButton>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {enrolledTeams.length === 0 && <Grid item xs={12}><Typography color="text.secondary">Nenhum time inscrito</Typography></Grid>}
      </Grid>

      <Divider sx={{ mb: 3 }} />

      <Typography variant="h6" gutterBottom>Jogadores Inscritos ({registrations.length})</Typography>
      {Object.entries(regsByTeam).map(([teamName, regs]) => (
        <Box key={teamName} sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, color: 'primary.main' }}>{teamName}</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Jogador</TableCell>
                  <TableCell>Posicao</TableCell>
                  <TableCell>N Camisa</TableCell>
                  <TableCell>N BID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {regs.map((r: any) => (
                  <TableRow key={r.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar src={r.player_photo || ''} sx={{ width: 28, height: 28 }}>{r.player_name?.[0]}</Avatar>
                        <Typography variant="body2">{r.player_name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{r.player_position}</TableCell>
                    <TableCell>{r.shirt_number || '-'}</TableCell>
                    <TableCell><Chip label={r.bid_number} size="small" variant="outlined" /></TableCell>
                    <TableCell><Chip label={r.status} size="small" color={r.status === 'Ativo' ? 'success' : 'default'} /></TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="primary" title="Trocar time" onClick={() => openSwapDialog(r)}><SwapHoriz fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" title="Remover inscrição" onClick={() => removePlayerRegistration(r.id, r.player_name)}><Delete fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}

      {/* Dialog: Inscrever Time */}
      <Dialog open={teamDialogOpen} onClose={() => setTeamDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Inscrever Time</DialogTitle>
        <DialogContent>
          <TextField select label="Selecione o Time" fullWidth value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} sx={{ mt: 1 }}>
            {allTeams.filter(t => !enrolledTeams.find(et => et.team_id === t.id)).map(t => (
              <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTeamDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={enrollTeam} disabled={!selectedTeam}>Inscrever</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Inscrever Jogador */}
      <Dialog open={playerDialogOpen} onClose={() => setPlayerDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Inscrever Jogador (BID)</DialogTitle>
        <DialogContent>
          <TextField select label="Time" fullWidth value={selectedPlayerTeam} onChange={(e) => setSelectedPlayerTeam(e.target.value)} sx={{ mt: 1, mb: 2 }}>
            {enrolledTeams.map(t => <MenuItem key={t.team_id} value={t.team_id}>{t.team_name}</MenuItem>)}
          </TextField>
          <TextField select label="Jogador" fullWidth value={selectedPlayer} onChange={(e) => setSelectedPlayer(e.target.value)} sx={{ mb: 2 }}>
            {allPlayers.filter(p => !registrations.find(r => r.player_id === p.id)).map(p => (
              <MenuItem key={p.id} value={p.id}>{p.name} - {p.position}</MenuItem>
            ))}
          </TextField>
          <TextField label="Numero da Camisa" type="number" fullWidth value={shirtNumber} onChange={(e) => setShirtNumber(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPlayerDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={registerPlayer} disabled={!selectedPlayer || !selectedPlayerTeam}>Inscrever</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Trocar Time */}
      <Dialog open={swapDialogOpen} onClose={() => setSwapDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Trocar Time do Jogador</DialogTitle>
        <DialogContent>
          {swapRegistration && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Jogador: <strong>{swapRegistration.player_name}</strong> (atual: {swapRegistration.team_name})
            </Typography>
          )}
          <TextField select label="Novo Time" fullWidth value={swapNewTeam} onChange={(e) => setSwapNewTeam(e.target.value)} sx={{ mt: 1 }}>
            {enrolledTeams.filter(t => t.team_id !== swapRegistration?.team_id).map(t => (
              <MenuItem key={t.team_id} value={t.team_id}>{t.team_name}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSwapDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={swapTeam} disabled={!swapNewTeam}>Trocar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
