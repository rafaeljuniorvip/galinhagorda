'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Users2, Trophy, CircleDot, Newspaper, Images, MessageSquare, Vote,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  players: number;
  teams: number;
  championships: number;
  matches: number;
  news: number;
  photos: number;
  pendingMessages: number;
  activeVotings: number;
}

export default function AdminDashboard() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({ players: 0, teams: 0, championships: 0, matches: 0, news: 0, photos: 0, pendingMessages: 0, activeVotings: 0 });

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/admin/login');
    }
  }, [isAdmin, loading, router]);

  useEffect(() => {
    async function loadStats() {
      try {
        const [p, t, c, m, n, ph, pendingMsg, matchesAll] = await Promise.all([
          fetch('/api/players?limit=1').then(r => r.json()),
          fetch('/api/teams?limit=1').then(r => r.json()),
          fetch('/api/championships?limit=1').then(r => r.json()),
          fetch('/api/matches?limit=1').then(r => r.json()),
          fetch('/api/news?published=true&limit=1').then(r => r.json()).catch(() => ({ total: 0 })),
          fetch('/api/photos?limit=1').then(r => r.json()).catch(() => ({ total: 0 })),
          fetch('/api/messages?all=true&approved=false&limit=1').then(r => r.json()).catch(() => ({ total: 0 })),
          fetch('/api/matches?limit=50').then(r => r.json()).catch(() => ({ data: [] })),
        ]);

        const activeVotings = (matchesAll.data || []).filter((match: any) => match.voting_open).length;

        setStats({
          players: p.total || 0,
          teams: t.total || 0,
          championships: c.total || 0,
          matches: m.total || 0,
          news: n.total || 0,
          photos: ph.total || 0,
          pendingMessages: pendingMsg.total || 0,
          activeVotings,
        });
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    }
    if (user) loadStats();
  }, [user]);

  if (loading || !user) return null;

  const cards = [
    { label: 'Jogadores', value: stats.players, icon: Users, color: 'text-primary' },
    { label: 'Times', value: stats.teams, icon: Users2, color: 'text-emerald-600' },
    { label: 'Campeonatos', value: stats.championships, icon: Trophy, color: 'text-amber-600' },
    { label: 'Partidas', value: stats.matches, icon: CircleDot, color: 'text-violet-600' },
    { label: 'Noticias Publicadas', value: stats.news, icon: Newspaper, color: 'text-primary' },
    { label: 'Fotos', value: stats.photos, icon: Images, color: 'text-violet-600' },
    { label: 'Msgs Pendentes', value: stats.pendingMessages, icon: MessageSquare, color: 'text-destructive' },
    { label: 'Votacoes Ativas', value: stats.activeVotings, icon: Vote, color: 'text-emerald-600' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-1">Dashboard</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Bem-vindo, {user.name}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="flex items-center gap-3 p-3 md:p-6">
                <Icon className={`h-8 w-8 md:h-10 md:w-10 shrink-0 ${card.color}`} />
                <div>
                  <p className="text-xl md:text-3xl font-bold">{card.value}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">{card.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
