'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Search, Link2, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { Player, PaginatedResponse } from '@/types';
import { toast } from 'sonner';
import PageHeader from '@/components/admin/PageHeader';
import Pagination from '@/components/admin/Pagination';
import StatusBadge from '@/components/admin/StatusBadge';
import MobileActionsMenu from '@/components/admin/MobileActionsMenu';

export default function AdminJogadoresPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [players, setPlayers] = useState<PaginatedResponse<Player> | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [linkDialog, setLinkDialog] = useState<{ open: boolean; link: string; playerName: string }>({ open: false, link: '', playerName: '' });
  const [linkLoading, setLinkLoading] = useState(false);

  useEffect(() => { if (!loading && !isAdmin) router.push('/admin/login'); }, [isAdmin, loading, router]);

  const loadPlayers = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: '15' });
    if (search) params.set('search', search);
    const res = await fetch(`/api/players?${params}`);
    if (res.ok) setPlayers(await res.json());
  }, [page, search]);

  useEffect(() => { if (user) loadPlayers(); }, [user, loadPlayers]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir jogador "${name}"?`)) return;
    await fetch(`/api/players/${id}`, { method: 'DELETE' });
    loadPlayers();
  };

  const handleGenerateLink = async (id: string, name: string) => {
    setLinkLoading(true);
    try {
      const res = await fetch(`/api/players/${id}/generate-link`, { method: 'POST' });
      if (res.ok) {
        const { link } = await res.json();
        setLinkDialog({ open: true, link, playerName: name });
      } else {
        toast.error('Erro ao gerar link');
      }
    } catch {
      toast.error('Erro ao gerar link');
    } finally {
      setLinkLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(linkDialog.link);
      toast.success('Link copiado!');
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  if (loading || !isAdmin) return null;

  return (
    <div>
      <PageHeader title="Jogadores" action={{ label: 'Novo Jogador', href: '/admin/jogadores/novo', icon: <Plus className="h-4 w-4" /> }} />

      <div className="mb-4">
        <div className="relative w-full md:w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar jogador..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jogador</TableHead>
              <TableHead className="hidden md:table-cell">Posicao</TableHead>
              <TableHead className="hidden md:table-cell">Cidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players?.data.map((player) => (
              <TableRow key={player.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={player.photo_url || ''} alt={player.name} />
                      <AvatarFallback>{player.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-semibold text-sm">{player.name}</span>
                      <p className="text-xs text-muted-foreground">{player.full_name}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{player.position}</TableCell>
                <TableCell className="hidden md:table-cell">{player.city}/{player.state}</TableCell>
                <TableCell><StatusBadge status={player.active ? 'Ativo' : 'Inativo'} /></TableCell>
                <TableCell className="text-right">
                  <MobileActionsMenu actions={[
                    { label: 'Gerar link', icon: <Link2 className="h-4 w-4" />, color: 'primary', onClick: () => handleGenerateLink(player.id, player.name), disabled: linkLoading },
                    { label: 'Editar', icon: <Pencil className="h-4 w-4" />, href: `/admin/jogadores/${player.id}/editar` },
                    { label: 'Excluir', icon: <Trash2 className="h-4 w-4" />, color: 'error', onClick: () => handleDelete(player.id, player.name) },
                  ]} />
                </TableCell>
              </TableRow>
            ))}
            {players?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum jogador encontrado</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {players && (
          <Pagination page={page} totalPages={players.totalPages} total={players.total} limit={15} onPageChange={setPage} />
        )}
      </Card>

      <Dialog open={linkDialog.open} onOpenChange={(open) => setLinkDialog({ ...linkDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link para Completar Perfil</DialogTitle>
            <DialogDescription>
              Envie este link para <strong>{linkDialog.playerName}</strong> preencher o perfil. O link expira em 7 dias e so pode ser usado uma vez.
            </DialogDescription>
          </DialogHeader>
          <Input
            readOnly
            value={linkDialog.link}
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialog({ ...linkDialog, open: false })}>Fechar</Button>
            <Button onClick={handleCopyLink}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
