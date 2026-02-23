'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, Grid,
} from '@mui/material';
import { People, Groups, EmojiEvents, SportsSoccer, Newspaper, PhotoLibrary, Forum, HowToVote } from '@mui/icons-material';
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

        // Count active votings from matches data
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
    { label: 'Jogadores', value: stats.players, icon: <People sx={{ fontSize: 40 }} />, color: '#1976d2' },
    { label: 'Times', value: stats.teams, icon: <Groups sx={{ fontSize: 40 }} />, color: '#2e7d32' },
    { label: 'Campeonatos', value: stats.championships, icon: <EmojiEvents sx={{ fontSize: 40 }} />, color: '#ed6c02' },
    { label: 'Partidas', value: stats.matches, icon: <SportsSoccer sx={{ fontSize: 40 }} />, color: '#9c27b0' },
    { label: 'Noticias Publicadas', value: stats.news, icon: <Newspaper sx={{ fontSize: 40 }} />, color: '#0288d1' },
    { label: 'Fotos', value: stats.photos, icon: <PhotoLibrary sx={{ fontSize: 40 }} />, color: '#7b1fa2' },
    { label: 'Msgs Pendentes', value: stats.pendingMessages, icon: <Forum sx={{ fontSize: 40 }} />, color: '#d32f2f' },
    { label: 'Votacoes Ativas', value: stats.activeVotings, icon: <HowToVote sx={{ fontSize: 40 }} />, color: '#388e3c' },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Bem-vindo, {user.name}
      </Typography>

      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid item xs={6} md={3} key={card.label}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
                <Box sx={{ color: card.color }}>{card.icon}</Box>
                <Box>
                  <Typography variant="h4" fontWeight={700}>{card.value}</Typography>
                  <Typography variant="body2" color="text.secondary">{card.label}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
