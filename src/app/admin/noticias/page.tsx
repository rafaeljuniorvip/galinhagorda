'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Search, Sparkles, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { NewsArticle, Championship, PaginatedResponse } from '@/types';
import { formatDateTime } from '@/lib/utils';
import PageHeader from '@/components/admin/PageHeader';
import Pagination from '@/components/admin/Pagination';
import StatusBadge from '@/components/admin/StatusBadge';
import { toast } from 'sonner';

export default function AdminNoticiasPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<NewsArticle> | null>(null);
  const [search, setSearch] = useState('');
  const [publishedFilter, setPublishedFilter] = useState('all');
  const [page, setPage] = useState(1);

  // AI Dialog state
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [aiChampionshipId, setAiChampionshipId] = useState('all');
  const [aiCount, setAiCount] = useState('3');
  const [generating, setGenerating] = useState(false);
  const [championships, setChampionships] = useState<Championship[]>([]);

  useEffect(() => { if (!loading && !isAdmin) router.push('/admin/login'); }, [isAdmin, loading, router]);

  const loadData = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: '15' });
    if (search) params.set('search', search);
    if (publishedFilter === 'published') params.set('published', 'true');
    if (publishedFilter === 'draft') params.set('published', 'false');
    if (publishedFilter === 'featured') params.set('featured', 'true');
    const res = await fetch(`/api/news?${params}`);
    if (res.ok) setData(await res.json());
  }, [page, search, publishedFilter]);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  // Load championships for AI dialog
  useEffect(() => {
    async function loadChampionships() {
      const res = await fetch('/api/championships?all=true');
      if (res.ok) {
        const data = await res.json();
        setChampionships(Array.isArray(data) ? data : data.data || []);
      }
    }
    if (user) loadChampionships();
  }, [user]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Excluir noticia "${title}"?`)) return;
    await fetch(`/api/news/${id}`, { method: 'DELETE' });
    loadData();
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/news/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          championship_id: aiChampionshipId !== 'all' ? aiChampionshipId : undefined,
          count: parseInt(aiCount),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || 'Erro ao gerar noticias');
        return;
      }

      toast.success(`${result.count} noticia(s) gerada(s) como rascunho!`);
      setShowAiDialog(false);
      loadData();
    } catch {
      toast.error('Erro de conexao ao gerar noticias');
    } finally {
      setGenerating(false);
    }
  };

  if (loading || !isAdmin) return null;

  return (
    <div>
      <PageHeader title="Noticias" action={{ label: 'Nova Noticia', href: '/admin/noticias/novo', icon: <Plus className="h-4 w-4" /> }}>
        <Button variant="outline" onClick={() => setShowAiDialog(true)}>
          <Sparkles className="h-4 w-4 mr-2" />
          Gerar com IA
        </Button>
      </PageHeader>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative w-full md:w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar noticia..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <Select value={publishedFilter} onValueChange={(v) => { setPublishedFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="published">Publicadas</SelectItem>
            <SelectItem value="draft">Rascunhos</SelectItem>
            <SelectItem value="featured">Destaques</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titulo</TableHead>
              <TableHead className="hidden md:table-cell">Autor</TableHead>
              <TableHead className="hidden md:table-cell">Views</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Data</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div>
                    <span className="font-semibold text-sm">{item.title}</span>
                    {item.championship_name && (
                      <p className="text-xs text-muted-foreground">{item.championship_name}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{item.author_name || '-'}</TableCell>
                <TableCell className="hidden md:table-cell">{item.views_count}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    <StatusBadge status={item.is_published ? 'Publicada' : 'Rascunho'} />
                    {item.is_featured && <Badge className="bg-blue-100 text-blue-800 border-blue-200">Destaque</Badge>}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm">
                  {item.published_at ? formatDateTime(item.published_at) : formatDateTime(item.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`/admin/noticias/${item.id}/editar`} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button onClick={() => handleDelete(item.id, item.title)} className="p-1.5 rounded hover:bg-accent text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma noticia encontrada</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {data && (
          <Pagination page={page} totalPages={data.totalPages} total={data.total} limit={15} onPageChange={setPage} />
        )}
      </Card>

      {/* AI Generation Dialog */}
      <Dialog open={showAiDialog} onOpenChange={setShowAiDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Gerar Noticias com IA
            </DialogTitle>
            <DialogDescription>
              A IA vai criar noticias baseadas nos dados reais do campeonato. As noticias serao salvas como rascunho para revisao.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Campeonato</Label>
              <Select value={aiChampionshipId} onValueChange={setAiChampionshipId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o campeonato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os campeonatos</SelectItem>
                  {championships.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.year})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantidade de noticias</Label>
              <Select value={aiCount} onValueChange={setAiCount}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n} noticia{n > 1 ? 's' : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAiDialog(false)} disabled={generating}>
              Cancelar
            </Button>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
