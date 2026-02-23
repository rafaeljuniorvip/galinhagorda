'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box, Typography, Button, Card, CardContent, Grid, MenuItem, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Chip, Alert, Switch, FormControlLabel,
} from '@mui/material';
import { ArrowBack, Add, Delete, LiveTv } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { StreamingLink, Match } from '@/types';

const PLATFORMS = ['YouTube', 'Facebook', 'Instagram', 'TikTok', 'Outro'];

export default function TransmissoesPartidaPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [match, setMatch] = useState<Match | null>(null);
  const [links, setLinks] = useState<StreamingLink[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    platform: '',
    url: '',
    label: '',
    is_live: false,
  });

  const [matchUrls, setMatchUrls] = useState({
    streaming_url: '',
    highlights_url: '',
  });

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push('/admin/login');
  }, [isAdmin, authLoading, router]);

  const loadData = useCallback(async () => {
    const [matchRes, linksRes] = await Promise.all([
      fetch(`/api/matches/${params.id}`),
      fetch(`/api/matches/${params.id}/streaming`),
    ]);
    if (matchRes.ok) {
      const m = await matchRes.json();
      setMatch(m);
      setMatchUrls({
        streaming_url: m.streaming_url || '',
        highlights_url: m.highlights_url || '',
      });
    }
    if (linksRes.ok) setLinks(await linksRes.json());
  }, [params.id]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const handleAddLink = async () => {
    setError('');
    setSuccess('');
    if (!form.platform || !form.url) {
      setError('Plataforma e URL sao obrigatorios');
      return;
    }
    const res = await fetch(`/api/matches/${params.id}/streaming`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setSuccess('Link adicionado!');
      setForm({ platform: '', url: '', label: '', is_live: false });
      loadData();
    } else {
      const d = await res.json();
      setError(d.error || 'Erro ao adicionar link');
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    await fetch(`/api/matches/${params.id}/streaming?link_id=${linkId}`, { method: 'DELETE' });
    loadData();
  };

  const handleToggleLive = async (linkId: string, currentStatus: boolean) => {
    await fetch(`/api/matches/${params.id}/streaming`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toggle_live: true, link_id: linkId, is_live: !currentStatus }),
    });
    // Update locally
    setLinks(prev => prev.map(l => l.id === linkId ? { ...l, is_live: !currentStatus } : l));
  };

  const handleSaveMatchUrls = async () => {
    setError('');
    setSuccess('');
    const res = await fetch(`/api/matches/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...match,
        streaming_url: matchUrls.streaming_url || null,
        highlights_url: matchUrls.highlights_url || null,
      }),
    });
    if (res.ok) {
      setSuccess('URLs da partida atualizadas!');
      loadData();
    } else {
      setError('Erro ao salvar URLs');
    }
  };

  if (authLoading || !isAdmin || !match) return null;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button component={Link} href="/admin/partidas" startIcon={<ArrowBack />} color="inherit">Voltar</Button>
        <Box>
          <Typography variant="h4" fontWeight={700}>Transmissoes</Typography>
          <Typography variant="body2" color="text.secondary">
            {match.home_team_name} {match.home_score ?? '-'} x {match.away_score ?? '-'} {match.away_team_name}
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>URLs Principais da Partida</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                label="URL de Transmissao Principal"
                fullWidth
                size="small"
                value={matchUrls.streaming_url}
                onChange={(e) => setMatchUrls(prev => ({ ...prev, streaming_url: e.target.value }))}
                placeholder="https://youtube.com/..."
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <TextField
                label="URL de Melhores Momentos"
                fullWidth
                size="small"
                value={matchUrls.highlights_url}
                onChange={(e) => setMatchUrls(prev => ({ ...prev, highlights_url: e.target.value }))}
                placeholder="https://youtube.com/..."
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button variant="contained" onClick={handleSaveMatchUrls} fullWidth>Salvar URLs</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Adicionar Link de Transmissao</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={2}>
              <TextField
                select
                label="Plataforma"
                fullWidth
                size="small"
                value={form.platform}
                onChange={(e) => setForm(prev => ({ ...prev, platform: e.target.value }))}
              >
                {PLATFORMS.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="URL"
                fullWidth
                size="small"
                value={form.url}
                onChange={(e) => setForm(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://..."
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Label"
                fullWidth
                size="small"
                value={form.label}
                onChange={(e) => setForm(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Ex: Transmissao oficial"
              />
            </Grid>
            <Grid item xs={6} md={1}>
              <FormControlLabel
                control={<Switch checked={form.is_live} onChange={(e) => setForm(prev => ({ ...prev, is_live: e.target.checked }))} />}
                label="Ao Vivo"
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <Button variant="contained" startIcon={<Add />} onClick={handleAddLink} fullWidth>Adicionar</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Plataforma</TableCell>
              <TableCell>URL</TableCell>
              <TableCell>Label</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Acoes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {links.map((link) => (
              <TableRow key={link.id} hover>
                <TableCell>{link.platform}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {link.url}
                  </Typography>
                </TableCell>
                <TableCell>{link.label || '-'}</TableCell>
                <TableCell>
                  <Chip
                    icon={<LiveTv />}
                    label={link.is_live ? 'Ao Vivo' : 'Offline'}
                    size="small"
                    color={link.is_live ? 'error' : 'default'}
                    onClick={() => handleToggleLive(link.id, link.is_live)}
                    sx={{ cursor: 'pointer' }}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="error" onClick={() => handleDeleteLink(link.id)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {links.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">Nenhum link de transmissao cadastrado</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
