'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Match, Championship, Team, Referee } from '@/types';
import { MATCH_STATUS } from '@/lib/utils';
import Combobox from '@/components/admin/Combobox';
import PageHeader from '@/components/admin/PageHeader';

interface Props { match?: Match; }

export default function MatchForm({ match }: Props) {
  const router = useRouter();
  const isEditing = !!match;
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [referees, setReferees] = useState<Referee[]>([]);

  const [form, setForm] = useState({
    championship_id: match?.championship_id || '', home_team_id: match?.home_team_id || '', away_team_id: match?.away_team_id || '',
    home_score: match?.home_score?.toString() ?? '', away_score: match?.away_score?.toString() ?? '',
    match_date: match?.match_date ? new Date(match.match_date).toISOString().slice(0, 16) : '',
    match_round: match?.match_round || '', venue: match?.venue || '', referee: match?.referee || '',
    referee_id: match?.referee_id || '', assistant_referee_1_id: match?.assistant_referee_1_id || '', assistant_referee_2_id: match?.assistant_referee_2_id || '',
    status: match?.status || 'Agendada', observations: match?.observations || '',
    streaming_url: match?.streaming_url || '', highlights_url: match?.highlights_url || '',
    is_featured: match?.is_featured ?? false, voting_open: match?.voting_open ?? false,
    voting_deadline: match?.voting_deadline ? new Date(match.voting_deadline).toISOString().slice(0, 16) : '',
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/championships?all=true').then(r => r.json()),
      fetch('/api/teams?all=true').then(r => r.json()),
      fetch('/api/referees?all=true').then(r => r.json()),
    ]).then(([c, t, refs]) => { setChampionships(c); setTeams(t); setReferees(refs); });
  }, []);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const refereeOptions = referees.map(r => ({ value: r.id, label: r.nickname ? `${r.name} (${r.nickname})` : r.name }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      const selectedReferee = referees.find(r => r.id === form.referee_id);
      const selectedAR1 = referees.find(r => r.id === form.assistant_referee_1_id);
      const selectedAR2 = referees.find(r => r.id === form.assistant_referee_2_id);
      const body = {
        ...form,
        home_score: form.home_score !== '' ? parseInt(form.home_score) : null,
        away_score: form.away_score !== '' ? parseInt(form.away_score) : null,
        match_date: form.match_date || null, match_round: form.match_round || null, venue: form.venue || null,
        referee: selectedReferee?.name || form.referee || null,
        assistant_referee_1: selectedAR1?.name || null, assistant_referee_2: selectedAR2?.name || null,
        referee_id: form.referee_id || null, assistant_referee_1_id: form.assistant_referee_1_id || null, assistant_referee_2_id: form.assistant_referee_2_id || null,
        observations: form.observations || null, streaming_url: form.streaming_url || null, highlights_url: form.highlights_url || null,
        is_featured: form.is_featured, voting_open: form.voting_open, voting_deadline: form.voting_deadline || null,
      };
      const url = isEditing ? `/api/matches/${match.id}` : '/api/matches';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) router.push('/admin/partidas');
      else { const d = await res.json(); setError(d.error || 'Erro ao salvar'); }
    } catch { setError('Erro ao salvar partida'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title={isEditing ? 'Editar Partida' : 'Nova Partida'} backHref="/admin/partidas" />
      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6">
              <Label>Campeonato *</Label>
              <Select value={form.championship_id} onValueChange={(v) => setForm(prev => ({ ...prev, championship_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {championships.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.year})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3"><Label>Rodada</Label><Input value={form.match_round} onChange={handleChange('match_round')} placeholder="Ex: Rodada 1" /></div>
            <div className="md:col-span-3">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm(prev => ({ ...prev, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MATCH_STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-5">
              <Label>Time Mandante *</Label>
              <Select value={form.home_team_id} onValueChange={(v) => setForm(prev => ({ ...prev, home_team_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-1">
              <Label>Gols</Label>
              <Input type="number" value={form.home_score} disabled className="bg-muted cursor-not-allowed" />
              <span className="text-[10px] text-muted-foreground leading-tight block mt-0.5">Auto (eventos)</span>
            </div>
            <div className="md:col-span-1">
              <Label>Gols</Label>
              <Input type="number" value={form.away_score} disabled className="bg-muted cursor-not-allowed" />
              <span className="text-[10px] text-muted-foreground leading-tight block mt-0.5">Auto (eventos)</span>
            </div>
            <div className="md:col-span-5">
              <Label>Time Visitante *</Label>
              <Select value={form.away_team_id} onValueChange={(v) => setForm(prev => ({ ...prev, away_team_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-4"><Label>Data e Hora</Label><Input type="datetime-local" value={form.match_date} onChange={handleChange('match_date')} /></div>
            <div className="md:col-span-4"><Label>Local</Label><Input value={form.venue} onChange={handleChange('venue')} /></div>
            <div className="md:col-span-4">
              <Label>Arbitro</Label>
              <Combobox options={refereeOptions} value={form.referee_id} onChange={(v) => setForm(prev => ({ ...prev, referee_id: v, referee: referees.find(r => r.id === v)?.name || '' }))} placeholder="Selecione arbitro" searchPlaceholder="Buscar arbitro..." />
            </div>
            <div className="md:col-span-4">
              <Label>Assistente 1</Label>
              <Combobox options={refereeOptions} value={form.assistant_referee_1_id} onChange={(v) => setForm(prev => ({ ...prev, assistant_referee_1_id: v }))} placeholder="Selecione assistente" searchPlaceholder="Buscar arbitro..." />
            </div>
            <div className="md:col-span-4">
              <Label>Assistente 2</Label>
              <Combobox options={refereeOptions} value={form.assistant_referee_2_id} onChange={(v) => setForm(prev => ({ ...prev, assistant_referee_2_id: v }))} placeholder="Selecione assistente" searchPlaceholder="Buscar arbitro..." />
            </div>
            <div className="md:col-span-4"><Label>URL Transmissao</Label><Input value={form.streaming_url} onChange={handleChange('streaming_url')} placeholder="https://..." /></div>
            <div className="md:col-span-4"><Label>URL Melhores Momentos</Label><Input value={form.highlights_url} onChange={handleChange('highlights_url')} placeholder="https://..." /></div>
            <div className="md:col-span-4"><Label>Prazo Votacao</Label><Input type="datetime-local" value={form.voting_deadline} onChange={handleChange('voting_deadline')} /></div>
            <div className="md:col-span-4 flex gap-6 pt-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_featured} onCheckedChange={(v) => setForm(prev => ({ ...prev, is_featured: v }))} />
                <Label>Destaque</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.voting_open} onCheckedChange={(v) => setForm(prev => ({ ...prev, voting_open: v }))} />
                <Label>Votacao Aberta</Label>
              </div>
            </div>
            <div className="md:col-span-12"><Label>Observacoes</Label><Textarea rows={2} value={form.observations} onChange={handleChange('observations')} /></div>
            <div className="md:col-span-12 flex justify-end gap-2">
              <Link href="/admin/partidas"><Button variant="outline" type="button">Cancelar</Button></Link>
              <Button type="submit" disabled={saving}><Save className="h-4 w-4 mr-2" />{saving ? 'Salvando...' : 'Salvar'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
