'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X, CircleDot, LogIn, User, Bell, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/cn';
import { useIsMobile } from '@/hooks/useIsMobile';

const navItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Jogadores', href: '/jogadores' },
  { label: 'Times', href: '/times' },
  { label: 'Campeonatos', href: '/campeonatos' },
  { label: 'Noticias', href: '/noticias' },
  { label: 'Apoiadores', href: '/apoiadores' },
];

export default function PublicHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const userName = session?.user?.name || '';
  const userAvatar = (session?.user as any)?.avatar_url || session?.user?.image || '';

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await signOut({ callbackUrl: '/' });
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#1a237e] border-b-[3px] border-yellow-400">
        <div className="max-w-7xl w-full mx-auto flex items-center h-16 px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mr-8">
            <CircleDot className="h-8 w-8 text-yellow-400" />
            <div>
              <p className="text-white font-extrabold text-sm md:text-lg leading-none">GALINHA GORDA</p>
              <p className="text-yellow-400 text-[0.65rem]">ITAPECERICA - MG</p>
            </div>
          </Link>

          {!isMobile ? (
            <>
              {/* Desktop nav */}
              <nav className="flex gap-1 ml-auto">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'px-3 py-2 text-sm font-medium transition-colors border-b-2',
                      isActive(item.href)
                        ? 'text-yellow-400 border-yellow-400 font-bold'
                        : 'text-white border-transparent hover:text-yellow-400'
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              {/* User area - desktop */}
              <div className="ml-3 relative" ref={menuRef}>
                {isAuthenticated ? (
                  <>
                    <button onClick={() => setMenuOpen(!menuOpen)} className="p-0.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400">
                      <Avatar className="h-9 w-9 border-2 border-yellow-400">
                        <AvatarImage src={userAvatar} />
                        <AvatarFallback className="text-sm bg-yellow-400 text-[#1a237e] font-bold">{userName?.charAt(0)?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </button>
                    {menuOpen && (
                      <div className="absolute right-0 mt-2 w-52 bg-card rounded-md shadow-lg border z-50">
                        <div className="px-3 py-2">
                          <p className="text-sm font-semibold">{userName}</p>
                          <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                        </div>
                        <Separator />
                        <button onClick={() => { setMenuOpen(false); router.push('/meu-perfil'); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors">
                          <User className="h-4 w-4" />Meu Perfil
                        </button>
                        <button onClick={() => { setMenuOpen(false); router.push('/meu-perfil'); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors">
                          <Bell className="h-4 w-4" />Notificacoes
                        </button>
                        <Separator />
                        <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-destructive">
                          <LogOut className="h-4 w-4" />Sair
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <Button asChild size="sm" className="bg-yellow-400 text-[#1a237e] font-semibold hover:bg-yellow-300">
                    <Link href="/login"><LogIn className="h-4 w-4 mr-1" />Entrar</Link>
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="ml-auto flex items-center gap-1">
              {isAuthenticated && (
                <button onClick={() => setMenuOpen(!menuOpen)} className="p-0.5 rounded-full">
                  <Avatar className="h-8 w-8 border-2 border-yellow-400">
                    <AvatarImage src={userAvatar} />
                    <AvatarFallback className="text-xs bg-yellow-400 text-[#1a237e] font-bold">{userName?.charAt(0)?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                </button>
              )}
              <button onClick={() => setDrawerOpen(true)} className="p-2 text-white hover:text-yellow-400">
                <Menu className="h-6 w-6" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* User dropdown - mobile (rendered as absolute overlay) */}
      {isAuthenticated && menuOpen && isMobile && (
        <div ref={menuRef} className="fixed top-[67px] right-2 w-52 bg-card rounded-md shadow-lg border z-50">
          <div className="px-3 py-2">
            <p className="text-sm font-semibold">{userName}</p>
            <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
          </div>
          <Separator />
          <button onClick={() => { setMenuOpen(false); router.push('/meu-perfil'); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent">
            <User className="h-4 w-4" />Meu Perfil
          </button>
          <Separator />
          <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent text-destructive">
            <LogOut className="h-4 w-4" />Sair
          </button>
        </div>
      )}

      {/* Mobile drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-[260px] p-0">
          <div className="p-4">
            <button onClick={() => setDrawerOpen(false)} className="mb-3 p-1 rounded hover:bg-accent">
              <X className="h-5 w-5" />
            </button>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setDrawerOpen(false)}
                  className={cn(
                    'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  )}
                >
                  {item.label}
                </Link>
              ))}
              {!isAuthenticated && (
                <>
                  <Separator className="my-2" />
                  <Link
                    href="/login"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold text-[#1a237e]"
                  >
                    <LogIn className="h-4 w-4" />Entrar
                  </Link>
                </>
              )}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
