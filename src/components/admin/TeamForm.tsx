'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box, TextField, Button, Grid, Alert, Avatar, Typography, Card, CardContent,
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { Team } from '@/types';

interface TeamFormProps {
  team?: Team;
}

export default function TeamForm({ team }: TeamFormProps) {
  const router = useRouter();
  const isEditing = !!team;
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState(team?.logo_url || '');

  const [form, setForm] = useState({
    name: team?.name || '',
    short_name: team?.short_name || '',
    primary_color: team?.primary_color || '#1976d2',
    secondary_color: team?.secondary_color || '#ffffff',
    city: team?.city || 'Itapecerica',
    state: team?.state || 'MG',
    founded_year: team?.founded_year?.toString() || '',
    contact_name: team?.contact_name || '',
    contact_phone: team?.contact_phone || '',
    notes: team?.notes || '',
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setLogoFile(file); setLogoPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      let logo_url = team?.logo_url || null;
      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);
        formData.append('type', 'teams');
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (uploadRes.ok) { const data = await uploadRes.json(); logo_url = data.url; }
      }

      const body = {
        ...form, logo_url,
        founded_year: form.founded_year ? parseInt(form.founded_year) : null,
        short_name: form.short_name || null,
        contact_name: form.contact_name || null,
        contact_phone: form.contact_phone || null,
        notes: form.notes || null,
      };

      const url = isEditing ? `/api/teams/${team.id}` : '/api/teams';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

      if (res.ok) { router.push('/admin/times'); }
      else { const data = await res.json(); setError(data.error || 'Erro ao salvar'); }
    } catch { setError('Erro ao salvar time'); }
    finally { setSaving(false); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button component={Link} href="/admin/times" startIcon={<ArrowBack />} color="inherit">Voltar</Button>
        <Typography variant="h4" fontWeight={700}>{isEditing ? 'Editar Time' : 'Novo Time'}</Typography>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar src={logoPreview} sx={{ width: 100, height: 100, mx: 'auto', mb: 1, bgcolor: form.primary_color }}>{form.short_name?.[0] || form.name?.[0] || '?'}</Avatar>
                  <Button variant="outlined" component="label" size="small">
                    {logoPreview ? 'Trocar Escudo' : 'Upload Escudo'}
                    <input type="file" hidden accept="image/*" onChange={handleLogoChange} />
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} md={9}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}><TextField label="Nome do Time" required fullWidth value={form.name} onChange={handleChange('name')} /></Grid>
                  <Grid item xs={12} md={3}><TextField label="Sigla" fullWidth value={form.short_name} onChange={handleChange('short_name')} placeholder="Ex: FLA" /></Grid>
                  <Grid item xs={12} md={3}><TextField label="Ano Fundacao" type="number" fullWidth value={form.founded_year} onChange={handleChange('founded_year')} /></Grid>
                  <Grid item xs={6} md={3}><TextField label="Cor Principal" type="color" fullWidth value={form.primary_color} onChange={handleChange('primary_color')} /></Grid>
                  <Grid item xs={6} md={3}><TextField label="Cor Secundaria" type="color" fullWidth value={form.secondary_color} onChange={handleChange('secondary_color')} /></Grid>
                  <Grid item xs={12} md={3}><TextField label="Cidade" fullWidth value={form.city} onChange={handleChange('city')} /></Grid>
                  <Grid item xs={12} md={3}><TextField label="Estado" fullWidth value={form.state} onChange={handleChange('state')} /></Grid>
                  <Grid item xs={12} md={6}><TextField label="Nome Contato" fullWidth value={form.contact_name} onChange={handleChange('contact_name')} /></Grid>
                  <Grid item xs={12} md={6}><TextField label="Telefone Contato" fullWidth value={form.contact_phone} onChange={handleChange('contact_phone')} /></Grid>
                  <Grid item xs={12}><TextField label="Observacoes" multiline rows={2} fullWidth value={form.notes} onChange={handleChange('notes')} /></Grid>
                </Grid>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button component={Link} href="/admin/times" color="inherit">Cancelar</Button>
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
