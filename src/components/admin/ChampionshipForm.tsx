'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Box, TextField, Button, Grid, MenuItem, Alert, Typography, Card, CardContent } from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { Championship } from '@/types';
import { CHAMPIONSHIP_STATUS } from '@/lib/utils';

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

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = {
        ...form,
        year: parseInt(form.year),
        short_name: form.short_name || null,
        description: form.description || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        banner_url: form.banner_url || null,
        prize: form.prize || null,
        location: form.location || null,
        sponsor: form.sponsor || null,
      };
      const url = isEditing ? `/api/championships/${championship.id}` : '/api/championships';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { router.push('/admin/campeonatos'); }
      else { const data = await res.json(); setError(data.error || 'Erro ao salvar'); }
    } catch { setError('Erro ao salvar campeonato'); }
    finally { setSaving(false); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button component={Link} href="/admin/campeonatos" startIcon={<ArrowBack />} color="inherit">Voltar</Button>
        <Typography variant="h4" fontWeight={700}>{isEditing ? 'Editar Campeonato' : 'Novo Campeonato'}</Typography>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}><TextField label="Nome" required fullWidth value={form.name} onChange={handleChange('name')} /></Grid>
              <Grid item xs={12} md={3}><TextField label="Sigla" fullWidth value={form.short_name} onChange={handleChange('short_name')} /></Grid>
              <Grid item xs={12} md={3}><TextField label="Ano" required type="number" fullWidth value={form.year} onChange={handleChange('year')} /></Grid>
              <Grid item xs={12} md={3}>
                <TextField select label="Categoria" fullWidth value={form.category} onChange={handleChange('category')}>
                  <MenuItem value="Principal">Principal</MenuItem>
                  <MenuItem value="Sub-20">Sub-20</MenuItem>
                  <MenuItem value="Sub-17">Sub-17</MenuItem>
                  <MenuItem value="Veteranos">Veteranos</MenuItem>
                  <MenuItem value="Feminino">Feminino</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField select label="Formato" fullWidth value={form.format} onChange={handleChange('format')}>
                  <MenuItem value="Pontos Corridos">Pontos Corridos</MenuItem>
                  <MenuItem value="Mata-Mata">Mata-Mata</MenuItem>
                  <MenuItem value="Grupos + Mata-Mata">Grupos + Mata-Mata</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField select label="Status" fullWidth value={form.status} onChange={handleChange('status')}>
                  {CHAMPIONSHIP_STATUS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}><TextField label="Semestre" select fullWidth value={form.season} onChange={handleChange('season')}>
                <MenuItem value="1">1 Semestre</MenuItem><MenuItem value="2">2 Semestre</MenuItem>
              </TextField></Grid>
              <Grid item xs={12} md={6}><TextField label="Data Inicio" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.start_date} onChange={handleChange('start_date')} /></Grid>
              <Grid item xs={12} md={6}><TextField label="Data Fim" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.end_date} onChange={handleChange('end_date')} /></Grid>
              <Grid item xs={12} md={6}><TextField label="Local" fullWidth value={form.location} onChange={handleChange('location')} placeholder="Ex: Estadio Municipal" /></Grid>
              <Grid item xs={12} md={6}><TextField label="Patrocinador" fullWidth value={form.sponsor} onChange={handleChange('sponsor')} /></Grid>
              <Grid item xs={12} md={6}><TextField label="Premiacao" fullWidth value={form.prize} onChange={handleChange('prize')} placeholder="Ex: R$ 5.000,00" /></Grid>
              <Grid item xs={12} md={6}><TextField label="URL do Banner" fullWidth value={form.banner_url} onChange={handleChange('banner_url')} placeholder="https://..." /></Grid>
              <Grid item xs={12}><TextField label="Descricao" multiline rows={3} fullWidth value={form.description} onChange={handleChange('description')} /></Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button component={Link} href="/admin/campeonatos" color="inherit">Cancelar</Button>
                  <Button type="submit" variant="contained" startIcon={<Save />} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
