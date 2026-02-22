'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container, Typography, Box, Paper, Grid, TextField, Button, Avatar,
  Chip, CircularProgress, Alert, Snackbar, Divider, List, ListItem,
  ListItemText, ListItemIcon, IconButton, Autocomplete, Card, CardContent,
} from '@mui/material';
import {
  Person, Edit, Save, Cancel, SportsSoccer, Shield, Star,
  Notifications as NotificationsIcon, MarkEmailRead, Search,
  Link as LinkIcon,
} from '@mui/icons-material';

interface PlayerOption {
  id: string;
  name: string;
  full_name: string;
  nickname: string | null;
  photo_url: string | null;
  position: string;
}

interface TeamOption {
  id: string;
  name: string;
  short_name: string | null;
  logo_url: string | null;
  city: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: string;
  bio: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  linked_player_id: string | null;
  linked_team_id: string | null;
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  team_owner: 'Dono de Time',
  player: 'Jogador',
  fan: 'Torcedor',
};

const roleColors: Record<string, string> = {
  admin: '#d32f2f',
  team_owner: '#1976d2',
  player: '#388e3c',
  fan: '#ffd600',
};

const roleIcons: Record<string, React.ReactNode> = {
  admin: <Star />,
  team_owner: <Shield />,
  player: <SportsSoccer />,
  fan: <Person />,
};

export default function MeuPerfilPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', phone: '', city: '', state: '' });
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Player/Team linking
  const [playerSearch, setPlayerSearch] = useState('');
  const [playerOptions, setPlayerOptions] = useState<PlayerOption[]>([]);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [teamSearch, setTeamSearch] = useState('');
  const [teamOptions, setTeamOptions] = useState<TeamOption[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/users/me');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setForm({
          name: data.user.name || '',
          bio: data.user.bio || '',
          phone: data.user.phone || '',
          city: data.user.city || '',
          state: data.user.state || '',
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/users/me/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      loadProfile();
      loadNotifications();
    }
  }, [status, router, loadProfile, loadNotifications]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setEditing(false);
        setSnackbar({ open: true, message: 'Perfil atualizado com sucesso!', severity: 'success' });
        // Trigger session update to reflect changes
        await updateSession();
      } else {
        setSnackbar({ open: true, message: 'Erro ao atualizar perfil.', severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Erro de conexao.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSearchPlayers = async (value: string) => {
    setPlayerSearch(value);
    if (value.length < 2) {
      setPlayerOptions([]);
      return;
    }
    setPlayerLoading(true);
    try {
      const res = await fetch(`/api/users/search-players?q=${encodeURIComponent(value)}`);
      if (res.ok) {
        const data = await res.json();
        setPlayerOptions(data.players || []);
      }
    } catch {
      // ignore
    } finally {
      setPlayerLoading(false);
    }
  };

  const handleLinkPlayer = async (player: PlayerOption) => {
    try {
      const res = await fetch('/api/users/me/link-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: player.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setSnackbar({ open: true, message: `Vinculado ao jogador ${player.name}!`, severity: 'success' });
        await updateSession();
      } else {
        setSnackbar({ open: true, message: 'Erro ao vincular jogador.', severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Erro de conexao.', severity: 'error' });
    }
  };

  const handleSearchTeams = async (value: string) => {
    setTeamSearch(value);
    if (value.length < 2) {
      setTeamOptions([]);
      return;
    }
    setTeamLoading(true);
    try {
      const res = await fetch(`/api/users/search-teams?q=${encodeURIComponent(value)}`);
      if (res.ok) {
        const data = await res.json();
        setTeamOptions(data.teams || []);
      }
    } catch {
      // ignore
    } finally {
      setTeamLoading(false);
    }
  };

  const handleLinkTeam = async (team: TeamOption) => {
    try {
      const res = await fetch('/api/users/me/link-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: team.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setSnackbar({ open: true, message: `Vinculado ao time ${team.name}!`, severity: 'success' });
        await updateSession();
      } else {
        setSnackbar({ open: true, message: 'Erro ao vincular time.', severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Erro de conexao.', severity: 'error' });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/users/me/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const handleMarkRead = async (notificationId: string) => {
    try {
      await fetch('/api/users/me/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  if (status === 'loading' || loadingProfile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!session || !profile) {
    return null;
  }

  const role = profile.role || 'fan';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Meu Perfil
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              src={profile.avatar_url || undefined}
              sx={{ width: 100, height: 100, mx: 'auto', mb: 2, border: '3px solid #1a237e' }}
            >
              {profile.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Typography variant="h6" fontWeight={700}>
              {profile.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {profile.email}
            </Typography>
            <Chip
              icon={roleIcons[role] as React.ReactElement}
              label={roleLabels[role] || 'Torcedor'}
              sx={{
                backgroundColor: roleColors[role] || '#ffd600',
                color: role === 'fan' ? '#333' : 'white',
                fontWeight: 600,
              }}
            />
            {profile.city && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {profile.city}{profile.state ? ` - ${profile.state}` : ''}
              </Typography>
            )}
            {profile.bio && (
              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: '#666' }}>
                {profile.bio}
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Edit Form */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Informacoes Pessoais
              </Typography>
              {!editing ? (
                <Button
                  startIcon={<Edit />}
                  variant="outlined"
                  size="small"
                  onClick={() => setEditing(true)}
                >
                  Editar
                </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    startIcon={<Cancel />}
                    size="small"
                    onClick={() => {
                      setEditing(false);
                      setForm({
                        name: profile.name || '',
                        bio: profile.bio || '',
                        phone: profile.phone || '',
                        city: profile.city || '',
                        state: profile.state || '',
                      });
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    startIcon={saving ? <CircularProgress size={16} /> : <Save />}
                    variant="contained"
                    size="small"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    Salvar
                  </Button>
                </Box>
              )}
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nome"
                  fullWidth
                  size="small"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={!editing}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Telefone"
                  fullWidth
                  size="small"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  disabled={!editing}
                  placeholder="(00) 00000-0000"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Cidade"
                  fullWidth
                  size="small"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  disabled={!editing}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Estado"
                  fullWidth
                  size="small"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  disabled={!editing}
                  placeholder="MG"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Bio"
                  fullWidth
                  size="small"
                  multiline
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  disabled={!editing}
                  placeholder="Conte um pouco sobre voce..."
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Link Player */}
          {!profile.linked_player_id && (
            <Paper sx={{ p: 3, mt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SportsSoccer sx={{ color: '#388e3c' }} />
                <Typography variant="h6" fontWeight={600}>
                  Vincular Perfil de Jogador
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Se voce e um jogador inscrito no campeonato, vincule seu perfil para ter acesso
                a informacoes exclusivas e estatisticas.
              </Typography>
              <Autocomplete
                freeSolo
                options={playerOptions}
                getOptionLabel={(option) =>
                  typeof option === 'string' ? option : `${option.name} (${option.position})`
                }
                loading={playerLoading}
                inputValue={playerSearch}
                onInputChange={(_e, value) => handleSearchPlayers(value)}
                onChange={(_e, value) => {
                  if (value && typeof value !== 'string') {
                    handleLinkPlayer(value);
                  }
                }}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar src={option.photo_url || undefined} sx={{ width: 32, height: 32 }}>
                        {option.name?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.position} {option.full_name !== option.name ? `- ${option.full_name}` : ''}
                        </Typography>
                      </Box>
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Buscar jogador por nome..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />,
                    }}
                  />
                )}
              />
            </Paper>
          )}

          {profile.linked_player_id && (
            <Paper sx={{ p: 3, mt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinkIcon sx={{ color: '#388e3c' }} />
                <Typography variant="body2" color="text.secondary">
                  Perfil de jogador vinculado
                </Typography>
                <Chip label="Jogador" size="small" color="success" variant="outlined" />
              </Box>
            </Paper>
          )}

          {/* Link Team */}
          {!profile.linked_team_id && (
            <Paper sx={{ p: 3, mt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Shield sx={{ color: '#1976d2' }} />
                <Typography variant="h6" fontWeight={600}>
                  Vincular Time
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Se voce e dono ou responsavel por um time, vincule-o ao seu perfil para
                gerenciar informacoes e receber notificacoes.
              </Typography>
              <Autocomplete
                freeSolo
                options={teamOptions}
                getOptionLabel={(option) =>
                  typeof option === 'string' ? option : option.name
                }
                loading={teamLoading}
                inputValue={teamSearch}
                onInputChange={(_e, value) => handleSearchTeams(value)}
                onChange={(_e, value) => {
                  if (value && typeof value !== 'string') {
                    handleLinkTeam(value);
                  }
                }}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar src={option.logo_url || undefined} sx={{ width: 32, height: 32 }}>
                        {option.name?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.city}
                        </Typography>
                      </Box>
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Buscar time por nome..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />,
                    }}
                  />
                )}
              />
            </Paper>
          )}

          {profile.linked_team_id && (
            <Paper sx={{ p: 3, mt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinkIcon sx={{ color: '#1976d2' }} />
                <Typography variant="body2" color="text.secondary">
                  Time vinculado ao perfil
                </Typography>
                <Chip label="Dono de Time" size="small" color="primary" variant="outlined" />
              </Box>
            </Paper>
          )}
        </Grid>

        {/* Notifications */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsIcon sx={{ color: '#1a237e' }} />
                <Typography variant="h6" fontWeight={600}>
                  Notificacoes
                </Typography>
                {unreadCount > 0 && (
                  <Chip
                    label={unreadCount}
                    size="small"
                    color="error"
                    sx={{ height: 22, fontSize: '0.75rem' }}
                  />
                )}
              </Box>
              {unreadCount > 0 && (
                <Button
                  startIcon={<MarkEmailRead />}
                  size="small"
                  onClick={handleMarkAllRead}
                >
                  Marcar todas como lidas
                </Button>
              )}
            </Box>

            {notifications.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                Nenhuma notificacao no momento.
              </Typography>
            ) : (
              <List disablePadding>
                {notifications.map((notification, index) => (
                  <Box key={notification.id}>
                    {index > 0 && <Divider />}
                    <ListItem
                      sx={{
                        backgroundColor: notification.is_read ? 'transparent' : 'rgba(25, 118, 210, 0.04)',
                        borderLeft: notification.is_read ? 'none' : '3px solid #1976d2',
                      }}
                      secondaryAction={
                        !notification.is_read ? (
                          <IconButton
                            size="small"
                            onClick={() => handleMarkRead(notification.id)}
                            title="Marcar como lida"
                          >
                            <MarkEmailRead fontSize="small" />
                          </IconButton>
                        ) : null
                      }
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={notification.is_read ? 400 : 600}>
                            {notification.title}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography variant="caption" component="span" display="block">
                              {notification.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(notification.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  </Box>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
