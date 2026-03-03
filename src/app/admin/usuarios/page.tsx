'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ShieldCheck, ShieldOff, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/admin/PageHeader';

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
    if (!authLoading && (!user || !isSuperAdmin)) router.push('/admin');
  }, [authLoading, user, isSuperAdmin, router]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) setUsers(await res.json());
    } catch {
      setError('Erro ao carregar usuarios');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { if (isSuperAdmin) fetchUsers(); }, [isSuperAdmin, fetchUsers]);

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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Super Admin</Badge>;
      case 'admin':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Admin</Badge>;
      case 'team_owner':
        return <Badge variant="outline" className="text-sky-700 border-sky-300">Dono de Time</Badge>;
      case 'player':
        return <Badge variant="outline" className="text-green-700 border-green-300">Jogador</Badge>;
      default:
        return <Badge variant="outline">Torcedor</Badge>;
    }
  };

  if (authLoading || !isSuperAdmin) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <TooltipProvider>
      <div>
        <PageHeader title="Gestao de Usuarios" />

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="mb-4">
          <div className="relative w-full md:w-[400px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Cadastro</TableHead>
                <TableHead className="text-center">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum usuario encontrado
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          {u.avatar_url && <AvatarImage src={u.avatar_url} />}
                          <AvatarFallback className="text-xs">{u.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{u.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{u.email}</TableCell>
                    <TableCell>{getRoleBadge(u.role)}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-center">
                      {u.role === 'superadmin' ? (
                        <span className="text-xs text-muted-foreground">-</span>
                      ) : u.role === 'admin' ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => handleRoleChange(u.id, 'fan')} className="p-1.5 rounded hover:bg-accent text-destructive">
                              <ShieldOff className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Revogar admin</TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => handleRoleChange(u.id, 'admin')} className="p-1.5 rounded hover:bg-accent text-primary">
                              <ShieldCheck className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Promover a admin</TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </TooltipProvider>
  );
}
