'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, GripVertical, ExternalLink, Upload, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/admin/PageHeader';
import { toast } from 'sonner';

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  tier: string;
  sort_order: number;
  active: boolean;
  created_at: string;
}

const TIER_LABELS: Record<string, string> = {
  patrocinador: 'Patrocinador',
  apoiador: 'Apoiador',
  parceiro: 'Parceiro',
};

const TIER_COLORS: Record<string, string> = {
  patrocinador: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  apoiador: 'bg-blue-100 text-blue-800 border-blue-200',
  parceiro: 'bg-green-100 text-green-800 border-green-200',
};

export default function AdminPatrocinadoresPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formLogoUrl, setFormLogoUrl] = useState('');
  const [formWebsiteUrl, setFormWebsiteUrl] = useState('');
  const [formTier, setFormTier] = useState('apoiador');
  const [formSortOrder, setFormSortOrder] = useState('0');
  const [formActive, setFormActive] = useState(true);

  useEffect(() => { if (!loading && !isAdmin) router.push('/admin/login'); }, [isAdmin, loading, router]);

  const loadData = useCallback(async () => {
    const res = await fetch('/api/sponsors?all=true');
    if (res.ok) setSponsors(await res.json());
  }, []);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  const resetForm = () => {
    setFormName('');
    setFormLogoUrl('');
    setFormWebsiteUrl('');
    setFormTier('apoiador');
    setFormSortOrder('0');
    setFormActive(true);
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setShowDialog(true);
  };

  const openEdit = (s: Sponsor) => {
    setEditing(s);
    setFormName(s.name);
    setFormLogoUrl(s.logo_url || '');
    setFormWebsiteUrl(s.website_url || '');
    setFormTier(s.tier);
    setFormSortOrder(String(s.sort_order));
    setFormActive(s.active);
    setShowDialog(true);
  };

  const handleUploadLogo = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'sponsors');
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Erro no upload');
        return;
      }
      const data = await res.json();
      setFormLogoUrl(data.url);
      toast.success('Logo enviado');
    } catch {
      toast.error('Erro no upload');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    const payload = {
      name: formName.trim(),
      logo_url: formLogoUrl || null,
      website_url: formWebsiteUrl || null,
      tier: formTier,
      sort_order: parseInt(formSortOrder) || 0,
      active: formActive,
    };

    const url = editing ? `/api/sponsors/${editing.id}` : '/api/sponsors';
    const method = editing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast.success(editing ? 'Patrocinador atualizado' : 'Patrocinador criado');
      setShowDialog(false);
      loadData();
    } else {
      const err = await res.json();
      toast.error(err.error || 'Erro ao salvar');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir "${name}"?`)) return;
    const res = await fetch(`/api/sponsors/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Excluido');
      loadData();
    }
  };

  if (loading || !isAdmin) return null;

  return (
    <div>
      <PageHeader title="Patrocinadores">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Patrocinador
        </Button>
      </PageHeader>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead className="w-16">Logo</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sponsors.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                    {s.sort_order}
                  </div>
                </TableCell>
                <TableCell>
                  {s.logo_url ? (
                    <img src={s.logo_url} alt={s.name} className="h-10 w-10 object-contain rounded" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">?</div>
                  )}
                </TableCell>
                <TableCell>
                  <div>
                    <span className="font-semibold text-sm">{s.name}</span>
                    {s.website_url && (
                      <a href={s.website_url} target="_blank" rel="noopener" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                        <ExternalLink className="h-3 w-3" />
                        {s.website_url.replace(/^https?:\/\//, '').slice(0, 30)}
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={TIER_COLORS[s.tier] || 'bg-gray-100 text-gray-800'}>
                    {TIER_LABELS[s.tier] || s.tier}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={s.active ? 'default' : 'secondary'}>
                    {s.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(s.id, s.name)} className="p-1.5 rounded hover:bg-accent text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {sponsors.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum patrocinador cadastrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Patrocinador' : 'Novo Patrocinador'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Atualize os dados do patrocinador.' : 'Preencha os dados do novo patrocinador.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nome do patrocinador" />
            </div>

            <div className="space-y-2">
              <Label>Logo</Label>
              {formLogoUrl ? (
                <div className="flex items-center gap-3">
                  <img src={formLogoUrl} alt="Logo" className="h-16 w-16 object-contain rounded border bg-white p-1" />
                  <Button variant="ghost" size="sm" onClick={() => setFormLogoUrl('')}>
                    <X className="h-4 w-4 mr-1" />
                    Remover
                  </Button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    id="logo-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadLogo(file);
                      e.target.value = '';
                    }}
                  />
                  <Button variant="outline" size="sm" asChild disabled={uploading}>
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? 'Enviando...' : 'Enviar logo'}
                    </label>
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Site / URL</Label>
              <Input value={formWebsiteUrl} onChange={(e) => setFormWebsiteUrl(e.target.value)} placeholder="https://..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formTier} onValueChange={setFormTier}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patrocinador">Patrocinador</SelectItem>
                    <SelectItem value="apoiador">Apoiador</SelectItem>
                    <SelectItem value="parceiro">Parceiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ordem</Label>
                <Input type="number" value={formSortOrder} onChange={(e) => setFormSortOrder(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={formActive} onCheckedChange={setFormActive} />
              <Label>Ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editing ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
