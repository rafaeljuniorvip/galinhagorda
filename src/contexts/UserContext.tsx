'use client';

import { createContext, useContext, ReactNode } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';

interface UserData {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  linked_player_id: string | null;
  linked_team_id: string | null;
}

interface UserContextType {
  user: UserData | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
});

function UserContextInner({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  const loading = status === 'loading';
  const isAuthenticated = status === 'authenticated';

  const user: UserData | null = session?.user
    ? {
        id: (session.user as any).id,
        name: session.user.name || '',
        email: session.user.email || '',
        avatar_url: (session.user as any).avatar_url || session.user.image || null,
        role: (session.user as any).role || 'fan',
        linked_player_id: (session.user as any).linked_player_id || null,
        linked_team_id: (session.user as any).linked_team_id || null,
      }
    : null;

  return (
    <UserContext.Provider value={{ user, loading, isAuthenticated }}>
      {children}
    </UserContext.Provider>
  );
}

export function UserProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <UserContextInner>{children}</UserContextInner>
    </SessionProvider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
