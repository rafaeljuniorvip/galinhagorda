'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { EVENT_TYPES } from '@/lib/utils';
import PageHeader from '@/components/admin/PageHeader';
import StatusBadge from '@/components/admin/StatusBadge';

export default function EventosPartidaPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [match, setMatch] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ player_id: '', team_id: '', event_type: '', minute: '', half: '1T' });

  useEffect(() => { if (!authLoading && !isAdmin) router.push('/admin/login'); }, [isAdmin, authLoading, router]);

  const loadData = useCallback(async () => {
    const [matchRes, eventsRes] = await Promise.all([
      fetch(`/api/matches/${params.id}`), fetch(`/api/matches/${params.id}/events`),
    ]);
    if (matchRes.ok) {
      const m = await matchRes.json(); setMatch(m);
      const regsRes = await fetch(`/api/championships/${m.championship_id}/registrations`);
      if (regsRes.ok) {
        const regs = await regsRes.json();
        setPlayers(regs.filter((r: any) => r.team_id === m.home_team_id || r.team_id === m.away_team_id));
      }
    }
    if (eventsRes.ok) setEvents(await eventsRes.json());
  }, [params.id]);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  const handleAdd = async () => {
    setError(''); setSuccess('');
    if (!form.player_id || !form.event_type) { setError('Jogador e tipo de evento sao obrigatorios'); return; }
    const playerReg = players.find(p => p.player_id === form.player_id);
    const res = await fetch(`/api/matches/${params.id}/events`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: form.player_id, team_id: playerReg?.team_id || form.team_id, event_type: form.event_type, minute: form.minute ? parseInt(form.minute) : null, half: form.half || null }),
    });
    if (res.ok) { setSuccess('Evento adicionado!'); setForm({ player_id: '', team_id: '', event_type: '', minute: '', half: '1T' }); loadData(); }
    else { const d = await res.json(); setError(d.error); }
  };

  const handleDelete = async (eventId: string) => {
    await fetch(`/api/matches/${params.id}/events?event_id=${eventId}`, { method: 'DELETE' }); loadData();
  };

  const eventLabel = (type: string) => EVENT_TYPES.find(e => e.value === type)?.label || type;
  const eventVariant = (type: string) => {
    if (type.includes('GOL')) return 'success' as const;
    if (type.includes('AMARELO')) return 'warning' as const;
    if (type.includes('VERMELHO')) return 'error' as const;
    return 'default' as const;
  };

  if (authLoading || !isAdmin || !match) return null;

  return (
    <div>
      <PageHeader title="Eventos da Partida" backHref="/admin/partidas">
        <p className="text-sm text-muted-foreground">{match.home_team_name} {match.home_score ?? '-'} x {match.away_score ?? '-'} {match.away_team_name}</p>
      </PageHeader>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert className="mb-4 border-green-200 bg-green-50 text-green-800"><AlertDescription>{success}</AlertDescription></Alert>}

      <Card className="mb-4">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">Adicionar Evento</h3>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-3">
              <Label>Jogador</Label>
              <Select value={form.player_id} onValueChange={(v) => setForm(prev => ({ ...prev, player_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {players.map((p: any) => (
                    <SelectItem key={p.player_id} value={p.player_id}>
                      {p.player_name} ({p.team_name === match.home_team_name ? 'CASA' : 'VISIT'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Label>Tipo</Label>
              <Select value={form.event_type} onValueChange={(v) => setForm(prev => ({ ...prev, event_type: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2"><Label>Minuto</Label><Input type="number" value={form.minute} onChange={(e) => setForm(prev => ({ ...prev, minute: e.target.value }))} /></div>
            <div className="md:col-span-2">
              <Label>Tempo</Label>
              <Select value={form.half} onValueChange={(v) => setForm(prev => ({ ...prev, half: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1T">1 Tempo</SelectItem>
                  <SelectItem value="2T">2 Tempo</SelectItem>
                  <SelectItem value="PRO">Prorrogacao</SelectItem>
                  <SelectItem value="PEN">Penaltis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Button className="w-full" onClick={handleAdd}><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden md:table-cell">Tempo</TableHead>
              <TableHead>Min</TableHead>
              <TableHead>Jogador</TableHead>
              <TableHead className="hidden md:table-cell">Time</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead className="text-right">Acao</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="hidden md:table-cell">{e.half || '-'}</TableCell>
                <TableCell>{e.minute ?? '-'}</TableCell>
                <TableCell>{e.player_name}</TableCell>
                <TableCell className="hidden md:table-cell">{e.team_name}</TableCell>
                <TableCell><StatusBadge status={eventLabel(e.event_type)} variant={eventVariant(e.event_type)} /></TableCell>
                <TableCell className="text-right">
                  <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded hover:bg-accent text-destructive"><Trash2 className="h-4 w-4" /></button>
                </TableCell>
              </TableRow>
            ))}
            {events.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum evento registrado</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
