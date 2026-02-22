'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import {
  Box, Typography, Button, Paper, CircularProgress, Alert,
} from '@mui/material';
import { Google as GoogleIcon, SportsSoccer } from '@mui/icons-material';

export default function LoginPage() {
  return (
    <Suspense fallback={<Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') || '/meu-perfil';

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signIn('google', { callbackUrl });
    } catch {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 140px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a237e 0%, #0d1642 50%, #1a237e 100%)',
        py: 4,
        px: 2,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          maxWidth: 420,
          width: '100%',
          p: 4,
          borderRadius: 3,
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.97)',
        }}
      >
        {/* Logo */}
        <Box sx={{ mb: 3 }}>
          <SportsSoccer sx={{ fontSize: 56, color: '#1a237e', mb: 1 }} />
          <Typography variant="h5" fontWeight={800} sx={{ color: '#1a237e' }}>
            GALINHA GORDA
          </Typography>
          <Typography variant="caption" sx={{ color: '#ffd600', fontWeight: 700, fontSize: '0.75rem' }}>
            ITAPECERICA - MG
          </Typography>
        </Box>

        {/* Title */}
        <Typography variant="h6" fontWeight={600} sx={{ mb: 1, color: '#333' }}>
          Acesse sua conta
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Entre com sua conta Google para acessar o portal do torcedor,
          acompanhar seus times e jogadores favoritos.
        </Typography>

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error === 'OAuthSignin' && 'Erro ao iniciar login com Google.'}
            {error === 'OAuthCallback' && 'Erro na resposta do Google.'}
            {error === 'OAuthAccountNotLinked' && 'Este email ja esta vinculado a outra conta.'}
            {error === 'Callback' && 'Erro durante o login. Tente novamente.'}
            {!['OAuthSignin', 'OAuthCallback', 'OAuthAccountNotLinked', 'Callback'].includes(error) &&
              'Ocorreu um erro. Tente novamente.'}
          </Alert>
        )}

        {/* Google Button */}
        <Button
          variant="contained"
          fullWidth
          size="large"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <GoogleIcon />}
          onClick={handleGoogleLogin}
          disabled={loading}
          sx={{
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            textTransform: 'none',
            backgroundColor: '#1a237e',
            '&:hover': {
              backgroundColor: '#0d1642',
            },
            '&:disabled': {
              backgroundColor: '#9e9e9e',
              color: 'white',
            },
            borderRadius: 2,
            mb: 2,
          }}
        >
          {loading ? 'Conectando...' : 'Entrar com Google'}
        </Button>

        {/* Info */}
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
          <Typography variant="caption" color="text.secondary">
            Ao entrar, voce concorda com os termos de uso da plataforma.
            Seus dados serao utilizados apenas para identificacao no sistema.
          </Typography>
        </Box>

        {/* Features */}
        <Box sx={{ mt: 3, textAlign: 'left' }}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1, color: '#333' }}>
            Com sua conta voce pode:
          </Typography>
          {[
            'Acompanhar campeonatos e jogos',
            'Votar no craque da partida',
            'Vincular seu perfil de jogador',
            'Receber notificacoes sobre seus times',
          ].map((text, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Box
                sx={{
                  width: 6, height: 6, borderRadius: '50%',
                  backgroundColor: '#ffd600', flexShrink: 0,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {text}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
}
