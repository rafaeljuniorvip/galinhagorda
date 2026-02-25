'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, TextField, Button, Paper, Avatar, Alert,
  CircularProgress, MenuItem, Container, InputAdornment, Grid,
} from '@mui/material';
import { CheckCircle, CloudUpload, Instagram, Person } from '@mui/icons-material';
import { useParams } from 'next/navigation';
import { Player } from '@/types';

type PageState = 'loading' | 'error' | 'form' | 'success';

export default function CompletarPerfilPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<PageState>('loading');
  const [player, setPlayer] = useState<Partial<Player>>({});
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/players/complete/${token}`)
      .then(async (res) => {
        if (!res.ok) { setState('error'); return; }
        const data = await res.json();
        setPlayer(data);
        if (data.photo_url) setPhotoPreview(data.photo_url);
        setState('form');
      })
      .catch(() => setState('error'));
  }, [token]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let photo_url = player.photo_url || null;

      // Upload photo first if selected
      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile);
        const uploadRes = await fetch(`/api/players/complete/${token}/upload`, {
          method: 'POST',
          body: formData,
        });
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          photo_url = url;
        }
      }

      const res = await fetch(`/api/players/complete/${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: player.nickname || null,
          birth_date: player.birth_date || null,
          dominant_foot: player.dominant_foot || null,
          height: player.height ? Number(player.height) : null,
          weight: player.weight ? Number(player.weight) : null,
          city: player.city || null,
          state: player.state || null,
          bio: player.bio || null,
          instagram: player.instagram || null,
          photo_url,
        }),
      });

      if (res.ok) {
        setState('success');
      } else {
        alert('Erro ao salvar. Tente novamente.');
      }
    } catch {
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (state === 'loading') {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }} color="text.secondary">Carregando...</Typography>
      </Container>
    );
  }

  if (state === 'error') {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ justifyContent: 'center' }}>
          Link inválido ou expirado. Solicite um novo link ao administrador.
        </Alert>
      </Container>
    );
  }

  if (state === 'success') {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Perfil atualizado!
        </Typography>
        <Typography color="text.secondary">
          Seus dados foram salvos com sucesso. Obrigado por completar seu perfil.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper sx={{ p: { xs: 2, sm: 4 } }}>
        {/* Header with player info */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Person sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
          <Typography variant="h5" fontWeight={700}>
            Completar Perfil
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {player.full_name || player.name} &mdash; {player.position}
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          {/* Photo */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Avatar
              src={photoPreview || ''}
              sx={{ width: 100, height: 100, mx: 'auto', mb: 1, fontSize: 40 }}
            >
              {player.name?.[0]}
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={handlePhotoChange}
            />
            <Button
              size="small"
              startIcon={<CloudUpload />}
              onClick={() => fileInputRef.current?.click()}
            >
              {photoPreview ? 'Trocar foto' : 'Enviar foto'}
            </Button>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Apelido"
                fullWidth
                size="small"
                value={player.nickname || ''}
                onChange={(e) => setPlayer({ ...player, nickname: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Data de Nascimento"
                type="date"
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                value={player.birth_date ? String(player.birth_date).substring(0, 10) : ''}
                onChange={(e) => setPlayer({ ...player, birth_date: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Pé Dominante"
                select
                fullWidth
                size="small"
                value={player.dominant_foot || ''}
                onChange={(e) => setPlayer({ ...player, dominant_foot: e.target.value })}
              >
                <MenuItem value="">Não informado</MenuItem>
                <MenuItem value="Direito">Direito</MenuItem>
                <MenuItem value="Esquerdo">Esquerdo</MenuItem>
                <MenuItem value="Ambidestro">Ambidestro</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Altura (cm)"
                type="number"
                fullWidth
                size="small"
                value={player.height || ''}
                onChange={(e) => setPlayer({ ...player, height: e.target.value ? Number(e.target.value) : null })}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Peso (kg)"
                type="number"
                fullWidth
                size="small"
                value={player.weight || ''}
                onChange={(e) => setPlayer({ ...player, weight: e.target.value ? Number(e.target.value) : null })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Cidade"
                fullWidth
                size="small"
                value={player.city || ''}
                onChange={(e) => setPlayer({ ...player, city: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Estado"
                fullWidth
                size="small"
                value={player.state || ''}
                onChange={(e) => setPlayer({ ...player, state: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Instagram"
                fullWidth
                size="small"
                placeholder="@seuusuario"
                value={player.instagram || ''}
                onChange={(e) => setPlayer({ ...player, instagram: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Instagram fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Bio"
                fullWidth
                size="small"
                multiline
                rows={3}
                placeholder="Conte um pouco sobre você..."
                value={player.bio || ''}
                onChange={(e) => setPlayer({ ...player, bio: e.target.value })}
              />
            </Grid>
          </Grid>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={saving}
            sx={{ mt: 3 }}
          >
            {saving ? <CircularProgress size={24} /> : 'Salvar Perfil'}
          </Button>
        </form>
      </Paper>
    </Container>
  );
}
