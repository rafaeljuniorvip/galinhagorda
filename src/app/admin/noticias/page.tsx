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
import { NewsArticle, PaginatedResponse } from '@/types';
import { formatDateTime } from '@/lib/utils';

export default function AdminNoticiasPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<NewsArticle> | null>(null);
  const [search, setSearch] = useState('');
  const [publishedFilter, setPublishedFilter] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!loading && !user) router.push('/admin/login');
  }, [user, loading, router]);

  const loadData = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page + 1), limit: '15' });
    if (search) params.set('search', search);
    if (publishedFilter === 'published') params.set('published', 'true');
    if (publishedFilter === 'draft') params.set('published', 'false');
    if (publishedFilter === 'featured') params.set('featured', 'true');
    const res = await fetch(`/api/news?${params}`);
    if (res.ok) setData(await res.json());
  }, [page, search, publishedFilter]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Excluir noticia "${title}"?`)) return;
    await fetch(`/api/news/${id}`, { method: 'DELETE' });
    loadData();
  };

  if (loading || !user) return null;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" fontWeight={700}>Noticias</Typography>
        <Button variant="contained" startIcon={<Add />} component={Link} href="/admin/noticias/novo">
          Nova Noticia
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Buscar noticia..."
          size="small"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
          sx={{ width: { xs: '100%', md: 300 } }}
        />
        <TextField
          select
          label="Status"
          size="small"
          value={publishedFilter}
          onChange={(e) => { setPublishedFilter(e.target.value); setPage(0); }}
          sx={{ width: { xs: '100%', md: 180 } }}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="published">Publicadas</MenuItem>
          <MenuItem value="draft">Rascunhos</MenuItem>
          <MenuItem value="featured">Destaques</MenuItem>
        </TextField>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Titulo</TableCell>
              <TableCell>Autor</TableCell>
              <TableCell>Views</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Data</TableCell>
              <TableCell align="right">Acoes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.data.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{item.title}</Typography>
                    {item.championship_name && (
                      <Typography variant="caption" color="text.secondary">{item.championship_name}</Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{item.author_name || '-'}</TableCell>
                <TableCell>{item.views_count}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    <Chip
                      label={item.is_published ? 'Publicada' : 'Rascunho'}
                      size="small"
                      color={item.is_published ? 'success' : 'default'}
                    />
                    {item.is_featured && <Chip label="Destaque" size="small" color="primary" />}
                  </Box>
                </TableCell>
                <TableCell>{item.published_at ? formatDateTime(item.published_at) : formatDateTime(item.created_at)}</TableCell>
                <TableCell align="right">
                  <IconButton component={Link} href={`/admin/noticias/${item.id}/editar`} size="small">
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(item.id, item.title)} size="small" color="error">
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">Nenhuma noticia encontrada</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {data && data.total > 15 && (
          <TablePagination
            component="div"
            count={data.total}
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
