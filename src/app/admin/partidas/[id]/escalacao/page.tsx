'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Save, Trash2, UserPlus, Users, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
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

  const togglePlayer = (player: PlayerReg, side: 'home' | 'away') => {
    const lineup = side === 'home' ? homeLineup : awayLineup;
    const setLineup = side === 'home' ? setHomeLineup : setAwayLineup;
    const exists = lineup.find(e => e.player_id === player.player_id);

    if (exists) {
      setLineup(prev => prev.filter(e => e.player_id !== player.player_id));
    } else {
      const entry: LineupEntry = {
        player_id: player.player_id,
        player_name: player.player_name,
        player_photo: player.player_photo,
        position: player.position,
        shirt_number: player.shirt_number,
        is_starter: true,
      };
      setLineup(prev => [...prev, entry]);
    }
  };

  const selectAll = (teamPlayers: PlayerReg[], lineup: LineupEntry[], setLineup: React.Dispatch<React.SetStateAction<LineupEntry[]>>) => {
    const notInLineup = teamPlayers.filter(p => !lineup.find(e => e.player_id === p.player_id));
    if (notInLineup.length === 0) {
      // All selected, deselect all
      setLineup([]);
    } else {
      const newEntries = notInLineup.map(p => ({
        player_id: p.player_id,
        player_name: p.player_name,
        player_photo: p.player_photo,
        position: p.position,
        shirt_number: p.shirt_number,
        is_starter: true,
      }));
      setLineup(prev => [...prev, ...newEntries]);
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
    const setLineup = side === 'home' ? setHomeLineup : setAwayLineup;
    const allSelected = teamPlayers.length > 0 && teamPlayers.every(p => lineup.find(e => e.player_id === p.player_id));

    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="font-semibold">{teamName}</p>
              <p className="text-xs text-muted-foreground">
                Titulares: {starterCount}/11 | Total: {lineup.length}/{teamPlayers.length}
              </p>
            </div>
            <Button size="sm" onClick={() => handleSave(side)} disabled={saving}>
              <Save className="h-4 w-4 mr-1" />Salvar
            </Button>
          </div>

          {/* Player selection with checkboxes */}
          <div className="mb-4 border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between bg-muted/50 px-3 py-2 border-b">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Selecionar jogadores</span>
              </div>
              <button
                onClick={() => selectAll(teamPlayers, lineup, setLineup)}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
            </div>
            <div className="max-h-[280px] overflow-y-auto divide-y divide-border/50">
              {teamPlayers.map(player => {
                const isSelected = !!lineup.find(e => e.player_id === player.player_id);
                return (
                  <label
                    key={player.player_id}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors hover:bg-accent/50 ${isSelected ? 'bg-primary/5' : ''}`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => togglePlayer(player, side)}
                    />
                    <Avatar className="h-7 w-7 text-xs">
                      <AvatarImage src={player.player_photo || ''} />
                      <AvatarFallback>{player.player_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{player.player_name}</span>
                      <span className="text-xs text-muted-foreground ml-1.5">({player.position || '-'})</span>
                    </div>
                    {player.shirt_number && (
                      <Badge variant="outline" className="text-[10px] tabular-nums">{player.shirt_number}</Badge>
                    )}
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </label>
                );
              })}
              {teamPlayers.length === 0 && (
                <p className="text-center py-4 text-sm text-muted-foreground">Nenhum jogador inscrito</p>
              )}
            </div>
          </div>

          {/* Selected lineup table */}
          {lineup.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Escalacao ({lineup.length} jogadores)</span>
              </div>
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
                </TableBody>
              </Table>
            </>
          )}
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
