'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, TextField, Chip, TablePagination,
  Avatar, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert,
} from '@mui/material';
import { Add, Edit, Delete, Search, Link as LinkIcon, ContentCopy } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { Player, PaginatedResponse } from '@/types';

export default function AdminJogadoresPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [players, setPlayers] = useState<PaginatedResponse<Player> | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [linkDialog, setLinkDialog] = useState<{ open: boolean; link: string; playerName: string }>({ open: false, link: '', playerName: '' });
  const [linkLoading, setLinkLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (!loading && !isAdmin) router.push('/admin/login');
  }, [isAdmin, loading, router]);

  const loadPlayers = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page + 1), limit: '15' });
    if (search) params.set('search', search);
    const res = await fetch(`/api/players?${params}`);
    if (res.ok) setPlayers(await res.json());
  }, [page, search]);

  useEffect(() => {
    if (user) loadPlayers();
  }, [user, loadPlayers]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir jogador "${name}"?`)) return;
    await fetch(`/api/players/${id}`, { method: 'DELETE' });
    loadPlayers();
  };

  const handleGenerateLink = async (id: string, name: string) => {
    setLinkLoading(true);
    try {
      const res = await fetch(`/api/players/${id}/generate-link`, { method: 'POST' });
      if (res.ok) {
        const { link } = await res.json();
        setLinkDialog({ open: true, link, playerName: name });
      } else {
        setSnackbar({ open: true, message: 'Erro ao gerar link', severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Erro ao gerar link', severity: 'error' });
    } finally {
      setLinkLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(linkDialog.link);
      setSnackbar({ open: true, message: 'Link copiado!', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Erro ao copiar', severity: 'error' });
    }
  };

  if (loading || !isAdmin) return null;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" fontWeight={700}>Jogadores</Typography>
        <Button variant="contained" startIcon={<Add />} component={Link} href="/admin/jogadores/novo">
          Novo Jogador
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField
          placeholder="Buscar jogador..."
          size="small"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
          sx={{ width: { xs: '100%', md: 300 } }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Jogador</TableCell>
              <TableCell>Posicao</TableCell>
              <TableCell>Cidade</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Acoes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {players?.data.map((player) => (
              <TableRow key={player.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar src={player.photo_url || ''} sx={{ width: 36, height: 36 }}>
                      {player.name[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{player.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{player.full_name}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{player.position}</TableCell>
                <TableCell>{player.city}/{player.state}</TableCell>
                <TableCell>
                  <Chip label={player.active ? 'Ativo' : 'Inativo'} size="small"
                    color={player.active ? 'success' : 'default'} />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => handleGenerateLink(player.id, player.name)}
                    size="small"
                    color="primary"
                    title="Gerar link para completar perfil"
                    disabled={linkLoading}
                  >
                    <LinkIcon fontSize="small" />
                  </IconButton>
                  <IconButton component={Link} href={`/admin/jogadores/${player.id}/editar`} size="small">
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(player.id, player.name)} size="small" color="error">
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {players?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">Nenhum jogador encontrado</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {players && players.total > 15 && (
          <TablePagination
            component="div"
            count={players.total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={15}
            rowsPerPageOptions={[15]}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        )}
      </TableContainer>

      {/* Link Dialog */}
      <Dialog open={linkDialog.open} onClose={() => setLinkDialog({ ...linkDialog, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Link para Completar Perfil</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Envie este link para <strong>{linkDialog.playerName}</strong> preencher o perfil. O link expira em 7 dias e so pode ser usado uma vez.
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={linkDialog.link}
            InputProps={{ readOnly: true }}
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialog({ ...linkDialog, open: false })}>Fechar</Button>
          <Button variant="contained" startIcon={<ContentCopy />} onClick={handleCopyLink}>
            Copiar Link
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
