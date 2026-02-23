'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, TextField, Chip, TablePagination,
} from '@mui/material';
import { Add, Edit, Delete, Search, People } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { Championship, PaginatedResponse } from '@/types';

export default function AdminCampeonatosPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Championship> | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => { if (!loading && !isAdmin) router.push('/admin/login'); }, [isAdmin, loading, router]);

  const loadData = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page + 1), limit: '15' });
    if (search) params.set('search', search);
    const res = await fetch(`/api/championships?${params}`);
    if (res.ok) setData(await res.json());
  }, [page, search]);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir campeonato "${name}"?`)) return;
    await fetch(`/api/championships/${id}`, { method: 'DELETE' });
    loadData();
  };

  const statusColor = (s: string) => {
    if (s === 'Em Andamento') return 'primary';
    if (s === 'Finalizado') return 'success';
    if (s === 'Cancelado') return 'error';
    return 'default';
  };

  if (loading || !isAdmin) return null;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" fontWeight={700}>Campeonatos</Typography>
        <Button variant="contained" startIcon={<Add />} component={Link} href="/admin/campeonatos/novo">Novo Campeonato</Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField placeholder="Buscar campeonato..." size="small" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
          sx={{ width: { xs: '100%', md: 300 } }} />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Campeonato</TableCell>
              <TableCell>Ano</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Acoes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.data.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell><Typography variant="body2" fontWeight={600}>{c.name}</Typography></TableCell>
                <TableCell>{c.year}</TableCell>
                <TableCell>{c.category}</TableCell>
                <TableCell><Chip label={c.status} size="small" color={statusColor(c.status) as any} /></TableCell>
                <TableCell align="right">
                  <IconButton component={Link} href={`/admin/campeonatos/${c.id}/inscricoes`} size="small" title="Inscricoes"><People fontSize="small" /></IconButton>
                  <IconButton component={Link} href={`/admin/campeonatos/${c.id}/editar`} size="small"><Edit fontSize="small" /></IconButton>
                  <IconButton onClick={() => handleDelete(c.id, c.name)} size="small" color="error"><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {data?.data.length === 0 && (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                <Typography color="text.secondary">Nenhum campeonato encontrado</Typography>
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
