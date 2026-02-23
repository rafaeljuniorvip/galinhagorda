'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Button, Card, CardContent, Grid, MenuItem, TextField,
  IconButton, Alert, CardMedia, CardActions, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TablePagination,
} from '@mui/material';
import { Delete, Star, StarBorder, Add, PhotoLibrary } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { Photo } from '@/types';

const TARGET_TYPES = [
  { value: '', label: 'Todos' },
  { value: 'match', label: 'Partida' },
  { value: 'player', label: 'Jogador' },
  { value: 'team', label: 'Time' },
  { value: 'championship', label: 'Campeonato' },
  { value: 'news', label: 'Noticia' },
];

export default function AdminFotosPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [total, setTotal] = useState(0);
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [page, setPage] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);

  const [uploadForm, setUploadForm] = useState({
    target_type: 'match',
    target_id: '',
    caption: '',
  });

  useEffect(() => {
    if (!loading && !isAdmin) router.push('/admin/login');
  }, [isAdmin, loading, router]);

  const loadPhotos = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page + 1), limit: '24' });
    if (targetTypeFilter) params.set('target_type', targetTypeFilter);
    const res = await fetch(`/api/photos?${params}`);
    if (res.ok) {
      const data = await res.json();
      setPhotos(data.data);
      setTotal(data.total);
    }
  }, [page, targetTypeFilter]);

  useEffect(() => {
    if (user) loadPhotos();
  }, [user, loadPhotos]);

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta foto?')) return;
    await fetch(`/api/photos/${id}`, { method: 'DELETE' });
    loadPhotos();
  };

  const handleSetCover = async (id: string) => {
    await fetch(`/api/photos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ set_cover: true }),
    });
    loadPhotos();
  };

  const handleUpload = async () => {
    setError('');
    setSuccess('');

    if (!uploadForm.target_type || !uploadForm.target_id) {
      setError('Tipo e ID do alvo sao obrigatorios');
      return;
    }

    if (uploadFiles.length === 0) {
      setError('Selecione pelo menos uma foto');
      return;
    }

    try {
      for (const file of uploadFiles) {
        // Upload file
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'photos');
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!uploadRes.ok) continue;
        const uploadData = await uploadRes.json();

        // Create photo record
        await fetch('/api/photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target_type: uploadForm.target_type,
            target_id: uploadForm.target_id,
            url: uploadData.url,
            caption: uploadForm.caption || null,
          }),
        });
      }

      setSuccess(`${uploadFiles.length} foto(s) enviada(s)!`);
      setUploadFiles([]);
      setUploadForm({ target_type: 'match', target_id: '', caption: '' });
      setOpenDialog(false);
      loadPhotos();
    } catch {
      setError('Erro ao enviar fotos');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setUploadFiles(Array.from(files));
    }
  };

  if (loading || !isAdmin) return null;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" fontWeight={700}>Fotos</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpenDialog(true)}>
          Upload Fotos
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Box sx={{ mb: 2 }}>
        <TextField
          select
          label="Tipo"
          size="small"
          value={targetTypeFilter}
          onChange={(e) => { setTargetTypeFilter(e.target.value); setPage(0); }}
          sx={{ width: { xs: '100%', md: 200 } }}
        >
          {TARGET_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
        </TextField>
      </Box>

      <Grid container spacing={2}>
        {photos.map((photo) => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={photo.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="140"
                image={photo.url}
                alt={photo.caption || 'Foto'}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ flexGrow: 1, py: 1, px: 1.5 }}>
                <Chip
                  label={photo.target_type}
                  size="small"
                  variant="outlined"
                  sx={{ mb: 0.5 }}
                />
                {photo.caption && (
                  <Typography variant="caption" display="block" color="text.secondary" noWrap>
                    {photo.caption}
                  </Typography>
                )}
              </CardContent>
              <CardActions sx={{ justifyContent: 'space-between', pt: 0 }}>
                <IconButton
                  size="small"
                  onClick={() => handleSetCover(photo.id)}
                  color={photo.is_cover ? 'warning' : 'default'}
                  title={photo.is_cover ? 'Capa atual' : 'Definir como capa'}
                >
                  {photo.is_cover ? <Star fontSize="small" /> : <StarBorder fontSize="small" />}
                </IconButton>
                <IconButton size="small" color="error" onClick={() => handleDelete(photo.id)}>
                  <Delete fontSize="small" />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
        {photos.length === 0 && (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <PhotoLibrary sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography color="text.secondary">Nenhuma foto encontrada</Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {total > 24 && (
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={24}
          rowsPerPageOptions={[24]}
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload de Fotos</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Tipo de Alvo"
                fullWidth
                size="small"
                value={uploadForm.target_type}
                onChange={(e) => setUploadForm(prev => ({ ...prev, target_type: e.target.value }))}
              >
                {TARGET_TYPES.filter(t => t.value).map(t => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="ID do Alvo"
                fullWidth
                size="small"
                value={uploadForm.target_id}
                onChange={(e) => setUploadForm(prev => ({ ...prev, target_id: e.target.value }))}
                placeholder="UUID do alvo"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Legenda (opcional)"
                fullWidth
                size="small"
                value={uploadForm.caption}
                onChange={(e) => setUploadForm(prev => ({ ...prev, caption: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" component="label" fullWidth>
                {uploadFiles.length > 0 ? `${uploadFiles.length} arquivo(s) selecionado(s)` : 'Selecionar Fotos'}
                <input type="file" hidden accept="image/*" multiple onChange={handleFileSelect} />
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleUpload} variant="contained">Enviar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
