'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Team } from '@/types';
import PageHeader from '@/components/admin/PageHeader';

interface TeamFormProps { team?: Team; }

export default function TeamForm({ team }: TeamFormProps) {
  const router = useRouter();
  const isEditing = !!team;
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState(team?.logo_url || '');

  const [form, setForm] = useState({
    name: team?.name || '', short_name: team?.short_name || '', primary_color: team?.primary_color || '#1976d2', secondary_color: team?.secondary_color || '#ffffff',
    city: team?.city || 'Itapecerica', state: team?.state || 'MG', founded_year: team?.founded_year?.toString() || '',
    contact_name: team?.contact_name || '', contact_phone: team?.contact_phone || '', notes: team?.notes || '', instagram: team?.instagram || '', bio: team?.bio || '',
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setLogoFile(file); setLogoPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      let logo_url = team?.logo_url || null;
      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile); formData.append('type', 'teams');
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (uploadRes.ok) { const data = await uploadRes.json(); logo_url = data.url; }
      }
      const body = { ...form, logo_url, founded_year: form.founded_year ? parseInt(form.founded_year) : null, short_name: form.short_name || null, contact_name: form.contact_name || null, contact_phone: form.contact_phone || null, notes: form.notes || null, instagram: form.instagram || null, bio: form.bio || null };
      const url = isEditing ? `/api/teams/${team.id}` : '/api/teams';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) router.push('/admin/times');
      else { const data = await res.json(); setError(data.error || 'Erro ao salvar'); }
    } catch { setError('Erro ao salvar time'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title={isEditing ? 'Editar Time' : 'Novo Time'} backHref="/admin/times" />
      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-3 flex flex-col items-center gap-2">
                <Avatar className="h-24 w-24" style={{ backgroundColor: form.primary_color }}>
                  <AvatarImage src={logoPreview} />
                  <AvatarFallback className="text-white text-2xl">{form.short_name?.[0] || form.name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm" asChild>
                  <label className="cursor-pointer">
                    {logoPreview ? 'Trocar Escudo' : 'Upload Escudo'}
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                  </label>
                </Button>
              </div>
              <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6"><Label>Nome do Time *</Label><Input required value={form.name} onChange={handleChange('name')} /></div>
                <div className="md:col-span-3"><Label>Sigla</Label><Input value={form.short_name} onChange={handleChange('short_name')} placeholder="Ex: FLA" /></div>
                <div className="md:col-span-3"><Label>Ano Fundacao</Label><Input type="number" value={form.founded_year} onChange={handleChange('founded_year')} /></div>
                <div className="md:col-span-3"><Label>Cor Principal</Label><Input type="color" value={form.primary_color} onChange={handleChange('primary_color')} className="h-10" /></div>
                <div className="md:col-span-3"><Label>Cor Secundaria</Label><Input type="color" value={form.secondary_color} onChange={handleChange('secondary_color')} className="h-10" /></div>
                <div className="md:col-span-3"><Label>Cidade</Label><Input value={form.city} onChange={handleChange('city')} /></div>
                <div className="md:col-span-3"><Label>Estado</Label><Input value={form.state} onChange={handleChange('state')} /></div>
                <div className="md:col-span-6"><Label>Nome Contato</Label><Input value={form.contact_name} onChange={handleChange('contact_name')} /></div>
                <div className="md:col-span-6"><Label>Telefone Contato</Label><Input value={form.contact_phone} onChange={handleChange('contact_phone')} /></div>
                <div className="md:col-span-6"><Label>Instagram</Label><Input value={form.instagram} onChange={handleChange('instagram')} placeholder="@time" /></div>
                <div className="md:col-span-6"><Label>Bio</Label><Textarea rows={2} value={form.bio} onChange={handleChange('bio')} /></div>
                <div className="md:col-span-12"><Label>Observacoes</Label><Textarea rows={2} value={form.notes} onChange={handleChange('notes')} /></div>
              </div>
              <div className="md:col-span-12 flex justify-end gap-2">
                <Link href="/admin/times"><Button variant="outline" type="button">Cancelar</Button></Link>
                <Button type="submit" disabled={saving}><Save className="h-4 w-4 mr-2" />{saving ? 'Salvando...' : 'Salvar'}</Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
