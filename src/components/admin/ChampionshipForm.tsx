'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Championship } from '@/types';
import { CHAMPIONSHIP_STATUS } from '@/lib/utils';
import PageHeader from '@/components/admin/PageHeader';

interface Props { championship?: Championship; }

export default function ChampionshipForm({ championship }: Props) {
  const router = useRouter();
  const isEditing = !!championship;
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: championship?.name || '',
    short_name: championship?.short_name || '',
    year: championship?.year?.toString() || new Date().getFullYear().toString(),
    season: championship?.season || '1',
    category: championship?.category || 'Principal',
    format: championship?.format || 'Pontos Corridos',
    description: championship?.description || '',
    start_date: championship?.start_date ? new Date(championship.start_date).toISOString().split('T')[0] : '',
    end_date: championship?.end_date ? new Date(championship.end_date).toISOString().split('T')[0] : '',
    status: championship?.status || 'Planejado',
    banner_url: championship?.banner_url || '',
    prize: championship?.prize || '',
    location: championship?.location || '',
    sponsor: championship?.sponsor || '',
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      const body = { ...form, year: parseInt(form.year), short_name: form.short_name || null, description: form.description || null, start_date: form.start_date || null, end_date: form.end_date || null, banner_url: form.banner_url || null, prize: form.prize || null, location: form.location || null, sponsor: form.sponsor || null };
      const url = isEditing ? `/api/championships/${championship.id}` : '/api/championships';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) router.push('/admin/campeonatos');
      else { const data = await res.json(); setError(data.error || 'Erro ao salvar'); }
    } catch { setError('Erro ao salvar campeonato'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title={isEditing ? 'Editar Campeonato' : 'Novo Campeonato'} backHref="/admin/campeonatos" />
      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6"><Label>Nome *</Label><Input required value={form.name} onChange={handleChange('name')} /></div>
            <div className="md:col-span-3"><Label>Sigla</Label><Input value={form.short_name} onChange={handleChange('short_name')} /></div>
            <div className="md:col-span-3"><Label>Ano *</Label><Input required type="number" value={form.year} onChange={handleChange('year')} /></div>
            <div className="md:col-span-3">
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm(prev => ({ ...prev, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Principal', 'Sub-20', 'Sub-17', 'Veteranos', 'Feminino'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Label>Formato</Label>
              <Select value={form.format} onValueChange={(v) => setForm(prev => ({ ...prev, format: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Pontos Corridos', 'Mata-Mata', 'Grupos + Mata-Mata'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm(prev => ({ ...prev, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHAMPIONSHIP_STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Label>Semestre</Label>
              <Select value={form.season} onValueChange={(v) => setForm(prev => ({ ...prev, season: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Semestre</SelectItem>
                  <SelectItem value="2">2 Semestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-6"><Label>Data Inicio</Label><Input type="date" value={form.start_date} onChange={handleChange('start_date')} /></div>
            <div className="md:col-span-6"><Label>Data Fim</Label><Input type="date" value={form.end_date} onChange={handleChange('end_date')} /></div>
            <div className="md:col-span-6"><Label>Local</Label><Input value={form.location} onChange={handleChange('location')} placeholder="Ex: Estadio Municipal" /></div>
            <div className="md:col-span-6"><Label>Patrocinador</Label><Input value={form.sponsor} onChange={handleChange('sponsor')} /></div>
            <div className="md:col-span-6"><Label>Premiacao</Label><Input value={form.prize} onChange={handleChange('prize')} placeholder="Ex: R$ 5.000,00" /></div>
            <div className="md:col-span-6"><Label>URL do Banner</Label><Input value={form.banner_url} onChange={handleChange('banner_url')} placeholder="https://..." /></div>
            <div className="md:col-span-12"><Label>Descricao</Label><Textarea rows={3} value={form.description} onChange={handleChange('description')} /></div>
            <div className="md:col-span-12 flex justify-end gap-2">
              <Link href="/admin/campeonatos"><Button variant="outline" type="button">Cancelar</Button></Link>
              <Button type="submit" disabled={saving}><Save className="h-4 w-4 mr-2" />{saving ? 'Salvando...' : 'Salvar'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
