'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Team, PaginatedResponse } from '@/types';
import PageHeader from '@/components/admin/PageHeader';
import Pagination from '@/components/admin/Pagination';
import StatusBadge from '@/components/admin/StatusBadge';

export default function AdminTimesPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<PaginatedResponse<Team> | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { if (!loading && !isAdmin) router.push('/admin/login'); }, [isAdmin, loading, router]);

  const loadTeams = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: '15' });
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
    <div>
      <PageHeader title="Times" action={{ label: 'Novo Time', href: '/admin/times/novo', icon: <Plus className="h-4 w-4" /> }} />

      <div className="mb-4">
        <div className="relative w-full md:w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar time..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead className="hidden md:table-cell">Sigla</TableHead>
              <TableHead className="hidden md:table-cell">Cidade</TableHead>
              <TableHead className="hidden md:table-cell">Contato</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams?.data.map((team) => (
              <TableRow key={team.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9" style={{ backgroundColor: team.primary_color || '#1976d2' }}>
                      <AvatarImage src={team.logo_url || ''} alt={team.name} />
                      <AvatarFallback className="text-white text-xs">{team.short_name?.[0] || team.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-sm">{team.name}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{team.short_name || '-'}</TableCell>
                <TableCell className="hidden md:table-cell">{team.city}/{team.state}</TableCell>
                <TableCell className="hidden md:table-cell">{team.contact_name || '-'}</TableCell>
                <TableCell>
                  <StatusBadge status={team.active ? 'Ativo' : 'Inativo'} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`/admin/times/${team.id}/editar`} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button onClick={() => handleDelete(team.id, team.name)} className="p-1.5 rounded hover:bg-accent text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {teams?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum time encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {teams && (
          <Pagination page={page} totalPages={teams.totalPages} total={teams.total} limit={15} onPageChange={setPage} />
        )}
      </Card>
    </div>
  );
}
