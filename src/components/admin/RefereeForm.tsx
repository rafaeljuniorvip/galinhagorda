'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Box, TextField, Button, Grid, MenuItem, Alert, Typography, Card, CardContent, FormControlLabel, Switch } from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { Referee } from '@/types';
import { REFEREE_CATEGORIES } from '@/lib/utils';

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
        nickname: form.nickname || null,
        cpf: form.cpf || null,
        phone: form.phone || null,
        notes: form.notes || null,
      };
      const url = isEditing ? `/api/referees/${referee.id}` : '/api/referees';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { router.push('/admin/arbitros'); }
      else { const d = await res.json(); setError(d.error || 'Erro ao salvar'); }
    } catch { setError('Erro ao salvar arbitro'); }
    finally { setSaving(false); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button component={Link} href="/admin/arbitros" startIcon={<ArrowBack />} color="inherit">Voltar</Button>
        <Typography variant="h4" fontWeight={700}>{isEditing ? 'Editar Arbitro' : 'Novo Arbitro'}</Typography>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField label="Nome Completo" required fullWidth value={form.name} onChange={handleChange('name')} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField label="Apelido" fullWidth value={form.nickname} onChange={handleChange('nickname')} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField select label="Categoria" fullWidth value={form.category} onChange={handleChange('category')}>
                  {REFEREE_CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField label="CPF" fullWidth value={form.cpf} onChange={handleChange('cpf')} placeholder="000.000.000-00" />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField label="Telefone" fullWidth value={form.phone} onChange={handleChange('phone')} placeholder="(00) 00000-0000" />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField label="Cidade" fullWidth value={form.city} onChange={handleChange('city')} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField label="UF" fullWidth value={form.state} onChange={handleChange('state')} inputProps={{ maxLength: 2 }} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Observacoes" multiline rows={3} fullWidth value={form.notes} onChange={handleChange('notes')} />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={form.active} onChange={(e) => setForm(prev => ({ ...prev, active: e.target.checked }))} />}
                  label="Ativo"
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button component={Link} href="/admin/arbitros" color="inherit">Cancelar</Button>
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
