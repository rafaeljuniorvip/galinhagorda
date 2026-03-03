'use client';

import { useState, useEffect, useCallback } from 'react';
import { Megaphone, Send, Pin } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { FanMessage } from '@/types';
import LikeButton from './LikeButton';

interface Props {
  targetType: 'match' | 'player' | 'team' | 'championship';
  targetId: string;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'agora';
  if (diffMin < 60) return `${diffMin}min`;
  if (diffHour < 24) return `${diffHour}h`;
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString('pt-BR');
}

export default function FanWall({ targetType, targetId }: Props) {
  const [messages, setMessages] = useState<FanMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [messageText, setMessageText] = useState('');

  const LIMIT = 10;

  const fetchMessages = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      const res = await fetch(
        `/api/messages?targetType=${targetType}&targetId=${targetId}&page=${pageNum}&limit=${LIMIT}`
      );
      const json = await res.json();

      if (append) {
        setMessages((prev) => [...prev, ...(json.messages || [])]);
      } else {
        setMessages(json.messages || []);
      }
      setTotal(json.total || 0);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [targetType, targetId]);

  useEffect(() => {
    fetchMessages(1);
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchMessages(1), 30000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    setLoadingMore(true);
    fetchMessages(nextPage, true);
  };

  const handleSend = async () => {
    if (!messageText.trim()) return;
    if (!authorName.trim()) {
      toast.error('Por favor, informe seu nome');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetId,
          message: messageText.trim(),
          authorName: authorName.trim(),
        }),
      });

      if (res.ok) {
        setMessageText('');
        toast.success('Mensagem publicada!');
        // Refresh messages
        setPage(1);
        await fetchMessages(1);
      } else {
        const json = await res.json();
        toast.error(json.error || 'Erro ao enviar mensagem');
      }
    } catch {
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const hasMore = messages.length < total;

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-border">
      {/* Header */}
      <div
        className="px-4 md:px-6 py-4 flex items-center gap-2"
        style={{ background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)' }}
      >
        <Megaphone className="h-7 w-7 text-white" />
        <h3 className="text-white font-extrabold uppercase tracking-wide text-[0.95rem] sm:text-lg">
          Mural da Torcida
        </h3>
        {total > 0 && (
          <Badge className="ml-auto bg-white/20 text-white font-bold border-0 hover:bg-white/30">
            {total}
          </Badge>
        )}
      </div>

      {/* Input form */}
      <div className="px-4 md:px-6 py-4 bg-[#fafafa] border-b border-border">
        <Input
          placeholder="Seu nome"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          maxLength={50}
          className="mb-3"
        />
        <div className="flex gap-2 items-start">
          <Textarea
            placeholder="Deixe sua mensagem para a torcida..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            maxLength={280}
            rows={2}
            className="min-h-[60px] resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={sending || !messageText.trim()}
            className="min-w-[48px] h-12 bg-[#1976d2] hover:bg-[#1565c0]"
            size="icon"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        <span
          className={cn(
            'text-xs mt-1 block text-right',
            messageText.length > 260 ? 'text-[#e53935]' : 'text-muted-foreground'
          )}
        >
          {messageText.length}/280
        </span>
      </div>

      {/* Messages */}
      <div className="px-4 md:px-6 py-2">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="py-3">
              <div className="flex gap-3 mb-2">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-[120px] mb-1" />
                  <Skeleton className="h-4 w-[80%] mb-1" />
                  <Skeleton className="h-4 w-[50%]" />
                </div>
              </div>
              {i < 3 && <Separator />}
            </div>
          ))
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <Megaphone className="h-12 w-12 text-black/10 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhuma mensagem ainda. Seja o primeiro a comentar!
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div key={msg.id}>
                <div className="py-3">
                  {msg.is_pinned && (
                    <Badge
                      variant="secondary"
                      className="mb-2 h-[22px] text-[0.65rem] bg-[#1976d2]/8 text-[#1976d2] border-0"
                    >
                      <Pin className="h-3.5 w-3.5 mr-1 text-[#1976d2]" />
                      Fixada
                    </Badge>
                  )}
                  <div className="flex gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={msg.author_avatar || ''} />
                      <AvatarFallback className="bg-[#1976d2] text-white text-xs font-bold">
                        {msg.author_name?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-[#333]">
                          {msg.author_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {timeAgo(msg.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-[#555] leading-relaxed break-words">
                        {msg.message}
                      </p>
                      <div className="mt-1">
                        <LikeButton
                          messageId={msg.id}
                          initialCount={msg.likes_count}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {idx < messages.length - 1 && <Separator />}
              </div>
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="text-center py-4">
                <Button
                  variant="ghost"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="text-[#1976d2] font-semibold hover:text-[#1565c0]"
                >
                  {loadingMore ? 'Carregando...' : 'Carregar mais'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
