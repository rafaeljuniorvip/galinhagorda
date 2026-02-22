'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, TablePagination,
  TextField, MenuItem, Alert, Avatar,
} from '@mui/material';
import {
  Delete, CheckCircle, Cancel, PushPin, PushPinOutlined,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { FanMessage } from '@/types';
import { formatDateTime } from '@/lib/utils';

const TARGET_TYPE_LABELS: Record<string, string> = {
  match: 'Partida',
  player: 'Jogador',
  team: 'Time',
  championship: 'Campeonato',
};

export default function AdminMensagensPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<FanMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [approvedFilter, setApprovedFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/admin/login');
  }, [user, loading, router]);

  const loadMessages = useCallback(async () => {
    const params = new URLSearchParams({ all: 'true', page: String(page + 1), limit: '20' });
    if (approvedFilter === 'approved') params.set('approved', 'true');
    if (approvedFilter === 'pending') params.set('approved', 'false');
    const res = await fetch(`/api/messages?${params}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages);
      setTotal(data.total);
    }
  }, [page, approvedFilter]);

  useEffect(() => {
    if (user) loadMessages();
  }, [user, loadMessages]);

  const handleToggleApproval = async (id: string) => {
    setError('');
    setSuccess('');
    const res = await fetch(`/api/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggleApproval' }),
    });
    if (res.ok) {
      setSuccess('Status atualizado!');
      loadMessages();
    } else {
      setError('Erro ao atualizar status');
    }
  };

  const handleTogglePin = async (id: string) => {
    setError('');
    setSuccess('');
    const res = await fetch(`/api/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'togglePin' }),
    });
    if (res.ok) {
      setSuccess('Fixacao atualizada!');
      loadMessages();
    } else {
      setError('Erro ao atualizar fixacao');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta mensagem?')) return;
    const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSuccess('Mensagem excluida!');
      loadMessages();
    } else {
      setError('Erro ao excluir mensagem');
    }
  };

  if (loading || !user) return null;

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>Moderacao de Mensagens</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Box sx={{ mb: 2 }}>
        <TextField
          select
          label="Filtro"
          size="small"
          value={approvedFilter}
          onChange={(e) => { setApprovedFilter(e.target.value); setPage(0); }}
          sx={{ width: { xs: '100%', md: 200 } }}
        >
          <MenuItem value="">Todas</MenuItem>
          <MenuItem value="pending">Pendentes</MenuItem>
          <MenuItem value="approved">Aprovadas</MenuItem>
        </TextField>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Autor</TableCell>
              <TableCell>Mensagem</TableCell>
              <TableCell>Alvo</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Data</TableCell>
              <TableCell align="right">Acoes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {messages.map((msg) => (
              <TableRow key={msg.id} hover sx={{ bgcolor: !msg.is_approved ? '#fff8e1' : undefined }}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={msg.author_avatar || ''} sx={{ width: 32, height: 32, fontSize: 14 }}>
                      {msg.author_name[0]}
                    </Avatar>
                    <Typography variant="body2" fontWeight={500}>{msg.author_name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {msg.message}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={TARGET_TYPE_LABELS[msg.target_type] || msg.target_type}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    <Chip
                      label={msg.is_approved ? 'Aprovada' : 'Pendente'}
                      size="small"
                      color={msg.is_approved ? 'success' : 'warning'}
                    />
                    {msg.is_pinned && <Chip label="Fixada" size="small" color="primary" />}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="caption">{formatDateTime(msg.created_at)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleToggleApproval(msg.id)}
                    color={msg.is_approved ? 'error' : 'success'}
                    title={msg.is_approved ? 'Reprovar' : 'Aprovar'}
                  >
                    {msg.is_approved ? <Cancel fontSize="small" /> : <CheckCircle fontSize="small" />}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleTogglePin(msg.id)}
                    color={msg.is_pinned ? 'primary' : 'default'}
                    title={msg.is_pinned ? 'Desfixar' : 'Fixar'}
                  >
                    {msg.is_pinned ? <PushPin fontSize="small" /> : <PushPinOutlined fontSize="small" />}
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(msg.id)} title="Excluir">
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {messages.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">Nenhuma mensagem encontrada</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {total > 20 && (
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={20}
            rowsPerPageOptions={[20]}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        )}
      </TableContainer>
    </Box>
  );
}
