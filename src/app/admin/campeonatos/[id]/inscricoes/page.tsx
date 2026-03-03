'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { UsersRound, UserPlus, Trash2, ArrowLeftRight } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/admin/PageHeader';

export default function InscricoesPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [championship, setChampionship] = useState<any>(null);
  const [enrolledTeams, setEnrolledTeams] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog states
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [playerDialogOpen, setPlayerDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [selectedPlayerTeam, setSelectedPlayerTeam] = useState('');

  // Swap team dialog
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [swapRegistration, setSwapRegistration] = useState<any>(null);
  const [swapNewTeam, setSwapNewTeam] = useState('');

  useEffect(() => { if (!authLoading && !isAdmin) router.push('/admin/login'); }, [isAdmin, authLoading, router]);

  const loadData = useCallback(async () => {
    const [champRes, teamsRes, regsRes, allTeamsRes, allPlayersRes] = await Promise.all([
      fetch(`/api/championships/${params.id}`),
      fetch(`/api/championships/${params.id}/registrations?type=teams`),
      fetch(`/api/championships/${params.id}/registrations`),
      fetch('/api/teams?all=true'),
      fetch('/api/players?all=true'),
    ]);
    if (champRes.ok) setChampionship(await champRes.json());
    if (teamsRes.ok) setEnrolledTeams(await teamsRes.json());
    if (regsRes.ok) setRegistrations(await regsRes.json());
    if (allTeamsRes.ok) setAllTeams(await allTeamsRes.json());
    if (allPlayersRes.ok) { const d = await allPlayersRes.json(); setAllPlayers(d.data || []); }
  }, [params.id]);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  const enrollTeam = async () => {
    setError(''); setSuccess('');
    const res = await fetch(`/api/championships/${params.id}/registrations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'team', team_id: selectedTeam }) });
    if (res.ok) { setSuccess('Time inscrito!'); setTeamDialogOpen(false); setSelectedTeam(''); loadData(); }
    else { const d = await res.json(); setError(d.error); }
  };

  const registerPlayer = async () => {
    setError(''); setSuccess('');
    const res = await fetch(`/api/championships/${params.id}/registrations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ player_id: selectedPlayer, team_id: selectedPlayerTeam }) });
    if (res.ok) { setSuccess('Jogador inscrito (BID gerado)!'); setPlayerDialogOpen(false); setSelectedPlayer(''); setSelectedPlayerTeam(''); loadData(); }
    else { const d = await res.json(); setError(d.error); }
  };

  const removeTeamEnrollment = async (teamId: string, name: string) => {
    if (!confirm(`Remover time "${name}" do campeonato?`)) return;
    await fetch(`/api/championships/${params.id}/registrations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'remove_team', team_id: teamId }) });
    loadData();
  };

  const removePlayerRegistration = async (registrationId: string, playerName: string) => {
    if (!confirm(`Remover inscrição de "${playerName}"?`)) return;
    setError(''); setSuccess('');
    const res = await fetch(`/api/championships/${params.id}/registrations`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ registration_id: registrationId }) });
    if (res.ok) { setSuccess('Inscrição removida!'); loadData(); }
    else { const d = await res.json(); setError(d.error); }
  };

  const openSwapDialog = (registration: any) => {
    setSwapRegistration(registration);
    setSwapNewTeam('');
    setSwapDialogOpen(true);
  };

  const swapTeam = async () => {
    if (!swapRegistration || !swapNewTeam) return;
    setError(''); setSuccess('');
    const res = await fetch(`/api/championships/${params.id}/registrations`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ registration_id: swapRegistration.id, team_id: swapNewTeam }) });
    if (res.ok) { setSuccess('Time do jogador atualizado!'); setSwapDialogOpen(false); setSwapRegistration(null); loadData(); }
    else { const d = await res.json(); setError(d.error); }
  };

  if (authLoading || !isAdmin || !championship) return null;

  // Group registrations by team
  const regsByTeam: Record<string, any[]> = {};
  registrations.forEach(r => {
    if (!regsByTeam[r.team_name]) regsByTeam[r.team_name] = [];
    regsByTeam[r.team_name].push(r);
  });

  return (
    <div>
      <PageHeader title="Inscricoes - BID" backHref="/admin/campeonatos">
        <p className="text-sm text-muted-foreground">{championship.name} ({championship.year})</p>
      </PageHeader>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert className="mb-4 border-green-200 bg-green-50 text-green-800"><AlertDescription>{success}</AlertDescription></Alert>}

      <div className="flex gap-2 mb-4 flex-wrap">
        <Button onClick={() => setTeamDialogOpen(true)}><UsersRound className="h-4 w-4 mr-1" />Inscrever Time</Button>
        <Button variant="outline" onClick={() => setPlayerDialogOpen(true)} disabled={enrolledTeams.length === 0}><UserPlus className="h-4 w-4 mr-1" />Inscrever Jogador</Button>
      </div>

      <h3 className="font-semibold text-lg mb-2">Times Inscritos ({enrolledTeams.length})</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {enrolledTeams.map((t: any) => (
          <Card key={t.team_id}>
            <CardContent className="flex items-center gap-2 p-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={t.team_logo || ''} />
                <AvatarFallback>{t.team_name?.[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-semibold flex-1 truncate">{t.team_name}</span>
              <button onClick={() => removeTeamEnrollment(t.team_id, t.team_name)} className="p-1 rounded hover:bg-accent text-destructive"><Trash2 className="h-4 w-4" /></button>
            </CardContent>
          </Card>
        ))}
        {enrolledTeams.length === 0 && <p className="col-span-full text-muted-foreground text-sm">Nenhum time inscrito</p>}
      </div>

      <Separator className="mb-4" />

      <h3 className="font-semibold text-lg mb-2">Jogadores Inscritos ({registrations.length})</h3>
      {Object.entries(regsByTeam).map(([teamName, regs]) => (
        <div key={teamName} className="mb-4">
          <p className="font-semibold text-primary mb-1">{teamName}</p>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jogador</TableHead>
                  <TableHead className="hidden md:table-cell">Posicao</TableHead>
                  <TableHead>N BID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regs.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7 text-xs">
                          <AvatarImage src={r.player_photo || ''} />
                          <AvatarFallback>{r.player_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{r.player_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{r.player_position}</TableCell>
                    <TableCell><Badge variant="outline">{r.bid_number}</Badge></TableCell>
                    <TableCell>
                      <Badge className={r.status === 'Ativo' ? 'bg-green-100 text-green-800 border-green-200' : ''} variant="outline">{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <button onClick={() => openSwapDialog(r)} className="p-1.5 rounded hover:bg-accent text-primary" title="Trocar time"><ArrowLeftRight className="h-4 w-4" /></button>
                      <button onClick={() => removePlayerRegistration(r.id, r.player_name)} className="p-1.5 rounded hover:bg-accent text-destructive" title="Remover inscricao"><Trash2 className="h-4 w-4" /></button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      ))}

      {/* Dialog: Inscrever Time */}
      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inscrever Time</DialogTitle>
            <DialogDescription>Selecione o time para inscrever no campeonato.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label>Time</Label>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger><SelectValue placeholder="Selecione o time" /></SelectTrigger>
              <SelectContent>
                {allTeams.filter(t => !enrolledTeams.find(et => et.team_id === t.id)).map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTeamDialogOpen(false)}>Cancelar</Button>
            <Button onClick={enrollTeam} disabled={!selectedTeam}>Inscrever</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Inscrever Jogador */}
      <Dialog open={playerDialogOpen} onOpenChange={setPlayerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inscrever Jogador (BID)</DialogTitle>
            <DialogDescription>Selecione o time e o jogador para gerar o BID.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Time</Label>
              <Select value={selectedPlayerTeam} onValueChange={setSelectedPlayerTeam}>
                <SelectTrigger><SelectValue placeholder="Selecione o time" /></SelectTrigger>
                <SelectContent>
                  {enrolledTeams.map(t => <SelectItem key={t.team_id} value={t.team_id}>{t.team_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Jogador</Label>
              <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                <SelectTrigger><SelectValue placeholder="Selecione o jogador" /></SelectTrigger>
                <SelectContent>
                  {allPlayers.filter(p => !registrations.find(r => r.player_id === p.id)).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name || p.name} - {p.position}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlayerDialogOpen(false)}>Cancelar</Button>
            <Button onClick={registerPlayer} disabled={!selectedPlayer || !selectedPlayerTeam}>Inscrever</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Trocar Time */}
      <Dialog open={swapDialogOpen} onOpenChange={setSwapDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trocar Time do Jogador</DialogTitle>
            {swapRegistration && (
              <DialogDescription>
                Jogador: <strong>{swapRegistration.player_name}</strong> (atual: {swapRegistration.team_name})
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="py-2">
            <Label>Novo Time</Label>
            <Select value={swapNewTeam} onValueChange={setSwapNewTeam}>
              <SelectTrigger><SelectValue placeholder="Selecione o novo time" /></SelectTrigger>
              <SelectContent>
                {enrolledTeams.filter(t => t.team_id !== swapRegistration?.team_id).map(t => (
                  <SelectItem key={t.team_id} value={t.team_id}>{t.team_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSwapDialogOpen(false)}>Cancelar</Button>
            <Button onClick={swapTeam} disabled={!swapNewTeam}>Trocar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
