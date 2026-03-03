'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  User, Pencil, Save, X, CircleDot, Shield, Star,
  Bell, MailCheck, Search, Link as LinkIcon, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

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

const roleStyles: Record<string, string> = {
  admin: 'bg-red-600 text-white',
  team_owner: 'bg-blue-600 text-white',
  player: 'bg-green-600 text-white',
  fan: 'bg-yellow-400 text-gray-800',
};

const roleIcons: Record<string, React.ReactNode> = {
  admin: <Star className="h-3.5 w-3.5" />,
  team_owner: <Shield className="h-3.5 w-3.5" />,
  player: <CircleDot className="h-3.5 w-3.5" />,
  fan: <User className="h-3.5 w-3.5" />,
};

export default function MeuPerfilPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', phone: '', city: '', state: '' });
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

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
        toast.success('Perfil atualizado com sucesso!');
        await updateSession();
      } else {
        toast.error('Erro ao atualizar perfil.');
      }
    } catch {
      toast.error('Erro de conexao.');
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
        toast.success(`Vinculado ao jogador ${player.name}!`);
        await updateSession();
      } else {
        toast.error('Erro ao vincular jogador.');
      }
    } catch {
      toast.error('Erro de conexao.');
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
        toast.success(`Vinculado ao time ${team.name}!`);
        await updateSession();
      } else {
        toast.error('Erro ao vincular time.');
      }
    } catch {
      toast.error('Erro de conexao.');
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
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session || !profile) {
    return null;
  }

  const role = profile.role || 'fan';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Meu Perfil</h1>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4">
        {/* Profile Card */}
        <Card className="text-center">
          <CardContent className="p-6">
            <Avatar className="h-[100px] w-[100px] mx-auto mb-3 border-[3px] border-[#1a237e]">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-3xl">
                {profile.name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-lg font-bold">{profile.name}</h2>
            <p className="text-sm text-muted-foreground mb-2">{profile.email}</p>
            <Badge className={`${roleStyles[role] || roleStyles.fan} gap-1`}>
              {roleIcons[role]}
              {roleLabels[role] || 'Torcedor'}
            </Badge>
            {profile.city && (
              <p className="text-sm text-muted-foreground mt-2">
                {profile.city}{profile.state ? ` - ${profile.state}` : ''}
              </p>
            )}
            {profile.bio && (
              <p className="text-sm italic text-muted-foreground mt-2">{profile.bio}</p>
            )}
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Edit Form */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Informacoes Pessoais</h3>
                {!editing ? (
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
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
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                      Salvar
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Nome</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    disabled={!editing}
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    disabled={!editing}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    disabled={!editing}
                  />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Input
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    disabled={!editing}
                    placeholder="MG"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Bio</Label>
                  <Textarea
                    rows={3}
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    disabled={!editing}
                    placeholder="Conte um pouco sobre voce..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Link Player */}
          {!profile.linked_player_id && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CircleDot className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold">Vincular Perfil de Jogador</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Se voce e um jogador inscrito no campeonato, vincule seu perfil para ter acesso
                  a informacoes exclusivas e estatisticas.
                </p>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Buscar jogador por nome..."
                    value={playerSearch}
                    onChange={(e) => handleSearchPlayers(e.target.value)}
                  />
                </div>
                {playerLoading && <p className="text-xs text-muted-foreground mt-1">Buscando...</p>}
                {playerOptions.length > 0 && (
                  <div className="mt-2 border rounded-md max-h-[200px] overflow-y-auto">
                    {playerOptions.map((opt) => (
                      <button
                        key={opt.id}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left transition-colors"
                        onClick={() => handleLinkPlayer(opt)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={opt.photo_url || undefined} />
                          <AvatarFallback className="text-xs">{opt.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold">{opt.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {opt.position} {opt.full_name !== opt.name ? `- ${opt.full_name}` : ''}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {profile.linked_player_id && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-muted-foreground">Perfil de jogador vinculado</p>
                  <Badge variant="outline" className="border-green-600 text-green-700">Jogador</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Link Team */}
          {!profile.linked_team_id && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">Vincular Time</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Se voce e dono ou responsavel por um time, vincule-o ao seu perfil para
                  gerenciar informacoes e receber notificacoes.
                </p>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Buscar time por nome..."
                    value={teamSearch}
                    onChange={(e) => handleSearchTeams(e.target.value)}
                  />
                </div>
                {teamLoading && <p className="text-xs text-muted-foreground mt-1">Buscando...</p>}
                {teamOptions.length > 0 && (
                  <div className="mt-2 border rounded-md max-h-[200px] overflow-y-auto">
                    {teamOptions.map((opt) => (
                      <button
                        key={opt.id}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left transition-colors"
                        onClick={() => handleLinkTeam(opt)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={opt.logo_url || undefined} />
                          <AvatarFallback className="text-xs">{opt.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold">{opt.name}</p>
                          <p className="text-xs text-muted-foreground">{opt.city}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {profile.linked_team_id && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-blue-600" />
                  <p className="text-sm text-muted-foreground">Time vinculado ao perfil</p>
                  <Badge variant="outline" className="border-blue-600 text-blue-700">Dono de Time</Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Notifications - Full width */}
        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-[#1a237e]" />
                  <h3 className="font-semibold">Notificacoes</h3>
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="h-5 text-xs px-1.5">
                      {unreadCount}
                    </Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                    <MailCheck className="h-4 w-4 mr-1" />
                    Marcar todas como lidas
                  </Button>
                )}
              </div>

              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhuma notificacao no momento.
                </p>
              ) : (
                <div>
                  {notifications.map((notification, index) => (
                    <div key={notification.id}>
                      {index > 0 && <Separator />}
                      <div
                        className={`flex items-start justify-between py-3 px-2 ${
                          notification.is_read
                            ? ''
                            : 'bg-blue-50 border-l-[3px] border-l-blue-600'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${notification.is_read ? '' : 'font-semibold'}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(notification.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0 ml-2"
                            onClick={() => handleMarkRead(notification.id)}
                            title="Marcar como lida"
                          >
                            <MailCheck className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
