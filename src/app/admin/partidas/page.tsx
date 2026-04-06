'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Pencil, Trash2, ListOrdered, Users, Radio, BarChart3, Calendar, Swords, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Match, Championship } from '@/types';
import PageHeader from '@/components/admin/PageHeader';
import StatusBadge from '@/components/admin/StatusBadge';
import MobileActionsMenu from '@/components/admin/MobileActionsMenu';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(d: string) {
  const date = new Date(d);
  const h = date.getHours();
  const m = date.getMinutes();
  if (h === 0 && m === 0) return '';
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function getRoundIcon(round: string) {
  const r = round.toLowerCase();
  if (r.includes('final') && !r.includes('semi')) return Trophy;
  if (r.includes('semi')) return Swords;
  return Calendar;
}

export default function AdminPartidasPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [championshipFilter, setChampionshipFilter] = useState('all');
  const [expandedRounds, setExpandedRounds] = useState<Set<string>>(new Set());

  useEffect(() => { if (!loading && !isAdmin) router.push('/admin/login'); }, [isAdmin, loading, router]);

  useEffect(() => {
    fetch('/api/championships?all=true').then(r => r.json()).then(setChampionships).catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    const params = new URLSearchParams({ limit: '200' });
    if (championshipFilter && championshipFilter !== 'all') params.set('championship_id', championshipFilter);
    const res = await fetch(`/api/matches?${params}`);
    if (res.ok) {
      const d = await res.json();
      setMatches(d.data || []);
    }
  }, [championshipFilter]);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir partida?')) return;
    const res = await fetch(`/api/matches/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Partida excluida');
      loadData();
    } else {
      const d = await res.json();
      toast.error(d.error || 'Erro ao excluir');
    }
  };

  const toggleRound = (round: string) => {
    setExpandedRounds(prev => {
      const next = new Set(prev);
      if (next.has(round)) next.delete(round); else next.add(round);
      return next;
    });
  };

  const grouped = useMemo(() => {
    const map = new Map<string, Match[]>();
    for (const m of matches) {
      const key = m.match_round || 'Sem rodada';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries());
  }, [matches]);

  if (loading || !isAdmin) return null;

  return (
    <div>
      <PageHeader title="Partidas" action={{ label: 'Nova Partida', href: '/admin/partidas/novo', icon: <Plus className="h-4 w-4" /> }} />

      <div className="mb-4">
        <Select value={championshipFilter} onValueChange={(v) => setChampionshipFilter(v)}>
          <SelectTrigger className="w-full md:w-[300px]">
            <SelectValue placeholder="Campeonato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {championships.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.year})</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {matches.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma partida encontrada</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {grouped.map(([round, roundMatches]) => {
            const isOpen = !expandedRounds.has(round);
            const finished = roundMatches.filter(m => m.status === 'Finalizada').length;
            const total = roundMatches.length;
            const allFinished = finished === total;
            const IconComp = getRoundIcon(round);

            return (
              <Card key={round} className="overflow-hidden">
                {/* Round header */}
                <button
                  onClick={() => toggleRound(round)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <IconComp className="h-4 w-4 text-[#1a237e]" />
                    <span className="text-sm font-bold text-[#1a237e]">{round}</span>
                    <Badge variant="outline" className={cn('text-[10px]', allFinished ? 'border-green-300 text-green-700' : '')}>
                      {allFinished ? 'Encerrada' : `${finished}/${total}`}
                    </Badge>
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>

                {/* Matches */}
                {isOpen && (
                  <div className="border-t">
                    {roundMatches.map((m, i) => (
                      <div key={m.id} className={cn('flex items-center gap-3 px-4 py-3', i > 0 && 'border-t border-border/50', i % 2 === 1 && 'bg-muted/20')}>
                        {/* Teams */}
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <Avatar className="h-6 w-6 shrink-0">
                            <AvatarImage src={m.home_team_logo || ''} />
                            <AvatarFallback className="text-[9px]">{(m.home_team_short || m.home_team_name || '?')[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-semibold truncate">{m.home_team_short || m.home_team_name}</span>
                        </div>

                        {/* Score */}
                        <div className="shrink-0 w-16 text-center">
                          {m.status === 'Finalizada' || m.status === 'Em Andamento' ? (
                            <span className={cn('text-sm font-extrabold', m.status === 'Em Andamento' ? 'text-red-600' : 'text-[#1a237e]')}>
                              {m.home_score ?? 0} x {m.away_score ?? 0}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground font-medium">vs</span>
                          )}
                        </div>

                        {/* Away team */}
                        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                          <span className="text-sm font-semibold truncate text-right">{m.away_team_short || m.away_team_name}</span>
                          <Avatar className="h-6 w-6 shrink-0">
                            <AvatarImage src={m.away_team_logo || ''} />
                            <AvatarFallback className="text-[9px]">{(m.away_team_short || m.away_team_name || '?')[0]}</AvatarFallback>
                          </Avatar>
                        </div>

                        {/* Date */}
                        <div className="hidden sm:block w-28 text-right shrink-0">
                          {m.match_date && (
                            <div className="text-xs text-muted-foreground">
                              <div>{formatDate(m.match_date)}</div>
                              {formatTime(m.match_date) && <div className="font-medium">{formatTime(m.match_date)}</div>}
                            </div>
                          )}
                        </div>

                        {/* Status */}
                        <div className="shrink-0 hidden md:block">
                          <StatusBadge status={m.status} />
                        </div>

                        {/* Actions */}
                        <div className="shrink-0">
                          <MobileActionsMenu actions={[
                            { label: 'Eventos', icon: <ListOrdered className="h-4 w-4" />, href: `/admin/partidas/${m.id}/eventos` },
                            { label: 'Escalacao', icon: <Users className="h-4 w-4" />, href: `/admin/partidas/${m.id}/escalacao` },
                            { label: 'Transmissoes', icon: <Radio className="h-4 w-4" />, href: `/admin/partidas/${m.id}/transmissoes` },
                            { label: 'Relatorios', icon: <BarChart3 className="h-4 w-4" />, href: `/admin/partidas/${m.id}/relatorios` },
                            { label: 'Editar', icon: <Pencil className="h-4 w-4" />, href: `/admin/partidas/${m.id}/editar` },
                            { label: 'Excluir', icon: <Trash2 className="h-4 w-4" />, color: 'error', onClick: () => handleDelete(m.id) },
                          ]} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
