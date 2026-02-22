'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, TextField, Button, Grid, MenuItem, Alert, Avatar, Typography, Card, CardContent,
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { Player } from '@/types';
import { POSITIONS } from '@/lib/utils';
import Link from 'next/link';

interface PlayerFormProps {
  player?: Player;
}

export default function PlayerForm({ player }: PlayerFormProps) {
  const router = useRouter();
  const isEditing = !!player;
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(player?.photo_url || '');

  const [form, setForm] = useState({
    full_name: player?.full_name || '',
    name: player?.name || '',
    nickname: player?.nickname || '',
    birth_date: player?.birth_date ? new Date(player.birth_date).toISOString().split('T')[0] : '',
    cpf: player?.cpf || '',
    rg: player?.rg || '',
    position: player?.position || '',
    dominant_foot: player?.dominant_foot || '',
    height: player?.height?.toString() || '',
    weight: player?.weight?.toString() || '',
    city: player?.city || 'Itapecerica',
    state: player?.state || 'MG',
    notes: player?.notes || '',
    instagram: player?.instagram || '',
    bio: player?.bio || '',
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      let photo_url = player?.photo_url || null;

      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile);
        formData.append('type', 'players');
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          photo_url = uploadData.url;
        }
      }

      const body = {
        ...form,
        photo_url,
        height: form.height ? parseFloat(form.height) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        birth_date: form.birth_date || null,
        nickname: form.nickname || null,
        cpf: form.cpf || null,
        rg: form.rg || null,
        dominant_foot: form.dominant_foot || null,
        notes: form.notes || null,
        instagram: form.instagram || null,
        bio: form.bio || null,
      };

      const url = isEditing ? `/api/players/${player.id}` : '/api/players';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

      if (res.ok) {
        router.push('/admin/jogadores');
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao salvar');
      }
    } catch {
      setError('Erro ao salvar jogador');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button component={Link} href="/admin/jogadores" startIcon={<ArrowBack />} color="inherit">
          Voltar
        </Button>
        <Typography variant="h4" fontWeight={700}>
          {isEditing ? 'Editar Jogador' : 'Novo Jogador'}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar
                    src={photoPreview}
                    sx={{ width: 120, height: 120, mx: 'auto', mb: 1, fontSize: 48 }}
                  >
                    {form.name?.[0] || '?'}
                  </Avatar>
                  <Button variant="outlined" component="label" size="small">
                    {photoPreview ? 'Trocar Foto' : 'Upload Foto'}
                    <input type="file" hidden accept="image/*" onChange={handlePhotoChange} />
                  </Button>
                </Box>
              </Grid>

              <Grid item xs={12} md={9}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField label="Nome Completo" required fullWidth value={form.full_name} onChange={handleChange('full_name')} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField label="Nome (camisa)" required fullWidth value={form.name} onChange={handleChange('name')} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField label="Apelido" fullWidth value={form.nickname} onChange={handleChange('nickname')} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField select label="Posicao" required fullWidth value={form.position} onChange={handleChange('position')}>
                      {POSITIONS.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField label="Data de Nascimento" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.birth_date} onChange={handleChange('birth_date')} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField select label="Pe Dominante" fullWidth value={form.dominant_foot} onChange={handleChange('dominant_foot')}>
                      <MenuItem value="">-</MenuItem>
                      <MenuItem value="Direito">Direito</MenuItem>
                      <MenuItem value="Esquerdo">Esquerdo</MenuItem>
                      <MenuItem value="Ambidestro">Ambidestro</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField label="Altura (m)" type="number" fullWidth inputProps={{ step: 0.01 }} value={form.height} onChange={handleChange('height')} />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField label="Peso (kg)" type="number" fullWidth value={form.weight} onChange={handleChange('weight')} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField label="CPF" fullWidth value={form.cpf} onChange={handleChange('cpf')} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField label="RG" fullWidth value={form.rg} onChange={handleChange('rg')} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField label="Cidade" fullWidth value={form.city} onChange={handleChange('city')} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField label="Estado" fullWidth value={form.state} onChange={handleChange('state')} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField label="Instagram" fullWidth value={form.instagram} onChange={handleChange('instagram')} placeholder="@usuario" />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField label="Bio" multiline rows={2} fullWidth value={form.bio} onChange={handleChange('bio')} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="Observacoes" multiline rows={3} fullWidth value={form.notes} onChange={handleChange('notes')} />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button component={Link} href="/admin/jogadores" color="inherit">Cancelar</Button>
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
