'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, TextField, Chip, TablePagination, MenuItem,
} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { Referee, PaginatedResponse } from '@/types';
import { REFEREE_CATEGORIES } from '@/lib/utils';

export default function AdminArbitrosPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [referees, setReferees] = useState<PaginatedResponse<Referee> | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!loading && !isAdmin) router.push('/admin/login');
  }, [isAdmin, loading, router]);

  const loadReferees = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page + 1), limit: '15' });
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    const res = await fetch(`/api/referees?${params}`);
    if (res.ok) setReferees(await res.json());
  }, [page, search, category]);

  useEffect(() => {
    if (user) loadReferees();
  }, [user, loadReferees]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir arbitro "${name}"?`)) return;
    await fetch(`/api/referees/${id}`, { method: 'DELETE' });
    loadReferees();
  };

  if (loading || !isAdmin) return null;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" fontWeight={700}>Arbitros</Typography>
        <Button variant="contained" startIcon={<Add />} component={Link} href="/admin/arbitros/novo">
          Novo Arbitro
        </Button>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Buscar arbitro..."
          size="small"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
          sx={{ width: { xs: '100%', md: 300 } }}
        />
        <TextField
          select
          size="small"
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(0); }}
          sx={{ width: 200 }}
          label="Categoria"
        >
          <MenuItem value="">Todas</MenuItem>
          {REFEREE_CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Apelido</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell>Cidade</TableCell>
              <TableCell>Telefone</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Acoes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {referees?.data.map((ref) => (
              <TableRow key={ref.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{ref.name}</Typography>
                </TableCell>
                <TableCell>{ref.nickname || '-'}</TableCell>
                <TableCell>
                  <Chip label={ref.category} size="small" variant="outlined" />
                </TableCell>
                <TableCell>{ref.city}/{ref.state}</TableCell>
                <TableCell>{ref.phone || '-'}</TableCell>
                <TableCell>
                  <Chip label={ref.active ? 'Ativo' : 'Inativo'} size="small"
                    color={ref.active ? 'success' : 'default'} />
                </TableCell>
                <TableCell align="right">
                  <IconButton component={Link} href={`/admin/arbitros/${ref.id}/editar`} size="small">
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(ref.id, ref.name)} size="small" color="error">
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {referees?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">Nenhum arbitro encontrado</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {referees && referees.total > 15 && (
          <TablePagination
            component="div"
            count={referees.total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={15}
            rowsPerPageOptions={[15]}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        )}
      </TableContainer>
    </Box>
  );
}
