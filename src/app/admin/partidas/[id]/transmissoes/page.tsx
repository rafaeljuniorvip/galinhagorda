'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Trash2, Radio } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { StreamingLink, Match } from '@/types';
import PageHeader from '@/components/admin/PageHeader';

const PLATFORMS = ['YouTube', 'Facebook', 'Instagram', 'TikTok', 'Outro'];

export default function TransmissoesPartidaPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [match, setMatch] = useState<Match | null>(null);
  const [links, setLinks] = useState<StreamingLink[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ platform: '', url: '', label: '', is_live: false });
  const [matchUrls, setMatchUrls] = useState({ streaming_url: '', highlights_url: '' });

  useEffect(() => { if (!authLoading && !isAdmin) router.push('/admin/login'); }, [isAdmin, authLoading, router]);

  const loadData = useCallback(async () => {
    const [matchRes, linksRes] = await Promise.all([fetch(`/api/matches/${params.id}`), fetch(`/api/matches/${params.id}/streaming`)]);
    if (matchRes.ok) { const m = await matchRes.json(); setMatch(m); setMatchUrls({ streaming_url: m.streaming_url || '', highlights_url: m.highlights_url || '' }); }
    if (linksRes.ok) setLinks(await linksRes.json());
  }, [params.id]);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  const handleAddLink = async () => {
    setError(''); setSuccess('');
    if (!form.platform || !form.url) { setError('Plataforma e URL sao obrigatorios'); return; }
    const res = await fetch(`/api/matches/${params.id}/streaming`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { setSuccess('Link adicionado!'); setForm({ platform: '', url: '', label: '', is_live: false }); loadData(); }
    else { const d = await res.json(); setError(d.error || 'Erro ao adicionar link'); }
  };

  const handleDeleteLink = async (linkId: string) => { await fetch(`/api/matches/${params.id}/streaming?link_id=${linkId}`, { method: 'DELETE' }); loadData(); };

  const handleToggleLive = async (linkId: string, currentStatus: boolean) => {
    await fetch(`/api/matches/${params.id}/streaming`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toggle_live: true, link_id: linkId, is_live: !currentStatus }) });
    setLinks(prev => prev.map(l => l.id === linkId ? { ...l, is_live: !currentStatus } : l));
  };

  const handleSaveMatchUrls = async () => {
    setError(''); setSuccess('');
    const res = await fetch(`/api/matches/${params.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...match, streaming_url: matchUrls.streaming_url || null, highlights_url: matchUrls.highlights_url || null }) });
    if (res.ok) { setSuccess('URLs da partida atualizadas!'); loadData(); }
    else { setError('Erro ao salvar URLs'); }
  };

  if (authLoading || !isAdmin || !match) return null;

  return (
    <div>
      <PageHeader title="Transmissoes" backHref="/admin/partidas">
        <p className="text-sm text-muted-foreground">{match.home_team_name} {match.home_score ?? '-'} x {match.away_score ?? '-'} {match.away_team_name}</p>
      </PageHeader>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert className="mb-4 border-green-200 bg-green-50 text-green-800"><AlertDescription>{success}</AlertDescription></Alert>}

      <Card className="mb-4">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">URLs Principais da Partida</h3>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-5"><Label>URL de Transmissao Principal</Label><Input value={matchUrls.streaming_url} onChange={(e) => setMatchUrls(prev => ({ ...prev, streaming_url: e.target.value }))} placeholder="https://youtube.com/..." /></div>
            <div className="md:col-span-5"><Label>URL de Melhores Momentos</Label><Input value={matchUrls.highlights_url} onChange={(e) => setMatchUrls(prev => ({ ...prev, highlights_url: e.target.value }))} placeholder="https://youtube.com/..." /></div>
            <div className="md:col-span-2"><Button className="w-full" onClick={handleSaveMatchUrls}>Salvar URLs</Button></div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">Adicionar Link de Transmissao</h3>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-2">
              <Label>Plataforma</Label>
              <Select value={form.platform} onValueChange={(v) => setForm(prev => ({ ...prev, platform: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="md:col-span-4"><Label>URL</Label><Input value={form.url} onChange={(e) => setForm(prev => ({ ...prev, url: e.target.value }))} placeholder="https://..." /></div>
            <div className="md:col-span-3"><Label>Label</Label><Input value={form.label} onChange={(e) => setForm(prev => ({ ...prev, label: e.target.value }))} placeholder="Ex: Transmissao oficial" /></div>
            <div className="md:col-span-1 flex items-center gap-2 pb-1">
              <Switch checked={form.is_live} onCheckedChange={(v) => setForm(prev => ({ ...prev, is_live: v }))} />
              <Label className="text-xs">Ao Vivo</Label>
            </div>
            <div className="md:col-span-2"><Button className="w-full" onClick={handleAddLink}><Plus className="h-4 w-4 mr-1" />Adicionar</Button></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plataforma</TableHead>
              <TableHead>URL</TableHead>
              <TableHead className="hidden md:table-cell">Label</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.map((link) => (
              <TableRow key={link.id}>
                <TableCell>{link.platform}</TableCell>
                <TableCell><p className="text-sm max-w-[150px] md:max-w-[300px] truncate">{link.url}</p></TableCell>
                <TableCell className="hidden md:table-cell">{link.label || '-'}</TableCell>
                <TableCell>
                  <Badge className={`cursor-pointer ${link.is_live ? 'bg-red-100 text-red-800 border-red-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`} variant="outline" onClick={() => handleToggleLive(link.id, link.is_live)}>
                    <Radio className="h-3 w-3 mr-1" />{link.is_live ? 'Ao Vivo' : 'Offline'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <button onClick={() => handleDeleteLink(link.id)} className="p-1.5 rounded hover:bg-accent text-destructive"><Trash2 className="h-4 w-4" /></button>
                </TableCell>
              </TableRow>
            ))}
            {links.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum link de transmissao cadastrado</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
