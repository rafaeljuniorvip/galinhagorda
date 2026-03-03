'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Referee, PaginatedResponse } from '@/types';
import { REFEREE_CATEGORIES } from '@/lib/utils';
import PageHeader from '@/components/admin/PageHeader';
import Pagination from '@/components/admin/Pagination';
import StatusBadge from '@/components/admin/StatusBadge';

export default function AdminArbitrosPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [referees, setReferees] = useState<PaginatedResponse<Referee> | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => { if (!loading && !isAdmin) router.push('/admin/login'); }, [isAdmin, loading, router]);

  const loadReferees = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: '15' });
    if (search) params.set('search', search);
    if (category && category !== 'all') params.set('category', category);
    const res = await fetch(`/api/referees?${params}`);
    if (res.ok) setReferees(await res.json());
  }, [page, search, category]);

  useEffect(() => { if (user) loadReferees(); }, [user, loadReferees]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir arbitro "${name}"?`)) return;
    await fetch(`/api/referees/${id}`, { method: 'DELETE' });
    loadReferees();
  };

  if (loading || !isAdmin) return null;

  return (
    <div>
      <PageHeader title="Arbitros" action={{ label: 'Novo Arbitro', href: '/admin/arbitros/novo', icon: <Plus className="h-4 w-4" /> }} />

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative w-full md:w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar arbitro..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {REFEREE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">Apelido</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="hidden md:table-cell">Cidade</TableHead>
              <TableHead className="hidden md:table-cell">Telefone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {referees?.data.map((ref) => (
              <TableRow key={ref.id}>
                <TableCell className="font-semibold">{ref.name}</TableCell>
                <TableCell className="hidden md:table-cell">{ref.nickname || '-'}</TableCell>
                <TableCell><Badge variant="outline">{ref.category}</Badge></TableCell>
                <TableCell className="hidden md:table-cell">{ref.city}/{ref.state}</TableCell>
                <TableCell className="hidden md:table-cell">{ref.phone || '-'}</TableCell>
                <TableCell><StatusBadge status={ref.active ? 'Ativo' : 'Inativo'} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`/admin/arbitros/${ref.id}/editar`} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button onClick={() => handleDelete(ref.id, ref.name)} className="p-1.5 rounded hover:bg-accent text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {referees?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum arbitro encontrado</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {referees && (
          <Pagination page={page} totalPages={referees.totalPages} total={referees.total} limit={15} onPageChange={setPage} />
        )}
      </Card>
    </div>
  );
}
