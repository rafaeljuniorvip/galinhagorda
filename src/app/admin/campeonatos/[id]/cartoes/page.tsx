'use client';

import { Fragment, useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  FileSpreadsheet, ArrowLeft, CreditCard,
  AlertTriangle, ChevronDown, ChevronUp, Search, Ban, ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

interface CardEvent {
  event_id: string;
  event_type: 'CARTAO_AMARELO' | 'CARTAO_VERMELHO' | 'SEGUNDO_AMARELO';
  minute: number | null;
  half: string | null;
  notes: string | null;
  match_id: string;
  match_round: string | null;
  match_date: string;
  home_score: number;
  away_score: number;
  player_id: string;
  player_name: string;
  player_photo: string | null;
  shirt_number: number | null;
  team_id: string;
  team_name: string;
  team_short_name: string | null;
  team_logo: string | null;
  home_team_name: string;
  home_short_name: string | null;
  away_team_name: string;
  away_short_name: string | null;
}

type ViewMode = 'by-round' | 'by-match' | 'by-player';
type CardFilter = 'all' | 'yellow' | 'red' | 'second-yellow';

interface SuspensionEvent {
  type: 'yellow_accumulation' | 'red_card';
  round: string;
  count?: number;
  suspendedIn: string[];
}

interface PlayerSuspension {
  accumYellows: number;
  totalSuspensions: number;
  suspendedRounds: string[];
  history: SuspensionEvent[];
  isSuspendedNow: boolean;
  nextSuspendedRound: string | null;
  status: string;
}

const cardTypeLabel: Record<string, string> = {
  CARTAO_AMARELO: 'Amarelo',
  CARTAO_VERMELHO: 'Vermelho',
  SEGUNDO_AMARELO: '2o Amarelo',
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatMatchLabel(c: CardEvent) {
  return `${c.home_short_name || c.home_team_name} ${c.home_score}x${c.away_score} ${c.away_short_name || c.away_team_name}`;
}

function CardBadge({ type }: { type: string }) {
  if (type === 'CARTAO_AMARELO') {
    return <span className="inline-block w-4 h-5 rounded-[2px] bg-yellow-400 border border-yellow-500" title="Amarelo" />;
  }
  if (type === 'SEGUNDO_AMARELO') {
    return (
      <span className="inline-flex w-4 h-5 rounded-[2px] overflow-hidden border border-orange-500" title="2o Amarelo (= Vermelho)">
        <span className="w-1/2 bg-yellow-400" />
        <span className="w-1/2 bg-red-600" />
      </span>
    );
  }
  return <span className="inline-block w-4 h-5 rounded-[2px] bg-red-600 border border-red-700" title="Vermelho direto" />;
}

export default function AdminCartoesPage() {
  const params = useParams();
  const championshipId = params.id as string;
  const [cards, setCards] = useState<CardEvent[]>([]);
  const [rounds, setRounds] = useState<string[]>([]);
  const [rules, setRules] = useState({ yellow_card_suspension_limit: 3, yellow_card_suspension_matches: 1, red_card_suspension_matches: 1, second_yellow_is_red: true });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('by-round');
  const [cardFilter, setCardFilter] = useState<CardFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`/api/championships/${championshipId}/cards`)
      .then(r => r.json())
      .then(data => { setCards(data.cards); setRounds(data.rounds || []); setRules(data.rules); setLoading(false); })
      .catch(() => setLoading(false));
  }, [championshipId]);

  const filtered = useMemo(() => {
    let result = cards;
    if (cardFilter === 'yellow') {
      result = result.filter(c => c.event_type === 'CARTAO_AMARELO');
    } else if (cardFilter === 'red') {
      result = result.filter(c => c.event_type === 'CARTAO_VERMELHO');
    } else if (cardFilter === 'second-yellow') {
      result = result.filter(c => c.event_type === 'SEGUNDO_AMARELO');
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.player_name.toLowerCase().includes(term) ||
        c.team_name.toLowerCase().includes(term) ||
        (c.match_round || '').toLowerCase().includes(term)
      );
    }
    return result;
  }, [cards, cardFilter, searchTerm]);

  const totalYellow = cards.filter(c => c.event_type === 'CARTAO_AMARELO').length;
  const totalSecondYellow = cards.filter(c => c.event_type === 'SEGUNDO_AMARELO').length;
  const totalRedDirect = cards.filter(c => c.event_type === 'CARTAO_VERMELHO').length;

  const byRound = useMemo(() => {
    const map = new Map<string, CardEvent[]>();
    for (const c of filtered) {
      const key = c.match_round || 'Sem rodada';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const byMatch = useMemo(() => {
    const map = new Map<string, CardEvent[]>();
    for (const c of filtered) {
      if (!map.has(c.match_id)) map.set(c.match_id, []);
      map.get(c.match_id)!.push(c);
    }
    return Array.from(map.entries());
  }, [filtered]);

  // Suspension tracking per player per round
  const suspensionData = useMemo(() => {
    if (rounds.length === 0) return { map: new Map<string, PlayerSuspension>(), byRound: new Map<string, string[]>() };

    const roundIndex = new Map<string, number>();
    rounds.forEach((r, i) => roundIndex.set(r, i));

    // Group cards per player, ordered by round
    const playerCards = new Map<string, CardEvent[]>();
    for (const c of cards) {
      if (!playerCards.has(c.player_id)) playerCards.set(c.player_id, []);
      playerCards.get(c.player_id)!.push(c);
    }

    const map = new Map<string, PlayerSuspension>();
    const suspendedByRound = new Map<string, string[]>(); // round -> player_ids

    playerCards.forEach((pCards, playerId) => {
      // Sort by match date
      const sorted = [...pCards].sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());

      let accumYellows = 0;
      let suspendedRounds: string[] = [];
      const history: SuspensionEvent[] = [];

      for (const c of sorted) {
        const cardRoundIdx = roundIndex.get(c.match_round || '') ?? -1;

        if (c.event_type === 'CARTAO_AMARELO') {
          accumYellows++;
          if (accumYellows >= rules.yellow_card_suspension_limit) {
            // Suspended for next N rounds
            for (let i = 1; i <= rules.yellow_card_suspension_matches; i++) {
              const suspRoundIdx = cardRoundIdx + i;
              if (suspRoundIdx < rounds.length) {
                suspendedRounds.push(rounds[suspRoundIdx]);
                const arr = suspendedByRound.get(rounds[suspRoundIdx]) || [];
                arr.push(playerId);
                suspendedByRound.set(rounds[suspRoundIdx], arr);
              }
            }
            history.push({ type: 'yellow_accumulation', round: c.match_round || '', count: accumYellows, suspendedIn: suspendedRounds.slice(-rules.yellow_card_suspension_matches) });
            accumYellows = 0; // Reset after suspension
          }
        } else {
          // Red or second yellow
          for (let i = 1; i <= rules.red_card_suspension_matches; i++) {
            const suspRoundIdx = cardRoundIdx + i;
            if (suspRoundIdx < rounds.length) {
              suspendedRounds.push(rounds[suspRoundIdx]);
              const arr = suspendedByRound.get(rounds[suspRoundIdx]) || [];
              arr.push(playerId);
              suspendedByRound.set(rounds[suspRoundIdx], arr);
            }
          }
          history.push({ type: 'red_card', round: c.match_round || '', suspendedIn: suspendedRounds.slice(-rules.red_card_suspension_matches) });
        }
      }

      // Current status: check if suspended in the last round played or upcoming
      const lastRoundIdx = rounds.length - 1;
      const lastRound = rounds[lastRoundIdx];
      const isSuspendedNow = suspendedRounds.includes(lastRound) || suspendedRounds.some(r => (roundIndex.get(r) ?? -1) >= lastRoundIdx);
      const nextSuspendedRound = suspendedRounds.find(r => (roundIndex.get(r) ?? -1) >= lastRoundIdx);

      map.set(playerId, {
        accumYellows,
        totalSuspensions: history.length,
        suspendedRounds,
        history,
        isSuspendedNow,
        nextSuspendedRound: nextSuspendedRound || null,
        status: isSuspendedNow
          ? `Suspenso (${nextSuspendedRound})`
          : accumYellows > 0
            ? `${accumYellows}/${rules.yellow_card_suspension_limit} amarelos`
            : 'Regular',
      });
    });

    return { map, byRound: suspendedByRound };
  }, [cards, rounds, rules]);

  const totalSuspended = useMemo(() => {
    let count = 0;
    suspensionData.map.forEach(s => { if (s.isSuspendedNow) count++; });
    return count;
  }, [suspensionData]);

  const byPlayer = useMemo(() => {
    const map = new Map<string, { player: CardEvent; yellows: number; reds: number; cards: CardEvent[] }>();
    for (const c of filtered) {
      if (!map.has(c.player_id)) {
        map.set(c.player_id, { player: c, yellows: 0, reds: 0, cards: [] });
      }
      const entry = map.get(c.player_id)!;
      entry.cards.push(c);
      if (c.event_type === 'CARTAO_AMARELO') entry.yellows++;
      else entry.reds++;
    }
    return Array.from(map.values()).sort((a, b) => (b.yellows + b.reds * 3) - (a.yellows + a.reds * 3));
  }, [filtered]);

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const exportXLSX = (mode: 'all' | 'by-round' | 'by-player') => {
    const wb = XLSX.utils.book_new();

    if (mode === 'all' || mode === 'by-round') {
      const rows = filtered.map(c => ({
        'Rodada': c.match_round || '-',
        'Data': formatDate(c.match_date),
        'Jogo': formatMatchLabel(c),
        'Jogador': c.player_name,
        'Nº Camisa': c.shirt_number ?? '-',
        'Time': c.team_name,
        'Tipo Cartao': cardTypeLabel[c.event_type],
        'Minuto': c.minute ?? '-',
        'Tempo': c.half || '-',
        'Obs': c.notes || '',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [
        { wch: 12 }, { wch: 12 }, { wch: 28 }, { wch: 25 },
        { wch: 10 }, { wch: 20 }, { wch: 14 }, { wch: 8 },
        { wch: 8 }, { wch: 20 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Cartoes por Rodada');
    }

    if (mode === 'all' || mode === 'by-player') {
      const rows = byPlayer.map(p => {
        const susp = suspensionData.map.get(p.player.player_id);
        return {
          'Jogador': p.player.player_name,
          'Nº Camisa': p.player.shirt_number ?? '-',
          'Time': p.player.team_name,
          'Amarelos': p.yellows,
          'Vermelhos': p.reds,
          'Total Cartoes': p.yellows + p.reds,
          'Pts Disciplinar': p.yellows + p.reds * 3,
          'Status': susp?.isSuspendedNow ? 'SUSPENSO' : 'Regular',
          'Amarelos Acum.': susp?.accumYellows ?? 0,
          'Suspenso em': susp?.suspendedRounds.join(', ') || '',
        };
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [
        { wch: 25 }, { wch: 10 }, { wch: 20 }, { wch: 10 },
        { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 30 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Resumo por Jogador');
    }

    if (mode === 'all') {
      for (const [round, events] of byRound) {
        const rows = events.map(c => ({
          'Jogo': formatMatchLabel(c),
          'Data': formatDate(c.match_date),
          'Jogador': c.player_name,
          'Nº': c.shirt_number ?? '-',
          'Time': c.team_name,
          'Cartao': cardTypeLabel[c.event_type],
          'Min': c.minute ?? '-',
          'Tempo': c.half || '-',
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        ws['!cols'] = [
          { wch: 28 }, { wch: 12 }, { wch: 25 }, { wch: 6 },
          { wch: 20 }, { wch: 14 }, { wch: 6 }, { wch: 8 },
        ];
        const sheetName = (round || 'Sem rodada').substring(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }
    }

    XLSX.writeFile(wb, `cartoes-campeonato.xlsx`);
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Carregando cartoes...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href={`/admin/campeonatos/${championshipId}/editar`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-yellow-500" />
            <h1 className="text-xl font-bold">Relatorio de Cartoes</h1>
          </div>
        </div>
      </div>

      {/* Legenda explicativa */}
      <div className="mb-6 p-4 rounded-lg bg-[#f8f9fb] border border-border/60">
        <h3 className="text-sm font-bold text-[#1a237e] mb-2">Como funciona</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="inline-block w-4 h-5 rounded-[2px] bg-yellow-400 border border-yellow-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">Cartao Amarelo</p>
              <p>Advertencia. Vale 1 ponto disciplinar. Acumulando o limite definido no campeonato, o jogador e suspenso automaticamente.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="inline-flex w-4 h-5 rounded-[2px] overflow-hidden border border-orange-500 shrink-0 mt-0.5">
              <span className="w-1/2 bg-yellow-400" />
              <span className="w-1/2 bg-red-600" />
            </span>
            <div>
              <p className="font-semibold text-foreground">2o Amarelo (= Vermelho)</p>
              <p>Segundo amarelo na mesma partida. O jogador e expulso e recebe suspensao equivalente a um cartao vermelho. Vale 3 pontos disciplinares.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="inline-block w-4 h-5 rounded-[2px] bg-red-600 border border-red-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">Cartao Vermelho Direto</p>
              <p>Expulsao direta por falta grave. Vale 3 pontos disciplinares. O jogador e suspenso conforme regras do campeonato.</p>
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border/40">
          <div className="flex items-start gap-2">
            <Ban className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground text-xs">Regra de Suspensao deste Campeonato</p>
              <p className="text-xs text-muted-foreground">
                Acumular <strong>{rules.yellow_card_suspension_limit} amarelos</strong> = suspensao de {rules.yellow_card_suspension_matches} jogo(s).
                Vermelho direto ou 2o amarelo = suspensao de {rules.red_card_suspension_matches} jogo(s).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p className="text-2xl font-extrabold text-[#1a237e]">{cards.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="inline-block w-3 h-4 rounded-[2px] bg-yellow-400 border border-yellow-500" />
              <p className="text-xs text-muted-foreground">Amarelos</p>
            </div>
            <p className="text-2xl font-extrabold text-yellow-600">{totalYellow}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="inline-flex w-3 h-4 rounded-[1px] overflow-hidden border border-orange-500">
                <span className="w-1/2 bg-yellow-400" />
                <span className="w-1/2 bg-red-600" />
              </span>
              <p className="text-xs text-muted-foreground">2o Amarelo</p>
            </div>
            <p className="text-2xl font-extrabold text-orange-600">{totalSecondYellow}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="inline-block w-3 h-4 rounded-[2px] bg-red-600 border border-red-700" />
              <p className="text-xs text-muted-foreground">Vermelhos</p>
            </div>
            <p className="text-2xl font-extrabold text-red-600">{totalRedDirect}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Jogos c/ Cartao</p>
            <p className="text-2xl font-extrabold text-muted-foreground">{new Set(cards.map(c => c.match_id)).size}</p>
          </CardContent>
        </Card>
        <Card className={totalSuspended > 0 ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Ban className="h-3.5 w-3.5 text-red-600" />
              <p className="text-xs text-muted-foreground">Suspensos</p>
            </div>
            <p className="text-2xl font-extrabold text-red-700">{totalSuspended}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex rounded-lg border border-border overflow-hidden">
          {([['by-round', 'Por Rodada'], ['by-match', 'Por Jogo'], ['by-player', 'Por Jogador']] as const).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-2 text-xs font-semibold transition-colors ${
                viewMode === mode ? 'bg-[#1a237e] text-white' : 'bg-white text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex rounded-lg border border-border overflow-hidden">
          {([['all', 'Todos'], ['yellow', 'Amarelos'], ['second-yellow', '2o Amarelo'], ['red', 'Vermelhos']] as const).map(([f, label]) => (
            <button
              key={f}
              onClick={() => setCardFilter(f)}
              className={`px-3 py-2 text-xs font-semibold transition-colors ${
                cardFilter === f ? 'bg-[#1a237e] text-white' : 'bg-white text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar jogador, time ou rodada..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1a237e]/20"
          />
        </div>

        <div className="flex gap-2 sm:ml-auto">
          <Button variant="outline" size="sm" onClick={() => exportXLSX('all')} className="gap-1.5">
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            XLSX Completo
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportXLSX(viewMode === 'by-player' ? 'by-player' : 'by-round')} className="gap-1.5">
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            XLSX Visao Atual
          </Button>
        </div>
      </div>

      <Separator className="mb-4" />

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p>Nenhum cartao encontrado com os filtros selecionados.</p>
        </div>
      ) : viewMode === 'by-round' ? (
        <div className="space-y-3">
          {byRound.map(([round, events]) => {
            const isOpen = expandedGroups.has(round) || byRound.length <= 3;
            const yellows = events.filter(c => c.event_type === 'CARTAO_AMARELO').length;
            const reds = events.length - yellows;
            const suspendedInRound = suspensionData.byRound.get(round) || [];
            const suspendedNames = suspendedInRound.map(pid => {
              const c = cards.find(x => x.player_id === pid);
              return c ? `${c.player_name} (${c.team_short_name || c.team_name})` : pid;
            });
            return (
              <Card key={round}>
                <button
                  onClick={() => toggleGroup(round)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-bold text-[#1a237e]">{round}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <span className="w-2.5 h-3 rounded-[1px] bg-yellow-400 inline-block" /> {yellows}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <span className="w-2.5 h-3 rounded-[1px] bg-red-600 inline-block" /> {reds}
                      </Badge>
                      {suspendedNames.length > 0 && (
                        <Badge variant="outline" className="text-[10px] gap-1 border-red-300 text-red-600">
                          <Ban className="h-3 w-3" /> {suspendedNames.length} suspenso(s)
                        </Badge>
                      )}
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {isOpen && (
                  <CardContent className="pt-0 pb-3 px-3">
                    {suspendedNames.length > 0 && (
                      <div className="mb-2 p-2 rounded bg-red-50 border border-red-200">
                        <p className="text-xs font-semibold text-red-700 flex items-center gap-1.5 mb-1">
                          <Ban className="h-3.5 w-3.5" /> Suspensos nesta rodada:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {suspendedNames.map((name, ni) => (
                            <span key={ni} className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">{name}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="rounded-lg overflow-hidden border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50 text-xs">
                            <th className="px-3 py-2 text-left font-semibold">Jogo</th>
                            <th className="px-3 py-2 text-left font-semibold">Data</th>
                            <th className="px-3 py-2 text-left font-semibold">Jogador</th>
                            <th className="px-2 py-2 text-center font-semibold">Nº</th>
                            <th className="px-3 py-2 text-left font-semibold">Time</th>
                            <th className="px-2 py-2 text-center font-semibold">Cartao</th>
                            <th className="px-2 py-2 text-center font-semibold">Min</th>
                          </tr>
                        </thead>
                        <tbody>
                          {events.map(c => (
                            <tr key={c.event_id} className="border-t border-border/50 hover:bg-muted/20">
                              <td className="px-3 py-2 text-xs font-medium">{formatMatchLabel(c)}</td>
                              <td className="px-3 py-2 text-xs text-muted-foreground">{formatDate(c.match_date)}</td>
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-1.5">
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={c.player_photo || ''} />
                                    <AvatarFallback className="text-[8px]">{c.player_name[0]}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs font-semibold">{c.player_name}</span>
                                </div>
                              </td>
                              <td className="px-2 py-2 text-center text-xs text-muted-foreground">{c.shirt_number ?? '-'}</td>
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-1">
                                  <Avatar className="h-4 w-4">
                                    <AvatarImage src={c.team_logo || ''} />
                                    <AvatarFallback className="text-[7px]">{c.team_name[0]}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs">{c.team_short_name || c.team_name}</span>
                                </div>
                              </td>
                              <td className="px-2 py-2 text-center"><CardBadge type={c.event_type} /></td>
                              <td className="px-2 py-2 text-center text-xs text-muted-foreground">
                                {c.minute ? `${c.minute}'` : '-'}{c.half ? ` ${c.half}` : ''}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      ) : viewMode === 'by-match' ? (
        <div className="space-y-3">
          {byMatch.map(([matchId, events]) => {
            const first = events[0];
            const matchLabel = formatMatchLabel(first);
            const isOpen = expandedGroups.has(matchId) || byMatch.length <= 5;
            const yellows = events.filter(c => c.event_type === 'CARTAO_AMARELO').length;
            const reds = events.length - yellows;
            return (
              <Card key={matchId}>
                <button
                  onClick={() => toggleGroup(matchId)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-bold text-[#0d1b2a]">{matchLabel}</span>
                    <span className="text-xs text-muted-foreground">{first.match_round} — {formatDate(first.match_date)}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <span className="w-2.5 h-3 rounded-[1px] bg-yellow-400 inline-block" /> {yellows}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <span className="w-2.5 h-3 rounded-[1px] bg-red-600 inline-block" /> {reds}
                      </Badge>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {isOpen && (
                  <CardContent className="pt-0 pb-3 px-3">
                    <div className="rounded-lg overflow-hidden border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50 text-xs">
                            <th className="px-3 py-2 text-left font-semibold">Jogador</th>
                            <th className="px-2 py-2 text-center font-semibold">Nº</th>
                            <th className="px-3 py-2 text-left font-semibold">Time</th>
                            <th className="px-2 py-2 text-center font-semibold">Cartao</th>
                            <th className="px-2 py-2 text-center font-semibold">Min</th>
                            <th className="px-2 py-2 text-center font-semibold">Tempo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {events.map(c => (
                            <tr key={c.event_id} className="border-t border-border/50 hover:bg-muted/20">
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-1.5">
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={c.player_photo || ''} />
                                    <AvatarFallback className="text-[8px]">{c.player_name[0]}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs font-semibold">{c.player_name}</span>
                                </div>
                              </td>
                              <td className="px-2 py-2 text-center text-xs text-muted-foreground">{c.shirt_number ?? '-'}</td>
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-1">
                                  <Avatar className="h-4 w-4">
                                    <AvatarImage src={c.team_logo || ''} />
                                    <AvatarFallback className="text-[7px]">{c.team_name[0]}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs">{c.team_short_name || c.team_name}</span>
                                </div>
                              </td>
                              <td className="px-2 py-2 text-center"><CardBadge type={c.event_type} /></td>
                              <td className="px-2 py-2 text-center text-xs text-muted-foreground">{c.minute ? `${c.minute}'` : '-'}</td>
                              <td className="px-2 py-2 text-center text-xs text-muted-foreground">{c.half || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0d1b2a] text-white text-xs">
                <th className="px-3 py-2.5 text-left font-semibold w-10">#</th>
                <th className="px-3 py-2.5 text-left font-semibold">Jogador</th>
                <th className="px-2 py-2.5 text-center font-semibold">Nº</th>
                <th className="px-3 py-2.5 text-left font-semibold">Time</th>
                <th className="px-2 py-2.5 text-center font-semibold">
                  <span className="inline-block w-3 h-4 rounded-[1px] bg-yellow-400 border border-yellow-500" />
                </th>
                <th className="px-2 py-2.5 text-center font-semibold">
                  <span className="inline-block w-3 h-4 rounded-[1px] bg-red-600 border border-red-700" />
                </th>
                <th className="px-2 py-2.5 text-center font-semibold">Total</th>
                <th className="px-2 py-2.5 text-center font-semibold">Pts</th>
              </tr>
            </thead>
            <tbody>
              {byPlayer.map((p, idx) => {
                const isOpen = expandedGroups.has(p.player.player_id);
                const susp = suspensionData.map.get(p.player.player_id);
                const isSuspended = susp?.isSuspendedNow ?? false;
                return (
                  <Fragment key={p.player.player_id}>
                    <tr
                      className={`border-t border-border/50 hover:bg-muted/30 transition-colors cursor-pointer ${isSuspended ? 'bg-red-50' : ''}`}
                      onClick={() => toggleGroup(p.player.player_id)}
                    >
                      <td className="px-3 py-2.5 text-muted-foreground font-medium">{idx + 1}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={p.player.player_photo || ''} />
                            <AvatarFallback className="text-[9px]">{p.player.player_name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-[#0d1b2a]">{p.player.player_name}</span>
                          {isSuspended ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-semibold whitespace-nowrap" title={susp?.status}>
                              <Ban className="h-3 w-3" /> {susp?.status}
                            </span>
                          ) : susp && susp.accumYellows > 0 ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium whitespace-nowrap">
                              {susp.accumYellows}/{rules.yellow_card_suspension_limit}
                            </span>
                          ) : null}
                          {isOpen ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-center text-xs text-muted-foreground">{p.player.shirt_number ?? '-'}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={p.player.team_logo || ''} />
                            <AvatarFallback className="text-[8px]">{p.player.team_name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs">{p.player.team_name}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <span className="inline-flex items-center justify-center h-6 min-w-7 rounded-full bg-yellow-400 text-xs font-bold text-gray-800">
                          {p.yellows}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <span className={`inline-flex items-center justify-center h-6 min-w-7 rounded-full text-xs font-bold ${p.reds > 0 ? 'bg-red-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                          {p.reds}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-center font-bold">{p.yellows + p.reds}</td>
                      <td className="px-2 py-2.5 text-center font-bold text-[#1a237e]">{p.yellows + p.reds * 3}</td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={8} className="bg-muted/20 px-6 py-2">
                          {susp && (susp.isSuspendedNow || susp.suspendedRounds.length > 0 || susp.accumYellows > 0) && (
                            <div className={`flex items-start gap-2 mb-2 px-2 py-1.5 rounded ${susp.isSuspendedNow ? 'bg-red-100 text-red-700' : susp.accumYellows > 0 ? 'bg-amber-50 text-amber-700' : 'bg-muted text-muted-foreground'}`}>
                              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                              <div className="text-xs">
                                <p className="font-semibold">{susp.status}</p>
                                {susp.suspendedRounds.length > 0 && (
                                  <p>Suspenso em: {susp.suspendedRounds.join(', ')}</p>
                                )}
                                {susp.accumYellows > 0 && !susp.isSuspendedNow && (
                                  <p>Falta(m) {rules.yellow_card_suspension_limit - susp.accumYellows} amarelo(s) para suspensao</p>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="text-xs space-y-1">
                            {p.cards.map((c, ci) => {
                              const isLimitCard = c.event_type === 'CARTAO_AMARELO' &&
                                (ci + 1) % rules.yellow_card_suspension_limit === 0 &&
                                p.cards.filter((x, xi) => xi <= ci && x.event_type === 'CARTAO_AMARELO').length % rules.yellow_card_suspension_limit === 0;
                              return (
                                <div key={c.event_id} className={`flex items-center gap-3 py-0.5 ${isLimitCard ? 'bg-red-50 rounded px-1 -mx-1' : ''}`}>
                                  <CardBadge type={c.event_type} />
                                  <span className="text-muted-foreground w-20">{c.match_round || '-'}</span>
                                  <span className="font-medium w-48">{formatMatchLabel(c)}</span>
                                  <span className="text-muted-foreground">{formatDate(c.match_date)}</span>
                                  <span className="text-muted-foreground">{c.minute ? `${c.minute}' ${c.half || ''}` : '-'}</span>
                                  {isLimitCard && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-600 text-white font-bold">SUSPENSAO</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
