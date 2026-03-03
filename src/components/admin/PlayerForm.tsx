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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Player } from '@/types';
import { POSITIONS } from '@/lib/utils';
import PageHeader from '@/components/admin/PageHeader';

interface PlayerFormProps { player?: Player; }

export default function PlayerForm({ player }: PlayerFormProps) {
  const router = useRouter();
  const isEditing = !!player;
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(player?.photo_url || '');

  const [form, setForm] = useState({
    full_name: player?.full_name || '', name: player?.name || '', nickname: player?.nickname || '',
    birth_date: player?.birth_date ? new Date(player.birth_date).toISOString().split('T')[0] : '',
    cpf: player?.cpf || '', rg: player?.rg || '', position: player?.position || '', dominant_foot: player?.dominant_foot || '',
    height: player?.height?.toString() || '', weight: player?.weight?.toString() || '',
    city: player?.city || 'Itapecerica', state: player?.state || 'MG',
    notes: player?.notes || '', instagram: player?.instagram || '', bio: player?.bio || '',
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      let photo_url = player?.photo_url || null;
      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile); formData.append('type', 'players');
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (uploadRes.ok) { const data = await uploadRes.json(); photo_url = data.url; }
      }
      const body = { ...form, photo_url, height: form.height ? parseFloat(form.height) : null, weight: form.weight ? parseFloat(form.weight) : null, birth_date: form.birth_date || null, nickname: form.nickname || null, cpf: form.cpf || null, rg: form.rg || null, dominant_foot: form.dominant_foot || null, notes: form.notes || null, instagram: form.instagram || null, bio: form.bio || null };
      const url = isEditing ? `/api/players/${player.id}` : '/api/players';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) router.push('/admin/jogadores');
      else { const data = await res.json(); setError(data.error || 'Erro ao salvar'); }
    } catch { setError('Erro ao salvar jogador'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title={isEditing ? 'Editar Jogador' : 'Novo Jogador'} backHref="/admin/jogadores" />
      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-3 flex flex-col items-center gap-2">
                <Avatar className="h-28 w-28">
                  <AvatarImage src={photoPreview} />
                  <AvatarFallback className="text-4xl">{form.name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm" asChild>
                  <label className="cursor-pointer">
                    {photoPreview ? 'Trocar Foto' : 'Upload Foto'}
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                  </label>
                </Button>
              </div>
              <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6"><Label>Nome Completo *</Label><Input required value={form.full_name} onChange={handleChange('full_name')} /></div>
                <div className="md:col-span-3"><Label>Nome (camisa) *</Label><Input required value={form.name} onChange={handleChange('name')} /></div>
                <div className="md:col-span-3"><Label>Apelido</Label><Input value={form.nickname} onChange={handleChange('nickname')} /></div>
                <div className="md:col-span-4">
                  <Label>Posicao *</Label>
                  <Select value={form.position} onValueChange={(v) => setForm(prev => ({ ...prev, position: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-4"><Label>Data de Nascimento</Label><Input type="date" value={form.birth_date} onChange={handleChange('birth_date')} /></div>
                <div className="md:col-span-4">
                  <Label>Pe Dominante</Label>
                  <Select value={form.dominant_foot || 'none'} onValueChange={(v) => setForm(prev => ({ ...prev, dominant_foot: v === 'none' ? '' : v }))}>
                    <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-</SelectItem>
                      <SelectItem value="Direito">Direito</SelectItem>
                      <SelectItem value="Esquerdo">Esquerdo</SelectItem>
                      <SelectItem value="Ambidestro">Ambidestro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3"><Label>Altura (m)</Label><Input type="number" step="0.01" value={form.height} onChange={handleChange('height')} /></div>
                <div className="md:col-span-3"><Label>Peso (kg)</Label><Input type="number" value={form.weight} onChange={handleChange('weight')} /></div>
                <div className="md:col-span-3"><Label>CPF</Label><Input value={form.cpf} onChange={handleChange('cpf')} /></div>
                <div className="md:col-span-3"><Label>RG</Label><Input value={form.rg} onChange={handleChange('rg')} /></div>
                <div className="md:col-span-6"><Label>Cidade</Label><Input value={form.city} onChange={handleChange('city')} /></div>
                <div className="md:col-span-6"><Label>Estado</Label><Input value={form.state} onChange={handleChange('state')} /></div>
                <div className="md:col-span-6"><Label>Instagram</Label><Input value={form.instagram} onChange={handleChange('instagram')} placeholder="@usuario" /></div>
                <div className="md:col-span-6"><Label>Bio</Label><Textarea rows={2} value={form.bio} onChange={handleChange('bio')} /></div>
                <div className="md:col-span-12"><Label>Observacoes</Label><Textarea rows={3} value={form.notes} onChange={handleChange('notes')} /></div>
              </div>
              <div className="md:col-span-12 flex justify-end gap-2">
                <Link href="/admin/jogadores"><Button variant="outline" type="button">Cancelar</Button></Link>
                <Button type="submit" disabled={saving}><Save className="h-4 w-4 mr-2" />{saving ? 'Salvando...' : 'Salvar'}</Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
