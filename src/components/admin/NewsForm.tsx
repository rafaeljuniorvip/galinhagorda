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
import RichTextEditor from '@/components/admin/RichTextEditor';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NewsArticle, Championship } from '@/types';
import { slugify } from '@/lib/utils';
import PageHeader from '@/components/admin/PageHeader';

interface Props { news?: NewsArticle; }

export default function NewsForm({ news }: Props) {
  const router = useRouter();
  const isEditing = !!news;
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState(news?.cover_image || '');

  const [form, setForm] = useState({
    title: news?.title || '', slug: news?.slug || '', summary: news?.summary || '', content: news?.content || '',
    championship_id: news?.championship_id || '', is_published: news?.is_published ?? false, is_featured: news?.is_featured ?? false,
    published_at: news?.published_at ? new Date(news.published_at).toISOString().slice(0, 16) : '',
  });

  useEffect(() => {
    fetch('/api/championships?all=true').then(r => r.json()).then(setChampionships).catch(() => {});
  }, []);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'title' && !isEditing) next.slug = slugify(value);
      return next;
    });
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setCoverFile(file); setCoverPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      let cover_image = news?.cover_image || null;
      if (coverFile) {
        const formData = new FormData();
        formData.append('file', coverFile); formData.append('type', 'news');
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (uploadRes.ok) { const data = await uploadRes.json(); cover_image = data.url; }
      }
      const body = { ...form, cover_image, championship_id: form.championship_id || null, summary: form.summary || null, published_at: form.published_at || null };
      const url = isEditing ? `/api/news/${news.id}` : '/api/news';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) router.push('/admin/noticias');
      else { const data = await res.json(); setError(data.error || 'Erro ao salvar'); }
    } catch { setError('Erro ao salvar noticia'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title={isEditing ? 'Editar Noticia' : 'Nova Noticia'} backHref="/admin/noticias" />
      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-12"><Label>Titulo *</Label><Input required value={form.title} onChange={handleChange('title')} /></div>
            <input type="hidden" value={form.slug} />
            <div className="md:col-span-12"><Label>Resumo</Label><Textarea rows={2} value={form.summary} onChange={handleChange('summary')} /></div>
            <div className="md:col-span-12"><Label className="mb-2 block">Conteudo *</Label><RichTextEditor value={form.content} onChange={(html) => setForm(prev => ({ ...prev, content: html }))} /></div>
            <div className="md:col-span-4">
              <Label>Campeonato (opcional)</Label>
              <Select value={form.championship_id || 'none'} onValueChange={(v) => setForm(prev => ({ ...prev, championship_id: v === 'none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {championships.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.year})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-4"><Label>Data de Publicacao</Label><Input type="datetime-local" value={form.published_at} onChange={handleChange('published_at')} /></div>
            <div className="md:col-span-4 flex flex-col gap-3 pt-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_published} onCheckedChange={(v) => setForm(prev => ({ ...prev, is_published: v }))} />
                <Label>Publicada</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_featured} onCheckedChange={(v) => setForm(prev => ({ ...prev, is_featured: v }))} />
                <Label>Destaque</Label>
              </div>
            </div>
            <div className="md:col-span-12">
              <Label className="mb-2 block">Imagem de Capa</Label>
              <div className="flex items-center gap-4">
                {coverPreview && (
                  <img src={coverPreview} className="w-48 h-28 object-cover rounded border" alt="Capa" />
                )}
                <Button variant="outline" size="sm" asChild>
                  <label className="cursor-pointer">
                    {coverPreview ? 'Trocar Imagem' : 'Upload Imagem'}
                    <input type="file" className="hidden" accept="image/*" onChange={handleCoverChange} />
                  </label>
                </Button>
              </div>
            </div>
            <div className="md:col-span-12 flex justify-end gap-2">
              <Link href="/admin/noticias"><Button variant="outline" type="button">Cancelar</Button></Link>
              <Button type="submit" disabled={saving}><Save className="h-4 w-4 mr-2" />{saving ? 'Salvando...' : 'Salvar'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
