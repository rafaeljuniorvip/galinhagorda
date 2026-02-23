'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useSession, signOut } from 'next-auth/react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  isSuperAdmin: false,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const loading = status === 'loading';

  const sessionUser = session?.user as any;
  const user: User | null = sessionUser
    ? {
        id: sessionUser.id || '',
        name: sessionUser.name || '',
        email: sessionUser.email || '',
        role: sessionUser.role || 'fan',
        avatar_url: sessionUser.avatar_url || sessionUser.image,
      }
    : null;

  const role = user?.role || '';
  const isAdmin = role === 'admin' || role === 'superadmin';
  const isSuperAdmin = role === 'superadmin';

  const logout = async () => {
    await signOut({ callbackUrl: '/admin/login' });
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isSuperAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
