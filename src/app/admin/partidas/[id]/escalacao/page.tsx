'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Save, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { Match, MatchLineup } from '@/types';
import { POSITIONS } from '@/lib/utils';
import PageHeader from '@/components/admin/PageHeader';

interface PlayerReg {
  player_id: string;
  player_name: string;
  player_photo: string | null;
  team_id: string;
  team_name: string;
  shirt_number: number | null;
  position: string;
}

interface LineupEntry {
  player_id: string;
  player_name: string;
  player_photo: string | null;
  position: string;
  shirt_number: number | null;
  is_starter: boolean;
}

export default function EscalacaoPartidaPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [match, setMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<PlayerReg[]>([]);
  const [homeLineup, setHomeLineup] = useState<LineupEntry[]>([]);
  const [awayLineup, setAwayLineup] = useState<LineupEntry[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!authLoading && !isAdmin) router.push('/admin/login'); }, [isAdmin, authLoading, router]);

  const loadData = useCallback(async () => {
    const matchRes = await fetch(`/api/matches/${params.id}`);
    if (!matchRes.ok) return;
    const m = await matchRes.json();
    setMatch(m);

    const [regsRes, lineupsRes] = await Promise.all([
      fetch(`/api/championships/${m.championship_id}/registrations`),
      fetch(`/api/matches/${params.id}/lineups`),
    ]);

    if (regsRes.ok) {
      const regs = await regsRes.json();
      const filtered = regs.filter((r: any) => r.team_id === m.home_team_id || r.team_id === m.away_team_id);
      setPlayers(filtered.map((r: any) => ({
        player_id: r.player_id, player_name: r.player_name, player_photo: r.player_photo || null,
        team_id: r.team_id, team_name: r.team_name, shirt_number: r.shirt_number, position: r.player_position || '',
      })));
    }

    if (lineupsRes.ok) {
      const lineups = await lineupsRes.json();
      const mapLineup = (arr: MatchLineup[]): LineupEntry[] =>
        arr.map(l => ({ player_id: l.player_id, player_name: l.player_name || '', player_photo: l.player_photo || null, position: l.position || '', shirt_number: l.shirt_number, is_starter: l.is_starter }));
      setHomeLineup(mapLineup(lineups.home || []));
      setAwayLineup(mapLineup(lineups.away || []));
    }
  }, [params.id]);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  const addPlayerToLineup = (playerId: string, side: 'home' | 'away') => {
    const teamPlayers = side === 'home' ? players.filter(p => p.team_id === match?.home_team_id) : players.filter(p => p.team_id === match?.away_team_id);
    const player = teamPlayers.find(p => p.player_id === playerId);
    if (!player) return;
    const entry: LineupEntry = { player_id: player.player_id, player_name: player.player_name, player_photo: player.player_photo, position: player.position, shirt_number: player.shirt_number, is_starter: true };
    if (side === 'home') {
      if (homeLineup.find(e => e.player_id === player.player_id)) return;
      setHomeLineup(prev => [...prev, entry]);
    } else {
      if (awayLineup.find(e => e.player_id === player.player_id)) return;
      setAwayLineup(prev => [...prev, entry]);
    }
  };

  const removeFromLineup = (playerId: string, side: 'home' | 'away') => {
    if (side === 'home') setHomeLineup(prev => prev.filter(e => e.player_id !== playerId));
    else setAwayLineup(prev => prev.filter(e => e.player_id !== playerId));
  };

  const updateLineupEntry = (playerId: string, side: 'home' | 'away', field: string, value: any) => {
    const updater = (prev: LineupEntry[]) => prev.map(e => e.player_id === playerId ? { ...e, [field]: value } : e);
    if (side === 'home') setHomeLineup(updater);
    else setAwayLineup(updater);
  };

  const handleSave = async (side: 'home' | 'away') => {
    setError(''); setSuccess(''); setSaving(true);
    const teamId = side === 'home' ? match?.home_team_id : match?.away_team_id;
    const lineup = side === 'home' ? homeLineup : awayLineup;
    try {
      const res = await fetch(`/api/matches/${params.id}/lineups`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: teamId, players: lineup.map(e => ({ player_id: e.player_id, position: e.position || null, shirt_number: e.shirt_number, is_starter: e.is_starter })) }),
      });
      if (res.ok) setSuccess(`Escalacao ${side === 'home' ? 'mandante' : 'visitante'} salva!`);
      else { const d = await res.json(); setError(d.error || 'Erro ao salvar escalacao'); }
    } catch { setError('Erro ao salvar escalacao'); }
    finally { setSaving(false); }
  };

  const homePlayers = players.filter(p => p.team_id === match?.home_team_id);
  const awayPlayers = players.filter(p => p.team_id === match?.away_team_id);

  const renderTeamLineup = (teamName: string, teamPlayers: PlayerReg[], lineup: LineupEntry[], side: 'home' | 'away') => {
    const starterCount = lineup.filter(e => e.is_starter).length;
    const availablePlayers = teamPlayers.filter(p => !lineup.find(e => e.player_id === p.player_id));

    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="font-semibold">{teamName}</p>
              <p className="text-xs text-muted-foreground">Titulares: {starterCount}/11 | Total: {lineup.length}</p>
            </div>
            <Button size="sm" onClick={() => handleSave(side)} disabled={saving}><Save className="h-4 w-4 mr-1" />Salvar</Button>
          </div>

          {availablePlayers.length > 0 && (
            <div className="mb-3">
              <Label>Adicionar jogador</Label>
              <Select value="" onValueChange={(v) => addPlayerToLineup(v, side)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {availablePlayers.map(p => (
                    <SelectItem key={p.player_id} value={p.player_id}>
                      {p.shirt_number ? `${p.shirt_number} - ` : ''}{p.player_name} ({p.position})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Titular</TableHead>
                <TableHead>Jogador</TableHead>
                <TableHead>Posicao</TableHead>
                <TableHead className="hidden md:table-cell">Camisa</TableHead>
                <TableHead className="text-right">Acao</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineup.map((entry) => (
                <TableRow key={entry.player_id}>
                  <TableCell>
                    <Checkbox
                      checked={entry.is_starter}
                      onCheckedChange={(checked) => updateLineupEntry(entry.player_id, side, 'is_starter', !!checked)}
                      disabled={!entry.is_starter && starterCount >= 11}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7 text-xs">
                        <AvatarImage src={entry.player_photo || ''} />
                        <AvatarFallback>{entry.player_name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{entry.player_name}</span>
                      {entry.is_starter && <Badge variant="outline" className="hidden md:inline-flex text-xs">Titular</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select value={entry.position || 'none'} onValueChange={(v) => updateLineupEntry(entry.player_id, side, 'position', v === 'none' ? '' : v)}>
                      <SelectTrigger className="h-8 min-w-[90px] md:min-w-[120px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-</SelectItem>
                        {POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Input
                      type="number"
                      className="h-8 w-[55px] md:w-[70px]"
                      value={entry.shirt_number ?? ''}
                      onChange={(e) => updateLineupEntry(entry.player_id, side, 'shirt_number', e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <button onClick={() => removeFromLineup(entry.player_id, side)} className="p-1.5 rounded hover:bg-accent text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </TableCell>
                </TableRow>
              ))}
              {lineup.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Nenhum jogador na escalacao</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  if (authLoading || !isAdmin || !match) return null;

  return (
    <div>
      <PageHeader title="Escalacao" backHref="/admin/partidas">
        <p className="text-sm text-muted-foreground">{match.home_team_name} {match.home_score ?? '-'} x {match.away_score ?? '-'} {match.away_team_name}</p>
      </PageHeader>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert className="mb-4 border-green-200 bg-green-50 text-green-800"><AlertDescription>{success}</AlertDescription></Alert>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderTeamLineup(match.home_team_name || 'Mandante', homePlayers, homeLineup, 'home')}
        {renderTeamLineup(match.away_team_name || 'Visitante', awayPlayers, awayLineup, 'away')}
      </div>
    </div>
  );
}
