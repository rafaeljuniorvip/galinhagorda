'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Pencil, Trash2, ListOrdered, Users, Radio, BarChart3 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Match, PaginatedResponse, Championship } from '@/types';
import { formatDateTime } from '@/lib/utils';
import PageHeader from '@/components/admin/PageHeader';
import Pagination from '@/components/admin/Pagination';
import StatusBadge, { getStatusVariant } from '@/components/admin/StatusBadge';
import MobileActionsMenu from '@/components/admin/MobileActionsMenu';

export default function AdminPartidasPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Match> | null>(null);
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [championshipFilter, setChampionshipFilter] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => { if (!loading && !isAdmin) router.push('/admin/login'); }, [isAdmin, loading, router]);

  useEffect(() => {
    fetch('/api/championships?all=true').then(r => r.json()).then(setChampionships).catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: '15' });
    if (championshipFilter && championshipFilter !== 'all') params.set('championship_id', championshipFilter);
    const res = await fetch(`/api/matches?${params}`);
    if (res.ok) setData(await res.json());
  }, [page, championshipFilter]);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir partida?')) return;
    await fetch(`/api/matches/${id}`, { method: 'DELETE' });
    loadData();
  };

  if (loading || !isAdmin) return null;

  return (
    <div>
      <PageHeader title="Partidas" action={{ label: 'Nova Partida', href: '/admin/partidas/novo', icon: <Plus className="h-4 w-4" /> }} />

      <div className="mb-4">
        <Select value={championshipFilter} onValueChange={(v) => { setChampionshipFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full md:w-[300px]">
            <SelectValue placeholder="Campeonato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {championships.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.year})</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partida</TableHead>
              <TableHead>Placar</TableHead>
              <TableHead className="hidden md:table-cell">Data</TableHead>
              <TableHead className="hidden md:table-cell">Rodada</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={m.home_team_logo || ''} />
                      <AvatarFallback className="text-[10px]">{m.home_team_short?.[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-sm">{m.home_team_short || m.home_team_name}</span>
                    <span className="text-muted-foreground text-xs">x</span>
                    <span className="font-semibold text-sm">{m.away_team_short || m.away_team_name}</span>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={m.away_team_logo || ''} />
                      <AvatarFallback className="text-[10px]">{m.away_team_short?.[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                </TableCell>
                <TableCell>{m.home_score !== null ? `${m.home_score} x ${m.away_score}` : '-'}</TableCell>
                <TableCell className="hidden md:table-cell text-sm">{m.match_date ? formatDateTime(m.match_date) : '-'}</TableCell>
                <TableCell className="hidden md:table-cell">{m.match_round || '-'}</TableCell>
                <TableCell><StatusBadge status={m.status} /></TableCell>
                <TableCell className="text-right">
                  <MobileActionsMenu actions={[
                    { label: 'Eventos', icon: <ListOrdered className="h-4 w-4" />, href: `/admin/partidas/${m.id}/eventos` },
                    { label: 'Escalacao', icon: <Users className="h-4 w-4" />, href: `/admin/partidas/${m.id}/escalacao` },
                    { label: 'Transmissoes', icon: <Radio className="h-4 w-4" />, href: `/admin/partidas/${m.id}/transmissoes` },
                    { label: 'Relatorios', icon: <BarChart3 className="h-4 w-4" />, href: `/admin/partidas/${m.id}/relatorios` },
                    { label: 'Editar', icon: <Pencil className="h-4 w-4" />, href: `/admin/partidas/${m.id}/editar` },
                    { label: 'Excluir', icon: <Trash2 className="h-4 w-4" />, color: 'error', onClick: () => handleDelete(m.id) },
                  ]} />
                </TableCell>
              </TableRow>
            ))}
            {data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma partida encontrada</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {data && (
          <Pagination page={page} totalPages={data.totalPages} total={data.total} limit={15} onPageChange={setPage} />
        )}
      </Card>
    </div>
  );
}
