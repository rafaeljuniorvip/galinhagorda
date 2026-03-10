'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Users2, Trophy, CircleDot, Gavel,
  Newspaper, Images, Vote, MessageSquare, ShieldCheck, Handshake,
  Smartphone, Menu, ChevronLeft,
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/cn';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/useIsMobile';

const DRAWER_WIDTH = 240;

const menuItems = [
  { text: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { text: 'Jogadores', icon: Users, href: '/admin/jogadores' },
  { text: 'Times', icon: Users2, href: '/admin/times' },
  { text: 'Campeonatos', icon: Trophy, href: '/admin/campeonatos' },
  { text: 'Partidas', icon: CircleDot, href: '/admin/partidas' },
  { text: 'Arbitros', icon: Gavel, href: '/admin/arbitros' },
];

const secondaryMenuItems = [
  { text: 'Noticias', icon: Newspaper, href: '/admin/noticias' },
  { text: 'Fotos', icon: Images, href: '/admin/fotos' },
  { text: 'Votacoes', icon: Vote, href: '/admin/votacoes' },
  { text: 'Mensagens', icon: MessageSquare, href: '/admin/mensagens' },
  { text: 'Patrocinadores', icon: Handshake, href: '/admin/patrocinadores' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isSuperAdmin } = useAuth();

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  const renderItem = (item: { text: string; icon: React.ComponentType<{ className?: string }>; href: string }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link
        key={item.text}
        href={item.href}
        onClick={() => isMobile && setMobileOpen(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
          active
            ? 'bg-primary text-white'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {item.text}
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between h-14 px-4 border-b">
        <span className="text-lg font-bold text-primary">Galinha Gorda</span>
        {isMobile && (
          <button onClick={() => setMobileOpen(false)} className="p-1 rounded hover:bg-accent">
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {menuItems.map(renderItem)}
        <Separator className="my-2" />
        {secondaryMenuItems.map(renderItem)}
        {isSuperAdmin && (
          <>
            <Separator className="my-2" />
            {renderItem({ text: 'Usuarios', icon: ShieldCheck, href: '/admin/usuarios' })}
            {renderItem({ text: 'App Mobile', icon: Smartphone, href: '/admin/mobile' })}
          </>
        )}
      </nav>
    </div>
  );

  return (
    <>
      {isMobile && (
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-3 left-3 z-50 p-2 bg-card rounded-md shadow-md hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}
      <nav
        className="hidden md:block shrink-0"
        style={{ width: DRAWER_WIDTH }}
      >
        <div
          className="fixed top-0 left-0 h-full border-r bg-card overflow-hidden"
          style={{ width: DRAWER_WIDTH }}
        >
          {sidebarContent}
        </div>
      </nav>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-[240px]">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    </>
  );
}
