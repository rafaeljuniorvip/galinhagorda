'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Divider,
  Alert,
  Snackbar,
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import SendIcon from '@mui/icons-material/Send';
import PushPinIcon from '@mui/icons-material/PushPin';
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
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

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
      setSnackbar({ open: true, message: 'Por favor, informe seu nome', severity: 'error' });
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
        setSnackbar({ open: true, message: 'Mensagem publicada!', severity: 'success' });
        // Refresh messages
        setPage(1);
        await fetchMessages(1);
      } else {
        const json = await res.json();
        setSnackbar({ open: true, message: json.error || 'Erro ao enviar mensagem', severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Erro ao enviar mensagem', severity: 'error' });
    } finally {
      setSending(false);
    }
  };

  const hasMore = messages.length < total;

  return (
    <Box
      sx={{
        bgcolor: '#fff',
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          px: { xs: 2, md: 3 },
          py: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <CampaignIcon sx={{ color: '#fff', fontSize: 28 }} />
        <Typography
          variant="h6"
          sx={{
            color: '#fff',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: 1,
            fontSize: { xs: '0.95rem', sm: '1.1rem' },
          }}
        >
          Mural da Torcida
        </Typography>
        {total > 0 && (
          <Chip
            label={total}
            size="small"
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: '#fff',
              fontWeight: 700,
              ml: 'auto',
            }}
          />
        )}
      </Box>

      {/* Input form */}
      <Box sx={{ px: { xs: 2, md: 3 }, py: 2, bgcolor: '#fafafa', borderBottom: '1px solid', borderColor: 'divider' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Seu nome"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          sx={{ mb: 1.5 }}
          inputProps={{ maxLength: 50 }}
        />
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={4}
            placeholder="Deixe sua mensagem para a torcida..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            inputProps={{ maxLength: 280 }}
            size="small"
          />
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={sending || !messageText.trim()}
            sx={{
              minWidth: 48,
              height: 48,
              bgcolor: '#1976d2',
              '&:hover': { bgcolor: '#1565c0' },
            }}
          >
            <SendIcon />
          </Button>
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: messageText.length > 260 ? '#e53935' : 'text.secondary',
            mt: 0.5,
            display: 'block',
            textAlign: 'right',
          }}
        >
          {messageText.length}/280
        </Typography>
      </Box>

      {/* Messages */}
      <Box sx={{ px: { xs: 2, md: 3 }, py: 1 }}>
        {loading ? (
          [1, 2, 3].map((i) => (
            <Box key={i} sx={{ py: 1.5 }}>
              <Box sx={{ display: 'flex', gap: 1.5, mb: 1 }}>
                <Skeleton variant="circular" width={36} height={36} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width={120} height={20} />
                  <Skeleton variant="text" width="80%" height={18} />
                  <Skeleton variant="text" width="50%" height={18} />
                </Box>
              </Box>
              {i < 3 && <Divider />}
            </Box>
          ))
        ) : messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CampaignIcon sx={{ fontSize: 48, color: 'rgba(0,0,0,0.1)', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Nenhuma mensagem ainda. Seja o primeiro a comentar!
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <Box key={msg.id}>
                <Box sx={{ py: 1.5 }}>
                  {msg.is_pinned && (
                    <Chip
                      icon={<PushPinIcon sx={{ fontSize: 14 }} />}
                      label="Fixada"
                      size="small"
                      sx={{
                        mb: 1,
                        height: 22,
                        fontSize: '0.65rem',
                        bgcolor: 'rgba(25,118,210,0.08)',
                        color: '#1976d2',
                        '& .MuiChip-icon': { color: '#1976d2' },
                      }}
                    />
                  )}
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Avatar
                      src={msg.author_avatar || ''}
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: '#1976d2',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                      }}
                    >
                      {msg.author_name?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#333' }}>
                          {msg.author_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {timeAgo(msg.created_at)}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#555',
                          lineHeight: 1.5,
                          wordBreak: 'break-word',
                        }}
                      >
                        {msg.message}
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <LikeButton
                          messageId={msg.id}
                          initialCount={msg.likes_count}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Box>
                {idx < messages.length - 1 && <Divider />}
              </Box>
            ))}

            {/* Load more */}
            {hasMore && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Button
                  variant="text"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  sx={{ color: '#1976d2', fontWeight: 600 }}
                >
                  {loadingMore ? 'Carregando...' : 'Carregar mais'}
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
