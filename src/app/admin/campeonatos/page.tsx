'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Search, Users, BarChart3, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Championship, PaginatedResponse } from '@/types';
import PageHeader from '@/components/admin/PageHeader';
import Pagination from '@/components/admin/Pagination';
import StatusBadge from '@/components/admin/StatusBadge';
import MobileActionsMenu from '@/components/admin/MobileActionsMenu';

export default function AdminCampeonatosPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Championship> | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { if (!loading && !isAdmin) router.push('/admin/login'); }, [isAdmin, loading, router]);

  const loadData = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: '15' });
    if (search) params.set('search', search);
    const res = await fetch(`/api/championships?${params}`);
    if (res.ok) setData(await res.json());
  }, [page, search]);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir campeonato "${name}"?`)) return;
    const res = await fetch(`/api/championships/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Campeonato excluido');
      loadData();
    } else {
      const data = await res.json();
      toast.error(data.error || 'Erro ao excluir campeonato');
    }
  };

  if (loading || !isAdmin) return null;

  return (
    <div>
      <PageHeader title="Campeonatos" action={{ label: 'Novo Campeonato', href: '/admin/campeonatos/novo', icon: <Plus className="h-4 w-4" /> }} />

      <div className="mb-4">
        <div className="relative w-full md:w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar campeonato..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campeonato</TableHead>
              <TableHead className="hidden md:table-cell">Ano</TableHead>
              <TableHead className="hidden md:table-cell">Categoria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-semibold">{c.name}</TableCell>
                <TableCell className="hidden md:table-cell">{c.year}</TableCell>
                <TableCell className="hidden md:table-cell">{c.category}</TableCell>
                <TableCell><StatusBadge status={c.status} /></TableCell>
                <TableCell className="text-right">
                  <MobileActionsMenu actions={[
                    { label: 'Inscricoes', icon: <Users className="h-4 w-4" />, href: `/admin/campeonatos/${c.id}/inscricoes` },
                    { label: 'Cartoes', icon: <CreditCard className="h-4 w-4" />, href: `/admin/campeonatos/${c.id}/cartoes` },
                    { label: 'Relatorios', icon: <BarChart3 className="h-4 w-4" />, href: `/admin/campeonatos/${c.id}/relatorios` },
                    { label: 'Editar', icon: <Pencil className="h-4 w-4" />, href: `/admin/campeonatos/${c.id}/editar` },
                    { label: 'Excluir', icon: <Trash2 className="h-4 w-4" />, color: 'error', onClick: () => handleDelete(c.id, c.name) },
                  ]} />
                </TableCell>
              </TableRow>
            ))}
            {data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum campeonato encontrado</TableCell>
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
