'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, TextField, Chip, TablePagination, Avatar,
} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { Team, PaginatedResponse } from '@/types';

export default function AdminTimesPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<PaginatedResponse<Team> | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => { if (!loading && !isAdmin) router.push('/admin/login'); }, [isAdmin, loading, router]);

  const loadTeams = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page + 1), limit: '15' });
    if (search) params.set('search', search);
    const res = await fetch(`/api/teams?${params}`);
    if (res.ok) setTeams(await res.json());
  }, [page, search]);

  useEffect(() => { if (user) loadTeams(); }, [user, loadTeams]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir time "${name}"?`)) return;
    await fetch(`/api/teams/${id}`, { method: 'DELETE' });
    loadTeams();
  };

  if (loading || !isAdmin) return null;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" fontWeight={700}>Times</Typography>
        <Button variant="contained" startIcon={<Add />} component={Link} href="/admin/times/novo">Novo Time</Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField placeholder="Buscar time..." size="small" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
          sx={{ width: { xs: '100%', md: 300 } }} />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Sigla</TableCell>
              <TableCell>Cidade</TableCell>
              <TableCell>Contato</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Acoes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teams?.data.map((team) => (
              <TableRow key={team.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar src={team.logo_url || ''} sx={{ width: 36, height: 36, bgcolor: team.primary_color || '#1976d2' }}>
                      {team.short_name?.[0] || team.name[0]}
                    </Avatar>
                    <Typography variant="body2" fontWeight={600}>{team.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{team.short_name || '-'}</TableCell>
                <TableCell>{team.city}/{team.state}</TableCell>
                <TableCell>{team.contact_name || '-'}</TableCell>
                <TableCell>
                  <Chip label={team.active ? 'Ativo' : 'Inativo'} size="small" color={team.active ? 'success' : 'default'} />
                </TableCell>
                <TableCell align="right">
                  <IconButton component={Link} href={`/admin/times/${team.id}/editar`} size="small"><Edit fontSize="small" /></IconButton>
                  <IconButton onClick={() => handleDelete(team.id, team.name)} size="small" color="error"><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {teams?.data.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                <Typography color="text.secondary">Nenhum time encontrado</Typography>
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        {teams && teams.total > 15 && (
          <TablePagination component="div" count={teams.total} page={page}
            onPageChange={(_, p) => setPage(p)} rowsPerPage={15} rowsPerPageOptions={[15]}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`} />
        )}
      </TableContainer>
    </Box>
  );
}
