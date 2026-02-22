'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Box, TextField, Button, Grid, MenuItem, Alert, Typography, Card, CardContent } from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { Match, Championship, Team } from '@/types';
import { MATCH_STATUS } from '@/lib/utils';

interface Props { match?: Match; }

export default function MatchForm({ match }: Props) {
  const router = useRouter();
  const isEditing = !!match;
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const [form, setForm] = useState({
    championship_id: match?.championship_id || '',
    home_team_id: match?.home_team_id || '',
    away_team_id: match?.away_team_id || '',
    home_score: match?.home_score?.toString() ?? '',
    away_score: match?.away_score?.toString() ?? '',
    match_date: match?.match_date ? new Date(match.match_date).toISOString().slice(0, 16) : '',
    match_round: match?.match_round || '',
    venue: match?.venue || '',
    referee: match?.referee || '',
    status: match?.status || 'Agendada',
    observations: match?.observations || '',
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/championships?all=true').then(r => r.json()),
      fetch('/api/teams?all=true').then(r => r.json()),
    ]).then(([c, t]) => { setChampionships(c); setTeams(t); });
  }, []);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = {
        ...form,
        home_score: form.home_score !== '' ? parseInt(form.home_score) : null,
        away_score: form.away_score !== '' ? parseInt(form.away_score) : null,
        match_date: form.match_date || null,
        match_round: form.match_round || null,
        venue: form.venue || null,
        referee: form.referee || null,
        observations: form.observations || null,
      };
      const url = isEditing ? `/api/matches/${match.id}` : '/api/matches';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { router.push('/admin/partidas'); }
      else { const d = await res.json(); setError(d.error || 'Erro ao salvar'); }
    } catch { setError('Erro ao salvar partida'); }
    finally { setSaving(false); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button component={Link} href="/admin/partidas" startIcon={<ArrowBack />} color="inherit">Voltar</Button>
        <Typography variant="h4" fontWeight={700}>{isEditing ? 'Editar Partida' : 'Nova Partida'}</Typography>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField select label="Campeonato" required fullWidth value={form.championship_id} onChange={handleChange('championship_id')}>
                  {championships.map(c => <MenuItem key={c.id} value={c.id}>{c.name} ({c.year})</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField label="Rodada" fullWidth value={form.match_round} onChange={handleChange('match_round')} placeholder="Ex: Rodada 1" />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField select label="Status" fullWidth value={form.status} onChange={handleChange('status')}>
                  {MATCH_STATUS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={5}>
                <TextField select label="Time Mandante" required fullWidth value={form.home_team_id} onChange={handleChange('home_team_id')}>
                  {teams.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6} md={1}><TextField label="Gols" type="number" fullWidth value={form.home_score} onChange={handleChange('home_score')} /></Grid>
              <Grid item xs={6} md={1}><TextField label="Gols" type="number" fullWidth value={form.away_score} onChange={handleChange('away_score')} /></Grid>
              <Grid item xs={12} md={5}>
                <TextField select label="Time Visitante" required fullWidth value={form.away_team_id} onChange={handleChange('away_team_id')}>
                  {teams.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}><TextField label="Data e Hora" type="datetime-local" fullWidth InputLabelProps={{ shrink: true }} value={form.match_date} onChange={handleChange('match_date')} /></Grid>
              <Grid item xs={12} md={4}><TextField label="Local" fullWidth value={form.venue} onChange={handleChange('venue')} /></Grid>
              <Grid item xs={12} md={4}><TextField label="Arbitro" fullWidth value={form.referee} onChange={handleChange('referee')} /></Grid>
              <Grid item xs={12}><TextField label="Observacoes" multiline rows={2} fullWidth value={form.observations} onChange={handleChange('observations')} /></Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button component={Link} href="/admin/partidas" color="inherit">Cancelar</Button>
                  <Button type="submit" variant="contained" startIcon={<Save />} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
