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
import { Textarea } from '@/components/ui/textarea';
import { NewsArticle, Championship, PaginatedResponse, Player, Team, Match } from '@/types';
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
  const [aiFocus, setAiFocus] = useState('geral');
  const [aiStyle, setAiStyle] = useState('auto');
  const [aiContext, setAiContext] = useState('');
  const [aiMatchId, setAiMatchId] = useState('');
  const [aiTeamId, setAiTeamId] = useState('');
  const [aiPlayerId, setAiPlayerId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [focusMatches, setFocusMatches] = useState<Match[]>([]);

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

  // Load championships, teams, and players for AI dialog
  useEffect(() => {
    async function loadDialogData() {
      const [champsRes, teamsRes, playersRes] = await Promise.all([
        fetch('/api/championships?all=true'),
        fetch('/api/teams?all=true'),
        fetch('/api/players?all=true'),
      ]);
      if (champsRes.ok) {
        const d = await champsRes.json();
        setChampionships(Array.isArray(d) ? d : d.data || []);
      }
      if (teamsRes.ok) {
        const d = await teamsRes.json();
        setAllTeams(Array.isArray(d) ? d : d.data || []);
      }
      if (playersRes.ok) {
        const d = await playersRes.json();
        setAllPlayers(Array.isArray(d) ? d : d.data || []);
      }
    }
    if (user) loadDialogData();
  }, [user]);

  // Load matches when focus=jogo and championship changes
  useEffect(() => {
    async function loadMatches() {
      const params = new URLSearchParams({ limit: '50' });
      if (aiChampionshipId !== 'all') params.set('championship_id', aiChampionshipId);
      const res = await fetch(`/api/matches?${params}`);
      if (res.ok) {
        const d = await res.json();
        setFocusMatches(d.data || []);
      }
    }
    if (aiFocus === 'jogo') {
      loadMatches();
    }
  }, [aiFocus, aiChampionshipId]);

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
          focus: aiFocus !== 'geral' ? aiFocus : undefined,
          focus_id: aiFocus === 'jogo' ? aiMatchId : aiFocus === 'time' ? aiTeamId : aiFocus === 'jogador' ? aiPlayerId : undefined,
          style: aiStyle !== 'auto' ? aiStyle : undefined,
          context: aiContext.trim() || undefined,
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Gerar Noticias com IA
            </DialogTitle>
            <DialogDescription>
              A IA vai criar noticias baseadas nos dados reais do campeonato. As noticias serao salvas como rascunho para revisao.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
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
                <Label>Quantidade</Label>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Foco da noticia</Label>
                <Select value={aiFocus} onValueChange={(v) => { setAiFocus(v); setAiMatchId(''); setAiTeamId(''); setAiPlayerId(''); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">Geral / Campeonato</SelectItem>
                    <SelectItem value="jogo">Sobre um jogo</SelectItem>
                    <SelectItem value="time">Sobre um time</SelectItem>
                    <SelectItem value="jogador">Sobre um jogador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estilo / Enfase</Label>
                <Select value={aiStyle} onValueChange={setAiStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">IA decide o estilo</SelectItem>
                    <SelectItem value="cronica">Cronica de jogo</SelectItem>
                    <SelectItem value="analise">Analise tatica/tecnica</SelectItem>
                    <SelectItem value="preview">Preview/expectativa</SelectItem>
                    <SelectItem value="destaque">Destaque de jogador</SelectItem>
                    <SelectItem value="classificacao">Analise de classificacao</SelectItem>
                    <SelectItem value="bastidores">Bastidores e curiosidades</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {aiFocus === 'jogo' && (
              <div className="space-y-2">
                <Label>Selecione o jogo</Label>
                <Select value={aiMatchId} onValueChange={setAiMatchId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha uma partida..." />
                  </SelectTrigger>
                  <SelectContent>
                    {focusMatches.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.home_team_name} {m.home_score ?? ''} x {m.away_score ?? ''} {m.away_team_name} ({m.status})
                      </SelectItem>
                    ))}
                    {focusMatches.length === 0 && (
                      <SelectItem value="" disabled>Nenhuma partida encontrada</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {aiFocus === 'time' && (
              <div className="space-y-2">
                <Label>Selecione o time</Label>
                <Select value={aiTeamId} onValueChange={setAiTeamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um time..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allTeams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {aiFocus === 'jogador' && (
              <div className="space-y-2">
                <Label>Selecione o jogador</Label>
                <Select value={aiPlayerId} onValueChange={setAiPlayerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um jogador..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allPlayers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.full_name} ({p.position})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Contexto adicional <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Textarea
                value={aiContext}
                onChange={(e) => setAiContext(e.target.value)}
                placeholder="Ex: Focar na rivalidade entre os times, mencionar que o artilheiro voltou de lesao, destacar a torcida que lotou o estadio..."
                rows={3}
              />
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
