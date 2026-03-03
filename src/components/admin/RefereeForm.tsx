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
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Referee } from '@/types';
import { REFEREE_CATEGORIES } from '@/lib/utils';
import PageHeader from '@/components/admin/PageHeader';

interface Props { referee?: Referee; }

export default function RefereeForm({ referee }: Props) {
  const router = useRouter();
  const isEditing = !!referee;
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: referee?.name || '',
    nickname: referee?.nickname || '',
    cpf: referee?.cpf || '',
    phone: referee?.phone || '',
    category: referee?.category || 'Arbitro',
    city: referee?.city || 'Itapecerica',
    state: referee?.state || 'MG',
    active: referee?.active ?? true,
    notes: referee?.notes || '',
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      const body = { ...form, nickname: form.nickname || null, cpf: form.cpf || null, phone: form.phone || null, notes: form.notes || null };
      const url = isEditing ? `/api/referees/${referee.id}` : '/api/referees';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) router.push('/admin/arbitros');
      else { const d = await res.json(); setError(d.error || 'Erro ao salvar'); }
    } catch { setError('Erro ao salvar arbitro'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title={isEditing ? 'Editar Arbitro' : 'Novo Arbitro'} backHref="/admin/arbitros" />
      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6">
              <Label>Nome Completo *</Label>
              <Input required value={form.name} onChange={handleChange('name')} />
            </div>
            <div className="md:col-span-3">
              <Label>Apelido</Label>
              <Input value={form.nickname} onChange={handleChange('nickname')} />
            </div>
            <div className="md:col-span-3">
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm(prev => ({ ...prev, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REFEREE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Label>CPF</Label>
              <Input value={form.cpf} onChange={handleChange('cpf')} placeholder="000.000.000-00" />
            </div>
            <div className="md:col-span-3">
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={handleChange('phone')} placeholder="(00) 00000-0000" />
            </div>
            <div className="md:col-span-3">
              <Label>Cidade</Label>
              <Input value={form.city} onChange={handleChange('city')} />
            </div>
            <div className="md:col-span-3">
              <Label>UF</Label>
              <Input value={form.state} onChange={handleChange('state')} maxLength={2} />
            </div>
            <div className="md:col-span-12">
              <Label>Observacoes</Label>
              <Textarea rows={3} value={form.notes} onChange={handleChange('notes')} />
            </div>
            <div className="md:col-span-12 flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm(prev => ({ ...prev, active: v }))} />
              <Label>Ativo</Label>
            </div>
            <div className="md:col-span-12 flex justify-end gap-2">
              <Link href="/admin/arbitros"><Button variant="outline" type="button">Cancelar</Button></Link>
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
