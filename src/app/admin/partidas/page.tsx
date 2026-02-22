'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, TablePagination, TextField, MenuItem, Avatar,
} from '@mui/material';
import { Add, Edit, Delete, ListAlt, LiveTv, Group } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { Match, PaginatedResponse, Championship } from '@/types';
import { formatDateTime } from '@/lib/utils';

export default function AdminPartidasPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Match> | null>(null);
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [championshipFilter, setChampionshipFilter] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => { if (!loading && !user) router.push('/admin/login'); }, [user, loading, router]);

  useEffect(() => {
    fetch('/api/championships?all=true').then(r => r.json()).then(setChampionships).catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page + 1), limit: '15' });
    if (championshipFilter) params.set('championship_id', championshipFilter);
    const res = await fetch(`/api/matches?${params}`);
    if (res.ok) setData(await res.json());
  }, [page, championshipFilter]);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir partida?')) return;
    await fetch(`/api/matches/${id}`, { method: 'DELETE' });
    loadData();
  };

  const statusColor = (s: string) => {
    if (s === 'Finalizada') return 'success';
    if (s === 'Em Andamento') return 'primary';
    if (s === 'Cancelada' || s === 'WO') return 'error';
    return 'default';
  };

  if (loading || !user) return null;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" fontWeight={700}>Partidas</Typography>
        <Button variant="contained" startIcon={<Add />} component={Link} href="/admin/partidas/novo">Nova Partida</Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField select label="Campeonato" size="small" value={championshipFilter}
          onChange={(e) => { setChampionshipFilter(e.target.value); setPage(0); }}
          sx={{ width: { xs: '100%', md: 300 } }}>
          <MenuItem value="">Todos</MenuItem>
          {championships.map(c => <MenuItem key={c.id} value={c.id}>{c.name} ({c.year})</MenuItem>)}
        </TextField>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Partida</TableCell>
              <TableCell>Placar</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Rodada</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Acoes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.data.map((m) => (
              <TableRow key={m.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={m.home_team_logo || ''} sx={{ width: 24, height: 24 }}>{m.home_team_short?.[0]}</Avatar>
                    <Typography variant="body2" fontWeight={600}>{m.home_team_short || m.home_team_name}</Typography>
                    <Typography variant="body2" color="text.secondary">x</Typography>
                    <Typography variant="body2" fontWeight={600}>{m.away_team_short || m.away_team_name}</Typography>
                    <Avatar src={m.away_team_logo || ''} sx={{ width: 24, height: 24 }}>{m.away_team_short?.[0]}</Avatar>
                  </Box>
                </TableCell>
                <TableCell>
                  {m.home_score !== null ? `${m.home_score} x ${m.away_score}` : '-'}
                </TableCell>
                <TableCell>{m.match_date ? formatDateTime(m.match_date) : '-'}</TableCell>
                <TableCell>{m.match_round || '-'}</TableCell>
                <TableCell><Chip label={m.status} size="small" color={statusColor(m.status) as any} /></TableCell>
                <TableCell align="right">
                  <IconButton component={Link} href={`/admin/partidas/${m.id}/eventos`} size="small" title="Eventos"><ListAlt fontSize="small" /></IconButton>
                  <IconButton component={Link} href={`/admin/partidas/${m.id}/escalacao`} size="small" title="Escalacao"><Group fontSize="small" /></IconButton>
                  <IconButton component={Link} href={`/admin/partidas/${m.id}/transmissoes`} size="small" title="Transmissoes"><LiveTv fontSize="small" /></IconButton>
                  <IconButton component={Link} href={`/admin/partidas/${m.id}/editar`} size="small" title="Editar"><Edit fontSize="small" /></IconButton>
                  <IconButton onClick={() => handleDelete(m.id)} size="small" color="error"><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {data?.data.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                <Typography color="text.secondary">Nenhuma partida encontrada</Typography>
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        {data && data.total > 15 && (
          <TablePagination component="div" count={data.total} page={page} onPageChange={(_, p) => setPage(p)}
            rowsPerPage={15} rowsPerPageOptions={[15]} labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`} />
        )}
      </TableContainer>
    </Box>
  );
}
