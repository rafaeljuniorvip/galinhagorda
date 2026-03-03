'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, CheckCircle, XCircle, Pin, PinOff } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { FanMessage } from '@/types';
import { formatDateTime } from '@/lib/utils';
import PageHeader from '@/components/admin/PageHeader';
import Pagination from '@/components/admin/Pagination';
import StatusBadge from '@/components/admin/StatusBadge';
import MobileActionsMenu from '@/components/admin/MobileActionsMenu';

const TARGET_TYPE_LABELS: Record<string, string> = {
  match: 'Partida',
  player: 'Jogador',
  team: 'Time',
  championship: 'Campeonato',
};

export default function AdminMensagensPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<FanMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [approvedFilter, setApprovedFilter] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { if (!loading && !isAdmin) router.push('/admin/login'); }, [isAdmin, loading, router]);

  const loadMessages = useCallback(async () => {
    const params = new URLSearchParams({ all: 'true', page: String(page), limit: '20' });
    if (approvedFilter === 'approved') params.set('approved', 'true');
    if (approvedFilter === 'pending') params.set('approved', 'false');
    const res = await fetch(`/api/messages?${params}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages);
      setTotal(data.total);
    }
  }, [page, approvedFilter]);

  useEffect(() => { if (user) loadMessages(); }, [user, loadMessages]);

  const handleToggleApproval = async (id: string) => {
    setError(''); setSuccess('');
    const res = await fetch(`/api/messages/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggleApproval' }) });
    if (res.ok) { setSuccess('Status atualizado!'); loadMessages(); } else { setError('Erro ao atualizar status'); }
  };

  const handleTogglePin = async (id: string) => {
    setError(''); setSuccess('');
    const res = await fetch(`/api/messages/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'togglePin' }) });
    if (res.ok) { setSuccess('Fixacao atualizada!'); loadMessages(); } else { setError('Erro ao atualizar fixacao'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta mensagem?')) return;
    const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' });
    if (res.ok) { setSuccess('Mensagem excluida!'); loadMessages(); } else { setError('Erro ao excluir mensagem'); }
  };

  if (loading || !isAdmin) return null;

  return (
    <div>
      <PageHeader title="Moderacao de Mensagens" />

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert className="mb-4 border-green-200 bg-green-50 text-green-800"><AlertDescription>{success}</AlertDescription></Alert>}

      <div className="mb-4">
        <Select value={approvedFilter} onValueChange={(v) => { setApprovedFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filtro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="approved">Aprovadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Autor</TableHead>
              <TableHead>Mensagem</TableHead>
              <TableHead className="hidden md:table-cell">Alvo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Data</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages.map((msg) => (
              <TableRow key={msg.id} className={!msg.is_approved ? 'bg-amber-50' : ''}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={msg.author_avatar || ''} />
                      <AvatarFallback className="text-xs">{msg.author_name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{msg.author_name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm max-w-[150px] md:max-w-[300px] truncate">{msg.message}</p>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="outline">{TARGET_TYPE_LABELS[msg.target_type] || msg.target_type}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    <StatusBadge status={msg.is_approved ? 'Aprovada' : 'Pendente'} />
                    {msg.is_pinned && <Badge className="bg-blue-100 text-blue-800 border-blue-200">Fixada</Badge>}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{formatDateTime(msg.created_at)}</TableCell>
                <TableCell className="text-right">
                  <MobileActionsMenu actions={[
                    { label: msg.is_approved ? 'Reprovar' : 'Aprovar', icon: msg.is_approved ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />, color: msg.is_approved ? 'error' : 'success', onClick: () => handleToggleApproval(msg.id) },
                    { label: msg.is_pinned ? 'Desfixar' : 'Fixar', icon: msg.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />, color: msg.is_pinned ? 'primary' : 'inherit', onClick: () => handleTogglePin(msg.id) },
                    { label: 'Excluir', icon: <Trash2 className="h-4 w-4" />, color: 'error', onClick: () => handleDelete(msg.id) },
                  ]} />
                </TableCell>
              </TableRow>
            ))}
            {messages.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma mensagem encontrada</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {total > 20 && (
          <Pagination page={page} totalPages={Math.ceil(total / 20)} total={total} limit={20} onPageChange={setPage} />
        )}
      </Card>
    </div>
  );
}
