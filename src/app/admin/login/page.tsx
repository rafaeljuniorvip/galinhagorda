'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import {
  Box, Card, CardContent, Button, Typography, Alert, CircularProgress,
} from '@mui/material';
import { SportsSoccer, Google as GoogleIcon } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLoginPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && isAdmin) {
      router.push('/admin');
    }
  }, [loading, user, isAdmin, router]);

  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl: '/admin' });
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a237e' }}>
        <CircularProgress sx={{ color: 'white' }} />
      </Box>
    );
  }

  const accessDenied = user && !isAdmin;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a237e',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <SportsSoccer sx={{ fontSize: 48, color: '#1976d2', mb: 1 }} />
            <Typography variant="h5" fontWeight={700}>
              Galinha Gorda
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Painel Administrativo
            </Typography>
          </Box>

          {accessDenied && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Acesso negado. Sua conta ({user.email}) nao possui permissao de administrador.
            </Alert>
          )}

          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            sx={{
              textTransform: 'none',
              fontSize: '1rem',
              py: 1.5,
              backgroundColor: '#4285F4',
              '&:hover': { backgroundColor: '#3367D6' },
            }}
          >
            Entrar com Google
          </Button>

          {accessDenied && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              Solicite acesso ao administrador do sistema.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
