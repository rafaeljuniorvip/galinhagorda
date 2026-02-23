'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, TextField, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Paper, Chip, IconButton, Tooltip, Avatar, InputAdornment, Alert,
  CircularProgress,
} from '@mui/material';
import { Search, AdminPanelSettings, RemoveCircle } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

interface UserRow {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminUsuariosPage() {
  const { user, loading: authLoading, isSuperAdmin } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || !isSuperAdmin)) {
      router.push('/admin');
    }
  }, [authLoading, user, isSuperAdmin, router]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch {
      setError('Erro ao carregar usuarios');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchUsers();
    }
  }, [isSuperAdmin, fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'fan') => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        setSuccess(newRole === 'admin' ? 'Usuario promovido a admin!' : 'Acesso admin revogado!');
        fetchUsers();
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao atualizar');
      }
    } catch {
      setError('Erro ao atualizar role');
    }
  };

  const getRoleChip = (role: string) => {
    switch (role) {
      case 'superadmin':
        return <Chip label="Super Admin" color="error" size="small" />;
      case 'admin':
        return <Chip label="Admin" color="primary" size="small" />;
      case 'team_owner':
        return <Chip label="Dono de Time" color="info" size="small" variant="outlined" />;
      case 'player':
        return <Chip label="Jogador" color="success" size="small" variant="outlined" />;
      default:
        return <Chip label="Torcedor" size="small" variant="outlined" />;
    }
  };

  if (authLoading || !isSuperAdmin) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        Gestao de Usuarios
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <TextField
        placeholder="Buscar por nome ou email..."
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, width: 400, maxWidth: '100%' }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Usuario</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Cadastro</TableCell>
              <TableCell align="center">Acoes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  Nenhum usuario encontrado
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar src={u.avatar_url || undefined} sx={{ width: 32, height: 32 }}>
                        {u.name?.[0]}
                      </Avatar>
                      {u.name}
                    </Box>
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{getRoleChip(u.role)}</TableCell>
                  <TableCell>
                    {new Date(u.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell align="center">
                    {u.role === 'superadmin' ? (
                      <Typography variant="caption" color="text.secondary">-</Typography>
                    ) : u.role === 'admin' ? (
                      <Tooltip title="Revogar admin">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRoleChange(u.id, 'fan')}
                        >
                          <RemoveCircle fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Promover a admin">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleRoleChange(u.id, 'admin')}
                        >
                          <AdminPanelSettings fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
