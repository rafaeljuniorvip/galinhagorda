'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Star, Images } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { Photo } from '@/types';
import PageHeader from '@/components/admin/PageHeader';
import Pagination from '@/components/admin/Pagination';

const TARGET_TYPES = [
  { value: 'all', label: 'Todos' },
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
  const [targetTypeFilter, setTargetTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadForm, setUploadForm] = useState({ target_type: 'match', target_id: '', caption: '' });

  useEffect(() => { if (!loading && !isAdmin) router.push('/admin/login'); }, [isAdmin, loading, router]);

  const loadPhotos = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: '24' });
    if (targetTypeFilter && targetTypeFilter !== 'all') params.set('target_type', targetTypeFilter);
    const res = await fetch(`/api/photos?${params}`);
    if (res.ok) { const data = await res.json(); setPhotos(data.data); setTotal(data.total); }
  }, [page, targetTypeFilter]);

  useEffect(() => { if (user) loadPhotos(); }, [user, loadPhotos]);

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta foto?')) return;
    await fetch(`/api/photos/${id}`, { method: 'DELETE' });
    loadPhotos();
  };

  const handleSetCover = async (id: string) => {
    await fetch(`/api/photos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ set_cover: true }) });
    loadPhotos();
  };

  const handleUpload = async () => {
    setError(''); setSuccess('');
    if (!uploadForm.target_type || !uploadForm.target_id) { setError('Tipo e ID do alvo sao obrigatorios'); return; }
    if (uploadFiles.length === 0) { setError('Selecione pelo menos uma foto'); return; }
    try {
      for (const file of uploadFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'photos');
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!uploadRes.ok) continue;
        const uploadData = await uploadRes.json();
        await fetch('/api/photos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target_type: uploadForm.target_type, target_id: uploadForm.target_id, url: uploadData.url, caption: uploadForm.caption || null }) });
      }
      setSuccess(`${uploadFiles.length} foto(s) enviada(s)!`);
      setUploadFiles([]); setUploadForm({ target_type: 'match', target_id: '', caption: '' });
      setOpenDialog(false); loadPhotos();
    } catch { setError('Erro ao enviar fotos'); }
  };

  if (loading || !isAdmin) return null;

  return (
    <div>
      <PageHeader title="Fotos">
        <Button onClick={() => setOpenDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Upload Fotos
        </Button>
      </PageHeader>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert className="mb-4 border-green-200 bg-green-50 text-green-800"><AlertDescription>{success}</AlertDescription></Alert>}

      <div className="mb-4">
        <Select value={targetTypeFilter} onValueChange={(v) => { setTargetTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            {TARGET_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {photos.map((photo) => (
          <Card key={photo.id} className="overflow-hidden">
            <div className="aspect-square relative">
              <img src={photo.url} alt={photo.caption || 'Foto'} className="w-full h-full object-cover" />
            </div>
            <CardContent className="p-2">
              <Badge variant="outline" className="mb-1 text-xs">{photo.target_type}</Badge>
              {photo.caption && <p className="text-xs text-muted-foreground truncate">{photo.caption}</p>}
              <div className="flex justify-between mt-1">
                <button onClick={() => handleSetCover(photo.id)} className={`p-1 rounded hover:bg-accent ${photo.is_cover ? 'text-yellow-500' : 'text-muted-foreground'}`} title={photo.is_cover ? 'Capa atual' : 'Definir como capa'}>
                  <Star className="h-4 w-4" fill={photo.is_cover ? 'currentColor' : 'none'} />
                </button>
                <button onClick={() => handleDelete(photo.id)} className="p-1 rounded hover:bg-accent text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {photos.length === 0 && (
        <div className="text-center py-12">
          <Images className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Nenhuma foto encontrada</p>
        </div>
      )}

      {total > 24 && (
        <Pagination page={page} totalPages={Math.ceil(total / 24)} total={total} limit={24} onPageChange={setPage} />
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload de Fotos</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Alvo</Label>
              <Select value={uploadForm.target_type} onValueChange={(v) => setUploadForm(prev => ({ ...prev, target_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TARGET_TYPES.filter(t => t.value !== 'all').map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ID do Alvo</Label>
              <Input value={uploadForm.target_id} onChange={(e) => setUploadForm(prev => ({ ...prev, target_id: e.target.value }))} placeholder="UUID do alvo" />
            </div>
            <div className="md:col-span-2">
              <Label>Legenda (opcional)</Label>
              <Input value={uploadForm.caption} onChange={(e) => setUploadForm(prev => ({ ...prev, caption: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <Button variant="outline" className="w-full" asChild>
                <label className="cursor-pointer">
                  {uploadFiles.length > 0 ? `${uploadFiles.length} arquivo(s) selecionado(s)` : 'Selecionar Fotos'}
                  <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => e.target.files && setUploadFiles(Array.from(e.target.files))} />
                </label>
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button onClick={handleUpload}>Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
