'use client';

import { LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/useIsMobile';

export default function AdminHeader() {
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-end h-14 border-b bg-card px-4 md:px-6 gap-2">
      {user && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 border rounded-full px-2 py-1">
            <Avatar className="h-6 w-6">
              {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
              <AvatarFallback className="text-xs">{user.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            {!isMobile && <span className="text-sm font-medium">{user.name}</span>}
          </div>
          {isMobile ? (
            <button onClick={handleLogout} className="p-1.5 rounded hover:bg-accent" title="Sair">
              <LogOut className="h-4 w-4" />
            </button>
          ) : (
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" />
              Sair
            </Button>
          )}
        </div>
      )}
    </header>
  );
}
