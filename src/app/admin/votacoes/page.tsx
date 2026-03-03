'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Vote, Trophy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { Match, Championship, VoteResult } from '@/types';
import { formatDateTime } from '@/lib/utils';
import PageHeader from '@/components/admin/PageHeader';
import StatusBadge from '@/components/admin/StatusBadge';

interface MatchWithVoting extends Match {
  votingStatus?: {
    isOpen: boolean;
    deadline: string | null;
    totalVotes: number;
    winner: VoteResult | null;
  };
}

export default function AdminVotacoesPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<MatchWithVoting[]>([]);
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [championshipFilter, setChampionshipFilter] = useState('all');
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [voteResults, setVoteResults] = useState<VoteResult[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deadline, setDeadline] = useState('');

  useEffect(() => { if (!loading && !isAdmin) router.push('/admin/login'); }, [isAdmin, loading, router]);

  useEffect(() => {
    fetch('/api/championships?all=true').then(r => r.json()).then(setChampionships).catch(() => {});
  }, []);

  const loadMatches = useCallback(async () => {
    const params = new URLSearchParams({ page: '1', limit: '50' });
    if (championshipFilter && championshipFilter !== 'all') params.set('championship_id', championshipFilter);
    const res = await fetch(`/api/matches?${params}`);
    if (!res.ok) return;
    const data = await res.json();

    const matchesWithVoting: MatchWithVoting[] = [];
    for (const match of data.data) {
      try {
        const vRes = await fetch(`/api/votes?matchId=${match.id}`);
        if (vRes.ok) {
          const vData = await vRes.json();
          matchesWithVoting.push({ ...match, votingStatus: vData.status });
        } else {
          matchesWithVoting.push(match);
        }
      } catch {
        matchesWithVoting.push(match);
      }
    }
    setMatches(matchesWithVoting);
  }, [championshipFilter]);

  useEffect(() => { if (user) loadMatches(); }, [user, loadMatches]);

  const loadVoteResults = async (matchId: string) => {
    setSelectedMatch(matchId);
    const res = await fetch(`/api/votes?matchId=${matchId}`);
    if (res.ok) {
      const data = await res.json();
      setVoteResults(data.results || []);
    }
  };

  const handleToggleVoting = async (matchId: string, currentOpen: boolean) => {
    setError(''); setSuccess('');
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    const body: any = { ...match, voting_open: !currentOpen };
    if (!currentOpen && deadline) body.voting_deadline = deadline;
    const res = await fetch(`/api/matches/${matchId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) { setSuccess(!currentOpen ? 'Votacao aberta!' : 'Votacao encerrada!'); loadMatches(); }
    else { setError('Erro ao alterar votacao'); }
  };

  const handleSetDeadline = async (matchId: string) => {
    setError(''); setSuccess('');
    if (!deadline) { setError('Defina um prazo'); return; }
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    const res = await fetch(`/api/matches/${matchId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...match, voting_deadline: deadline }) });
    if (res.ok) { setSuccess('Prazo definido!'); loadMatches(); }
    else { setError('Erro ao definir prazo'); }
  };

  if (loading || !isAdmin) return null;

  return (
    <div>
      <PageHeader title="Votacoes" />

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert className="mb-4 border-green-200 bg-green-50 text-green-800"><AlertDescription>{success}</AlertDescription></Alert>}

      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <Select value={championshipFilter} onValueChange={setChampionshipFilter}>
          <SelectTrigger className="w-full md:w-[300px]">
            <SelectValue placeholder="Campeonato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {championships.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.year})</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="w-full md:w-auto">
          <label className="text-sm text-muted-foreground block mb-1">Prazo para votacao</label>
          <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full md:w-[250px]" />
        </div>
      </div>

      <Card className="mb-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partida</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Votos</TableHead>
              <TableHead className="hidden md:table-cell">Vencedor</TableHead>
              <TableHead className="hidden md:table-cell">Prazo</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((match) => {
              const vs = match.votingStatus;
              return (
                <TableRow key={match.id} className={`cursor-pointer ${selectedMatch === match.id ? 'bg-accent' : ''}`} onClick={() => loadVoteResults(match.id)}>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={match.home_team_logo || ''} />
                        <AvatarFallback className="text-[10px]">{match.home_team_short?.[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-sm">{match.home_team_short || match.home_team_name} x {match.away_team_short || match.away_team_name}</span>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={match.away_team_logo || ''} />
                        <AvatarFallback className="text-[10px]">{match.away_team_short?.[0]}</AvatarFallback>
                      </Avatar>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={vs?.isOpen ? 'Aberta' : 'Fechada'} variant={vs?.isOpen ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell>{vs?.totalVotes || 0}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {vs?.winner ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={vs.winner.player_photo || ''} />
                          <AvatarFallback className="text-[10px]">{vs.winner.player_name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{vs.winner.player_name}</span>
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{vs?.deadline ? formatDateTime(vs.deadline) : '-'}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1 justify-end flex-col md:flex-row">
                      <Button size="sm" variant={vs?.isOpen ? 'outline' : 'default'} className={vs?.isOpen ? 'text-destructive border-destructive' : 'bg-green-600 hover:bg-green-700'}
                        onClick={() => handleToggleVoting(match.id, vs?.isOpen || false)}>
                        {vs?.isOpen ? 'Fechar' : 'Abrir'}
                      </Button>
                      {deadline && (
                        <Button size="sm" variant="outline" onClick={() => handleSetDeadline(match.id)}>
                          Definir Prazo
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {matches.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma partida encontrada</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {selectedMatch && voteResults.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Resultados da Votacao</h3>
            {voteResults.map((result, index) => (
              <div key={result.player_id} className="mb-4">
                <div className="flex items-center gap-3 mb-1">
                  {index === 0 && <Trophy className="h-5 w-5 text-yellow-500" />}
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={result.player_photo || ''} />
                    <AvatarFallback className="text-xs">{result.player_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <span className="text-sm font-semibold">{result.player_name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{result.team_name}</span>
                  </div>
                  <span className="text-sm font-semibold">{result.votes} votos ({result.percentage}%)</span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${index === 0 ? 'bg-yellow-500' : 'bg-primary'}`}
                    style={{ width: `${result.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {selectedMatch && voteResults.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Nenhum voto registrado para esta partida</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
