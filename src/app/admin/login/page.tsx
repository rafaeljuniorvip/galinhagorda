'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { CircleDot, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

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
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
      </div>
    );
  }

  const accessDenied = user && !isAdmin;

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary p-4">
      <Card className="max-w-[400px] w-full">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <CircleDot className="h-12 w-12 text-primary mx-auto mb-2" />
            <h1 className="text-xl font-bold">Galinha Gorda</h1>
            <p className="text-sm text-muted-foreground">Painel Administrativo</p>
          </div>

          {accessDenied && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                Acesso negado. Sua conta ({user.email}) nao possui permissao de administrador.
              </AlertDescription>
            </Alert>
          )}

          <Button
            className="w-full text-base py-6"
            onClick={handleGoogleLogin}
          >
            <GoogleIcon className="h-5 w-5 mr-2" />
            Entrar com Google
          </Button>

          {accessDenied && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              Solicite acesso ao administrador do sistema.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
