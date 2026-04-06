'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trophy, Swords, Crown, Loader2, CheckCircle2, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';

interface TeamInfo {
  team_id: string;
  team_name: string;
  short_name: string | null;
  position: number;
}

interface MatchInfo {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_team_name: string;
  away_team_name: string;
  home_short: string | null;
  away_short: string | null;
  home_logo: string | null;
  away_logo: string | null;
  home_score: number | null;
  away_score: number | null;
  match_date: string | null;
  match_round: string;
  status: string;
}

interface BracketData {
  standings: TeamInfo[];
  semifinals: {
    match1: { ida: MatchInfo | null; volta: MatchInfo | null; winner: string | null };
    match2: { ida: MatchInfo | null; volta: MatchInfo | null; winner: string | null };
  };
  finals: {
    ida: MatchInfo | null;
    volta: MatchInfo | null;
    champion: string | null;
  };
  hasMatches: boolean;
}

function formatDate(d: string | null) {
  if (!d) return 'A definir';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function MatchCard({ match, label }: { match: MatchInfo | null; label: string }) {
  if (!match) return (
    <div className="p-2 rounded border border-dashed border-border/60 text-center text-xs text-muted-foreground">
      {label} - A definir
    </div>
  );

  const finished = match.status === 'Finalizada';
  return (
    <div className={cn('p-2 rounded border text-xs', finished ? 'border-green-200 bg-green-50/50' : 'border-border')}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
        <span className="text-[10px] text-muted-foreground">{formatDate(match.match_date)}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Avatar className="h-5 w-5 shrink-0">
            <AvatarImage src={match.home_logo || ''} />
            <AvatarFallback className="text-[7px]">{(match.home_short || match.home_team_name)[0]}</AvatarFallback>
          </Avatar>
          <span className="font-semibold truncate">{match.home_short || match.home_team_name}</span>
        </div>
        <div className="px-2 font-bold text-sm">
          {finished ? `${match.home_score} x ${match.away_score}` : 'vs'}
        </div>
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span className="font-semibold truncate text-right">{match.away_short || match.away_team_name}</span>
          <Avatar className="h-5 w-5 shrink-0">
            <AvatarImage src={match.away_logo || ''} />
            <AvatarFallback className="text-[7px]">{(match.away_short || match.away_team_name)[0]}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}

function TeamBadge({ match, teamId, isWinner }: { match: MatchInfo | null; teamId: string | null; isWinner: boolean }) {
  if (!match || !teamId) return null;
  const isHome = match.home_team_id === teamId;
  const name = isHome ? (match.home_short || match.home_team_name) : (match.away_short || match.away_team_name);
  const logo = isHome ? match.home_logo : match.away_logo;

  return (
    <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border', isWinner ? 'border-green-300 bg-green-50' : 'border-border')}>
      <Avatar className="h-6 w-6">
        <AvatarImage src={logo || ''} />
        <AvatarFallback className="text-[8px]">{name[0]}</AvatarFallback>
      </Avatar>
      <span className="font-bold text-sm">{name}</span>
      {isWinner && <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />}
    </div>
  );
}

export default function MataMataPage() {
  const params = useParams();
  const championshipId = params.id as string;
  const { isAdmin } = useAuth();
  const [data, setData] = useState<BracketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [semiDate1, setSemiDate1] = useState('');
  const [semiDate2, setSemiDate2] = useState('');
  const [finalDate1, setFinalDate1] = useState('');
  const [finalDate2, setFinalDate2] = useState('');

  const loadData = useCallback(async () => {
    const res = await fetch(`/api/championships/${championshipId}/bracket`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [championshipId]);

  useEffect(() => { loadData(); }, [loadData]);

  const generatePhase = async (phase: 'semifinals' | 'finals', d1: string, d2: string) => {
    setGenerating(true);
    const res = await fetch(`/api/championships/${championshipId}/bracket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phase,
        date1: d1 ? new Date(d1 + 'T15:00:00-03:00').toISOString() : null,
        date2: d2 ? new Date(d2 + 'T15:00:00-03:00').toISOString() : null,
      }),
    });
    const result = await res.json();
    if (res.ok) {
      toast.success(result.message);
      loadData();
    } else {
      toast.error(result.error);
    }
    setGenerating(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!data) return null;

  const { standings, semifinals, finals } = data;
  const hasSemis = semifinals.match1.ida !== null;
  const semisComplete = semifinals.match1.winner !== null && semifinals.match2.winner !== null;
  const hasFinals = finals.ida !== null;
  const hasChampion = finals.champion !== null;

  // Find team names for winners
  const getTeamName = (teamId: string | null) => {
    if (!teamId) return null;
    const allMatches = [semifinals.match1.ida, semifinals.match1.volta, semifinals.match2.ida, semifinals.match2.volta, finals.ida, finals.volta].filter(Boolean) as MatchInfo[];
    const m = allMatches.find(m => m.home_team_id === teamId || m.away_team_id === teamId);
    if (!m) return null;
    return m.home_team_id === teamId ? (m.home_short || m.home_team_name) : (m.away_short || m.away_team_name);
  };

  const getTeamLogo = (teamId: string | null) => {
    if (!teamId) return null;
    const allMatches = [semifinals.match1.ida, semifinals.match1.volta, semifinals.match2.ida, semifinals.match2.volta, finals.ida, finals.volta].filter(Boolean) as MatchInfo[];
    const m = allMatches.find(m => m.home_team_id === teamId || m.away_team_id === teamId);
    if (!m) return null;
    return m.home_team_id === teamId ? m.home_logo : m.away_logo;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href={`/admin/campeonatos/${championshipId}/editar`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div className="flex items-center gap-2">
            <Swords className="h-6 w-6 text-[#1a237e]" />
            <h1 className="text-xl font-bold">Mata-Mata</h1>
          </div>
        </div>
      </div>

      {/* Champion Banner */}
      {hasChampion && (
        <Card className="mb-6 border-yellow-300 bg-gradient-to-r from-yellow-50 to-amber-50">
          <CardContent className="p-4 flex items-center justify-center gap-3">
            <Crown className="h-8 w-8 text-yellow-500" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-medium">CAMPEAO</p>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={getTeamLogo(finals.champion) || ''} />
                  <AvatarFallback>{(getTeamName(finals.champion) || '?')[0]}</AvatarFallback>
                </Avatar>
                <span className="text-xl font-extrabold text-[#1a237e]">{getTeamName(finals.champion)}</span>
              </div>
            </div>
            <Trophy className="h-8 w-8 text-yellow-500" />
          </CardContent>
        </Card>
      )}

      {/* Classificados */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <h3 className="text-sm font-bold text-[#1a237e] mb-3 flex items-center gap-1.5">
            <Trophy className="h-4 w-4" /> Classificados (Top 4 da 1a fase)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {standings.map((t, i) => (
              <div key={t.team_id} className={cn(
                'flex items-center gap-2 p-2 rounded-lg border',
                i === 0 ? 'border-yellow-300 bg-yellow-50' : i === 1 ? 'border-gray-300 bg-gray-50' : i === 2 ? 'border-orange-300 bg-orange-50' : 'border-border'
              )}>
                <span className="text-lg font-extrabold text-muted-foreground w-6 text-center">{i + 1}</span>
                <span className="font-semibold text-sm truncate">{t.short_name || t.team_name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bracket Visual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Semifinals */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#1a237e] flex items-center gap-1.5">
            <Swords className="h-4 w-4" /> Semifinais
          </h3>

          {/* Semi 1 */}
          <Card>
            <CardContent className="p-3">
              <p className="text-xs font-bold text-muted-foreground mb-2">
                {standings[0]?.short_name || '1o'} x {standings[3]?.short_name || '4o'}
              </p>
              <div className="space-y-2">
                <MatchCard match={semifinals.match1.ida} label="Ida" />
                <MatchCard match={semifinals.match1.volta} label="Volta" />
              </div>
              {semifinals.match1.winner && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-green-700 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Classificado: {getTeamName(semifinals.match1.winner)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Semi 2 */}
          <Card>
            <CardContent className="p-3">
              <p className="text-xs font-bold text-muted-foreground mb-2">
                {standings[1]?.short_name || '2o'} x {standings[2]?.short_name || '3o'}
              </p>
              <div className="space-y-2">
                <MatchCard match={semifinals.match2.ida} label="Ida" />
                <MatchCard match={semifinals.match2.volta} label="Volta" />
              </div>
              {semifinals.match2.winner && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-green-700 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Classificado: {getTeamName(semifinals.match2.winner)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Finals */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#1a237e] flex items-center gap-1.5">
            <Trophy className="h-4 w-4" /> Final
          </h3>
          <Card>
            <CardContent className="p-3">
              <div className="space-y-2">
                <MatchCard match={finals.ida} label="Ida" />
                <MatchCard match={finals.volta} label="Volta" />
              </div>
              {hasChampion && (
                <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-yellow-700">
                  <Crown className="h-3.5 w-3.5" />
                  Campeao: {getTeamName(finals.champion)}
                </div>
              )}
              {!hasFinals && semisComplete && (
                <div className="mt-2 text-xs text-muted-foreground text-center py-2">
                  <Clock className="h-4 w-4 mx-auto mb-1" />
                  Aguardando geracao da final
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#1a237e] flex items-center gap-1.5">
            <Zap className="h-4 w-4" /> Acoes
          </h3>

          {/* Generate Semifinals */}
          {!hasSemis && (
            <Card>
              <CardContent className="p-3 space-y-3">
                <p className="text-xs font-semibold">Gerar Semifinais</p>
                <p className="text-[11px] text-muted-foreground">1o x 4o e 2o x 3o (ida e volta)</p>
                <div>
                  <Label className="text-xs">Data Ida</Label>
                  <Input type="date" value={semiDate1} onChange={e => setSemiDate1(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Data Volta</Label>
                  <Input type="date" value={semiDate2} onChange={e => setSemiDate2(e.target.value)} />
                </div>
                <Button className="w-full" size="sm" disabled={generating} onClick={() => generatePhase('semifinals', semiDate1, semiDate2)}>
                  {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Swords className="h-4 w-4 mr-1" />}
                  Gerar Semifinais
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Semifinal status */}
          {hasSemis && !semisComplete && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-3">
                <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> Semifinais em andamento
                </p>
                <p className="text-[11px] text-amber-600 mt-1">Finalize as 4 partidas para gerar a final automaticamente.</p>
              </CardContent>
            </Card>
          )}

          {/* Generate Finals */}
          {semisComplete && !hasFinals && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-3 space-y-3">
                <p className="text-xs font-semibold text-green-700 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Semifinais concluidas!
                </p>
                <p className="text-[11px] text-green-600">
                  {getTeamName(semifinals.match1.winner)} x {getTeamName(semifinals.match2.winner)}
                </p>
                <div>
                  <Label className="text-xs">Data Ida</Label>
                  <Input type="date" value={finalDate1} onChange={e => setFinalDate1(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Data Volta</Label>
                  <Input type="date" value={finalDate2} onChange={e => setFinalDate2(e.target.value)} />
                </div>
                <Button className="w-full" size="sm" disabled={generating} onClick={() => generatePhase('finals', finalDate1, finalDate2)}>
                  {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trophy className="h-4 w-4 mr-1" />}
                  Gerar Final
                </Button>
              </CardContent>
            </Card>
          )}

          {hasFinals && !hasChampion && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-3">
                <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> Final em andamento
                </p>
                <p className="text-[11px] text-amber-600 mt-1">Finalize as partidas da final para definir o campeao.</p>
              </CardContent>
            </Card>
          )}

          {hasChampion && (
            <Card className="border-yellow-300 bg-yellow-50">
              <CardContent className="p-3">
                <p className="text-xs font-bold text-yellow-700 flex items-center gap-1.5">
                  <Crown className="h-4 w-4" /> Campeonato encerrado!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
