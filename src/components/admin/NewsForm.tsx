'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box, TextField, Button, Grid, MenuItem, Alert, Typography, Card, CardContent,
  FormControlLabel, Switch,
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { NewsArticle, Championship } from '@/types';
import { slugify } from '@/lib/utils';

interface Props {
  news?: NewsArticle;
}

export default function NewsForm({ news }: Props) {
  const router = useRouter();
  const isEditing = !!news;
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState(news?.cover_image || '');

  const [form, setForm] = useState({
    title: news?.title || '',
    slug: news?.slug || '',
    summary: news?.summary || '',
    content: news?.content || '',
    championship_id: news?.championship_id || '',
    is_published: news?.is_published ?? false,
    is_featured: news?.is_featured ?? false,
    published_at: news?.published_at ? new Date(news.published_at).toISOString().slice(0, 16) : '',
  });

  useEffect(() => {
    fetch('/api/championships?all=true')
      .then(r => r.json())
      .then(setChampionships)
      .catch(() => {});
  }, []);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'title' && !isEditing) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const handleSwitchChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.checked }));
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      let cover_image = news?.cover_image || null;

      if (coverFile) {
        const formData = new FormData();
        formData.append('file', coverFile);
        formData.append('type', 'news');
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          cover_image = uploadData.url;
        }
      }

      const body = {
        ...form,
        cover_image,
        championship_id: form.championship_id || null,
        summary: form.summary || null,
        published_at: form.published_at || null,
      };

      const url = isEditing ? `/api/news/${news.id}` : '/api/news';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push('/admin/noticias');
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao salvar');
      }
    } catch {
      setError('Erro ao salvar noticia');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button component={Link} href="/admin/noticias" startIcon={<ArrowBack />} color="inherit">
          Voltar
        </Button>
        <Typography variant="h4" fontWeight={700}>
          {isEditing ? 'Editar Noticia' : 'Nova Noticia'}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField label="Titulo" required fullWidth value={form.title} onChange={handleChange('title')} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Slug" required fullWidth value={form.slug} onChange={handleChange('slug')} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Resumo" multiline rows={2} fullWidth value={form.summary} onChange={handleChange('summary')} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Conteudo" required multiline rows={10} fullWidth value={form.content} onChange={handleChange('content')} />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField select label="Campeonato (opcional)" fullWidth value={form.championship_id} onChange={handleChange('championship_id')}>
                  <MenuItem value="">Nenhum</MenuItem>
                  {championships.map(c => <MenuItem key={c.id} value={c.id}>{c.name} ({c.year})</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Data de Publicacao"
                  type="datetime-local"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={form.published_at}
                  onChange={handleChange('published_at')}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pt: 1 }}>
                  <FormControlLabel
                    control={<Switch checked={form.is_published} onChange={handleSwitchChange('is_published')} />}
                    label="Publicada"
                  />
                  <FormControlLabel
                    control={<Switch checked={form.is_featured} onChange={handleSwitchChange('is_featured')} />}
                    label="Destaque"
                  />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Imagem de Capa</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {coverPreview && (
                    <Box
                      component="img"
                      src={coverPreview}
                      sx={{ width: 200, height: 120, objectFit: 'cover', borderRadius: 1, border: '1px solid #e0e0e0' }}
                    />
                  )}
                  <Button variant="outlined" component="label" size="small">
                    {coverPreview ? 'Trocar Imagem' : 'Upload Imagem'}
                    <input type="file" hidden accept="image/*" onChange={handleCoverChange} />
                  </Button>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button component={Link} href="/admin/noticias" color="inherit">Cancelar</Button>
                  <Button type="submit" variant="contained" startIcon={<Save />} disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
