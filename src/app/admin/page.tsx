'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, Grid,
} from '@mui/material';
import { People, Groups, EmojiEvents, SportsSoccer } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  players: number;
  teams: number;
  championships: number;
  matches: number;
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({ players: 0, teams: 0, championships: 0, matches: 0 });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function loadStats() {
      try {
        const [p, t, c, m] = await Promise.all([
          fetch('/api/players?limit=1').then(r => r.json()),
          fetch('/api/teams?limit=1').then(r => r.json()),
          fetch('/api/championships?limit=1').then(r => r.json()),
          fetch('/api/matches?limit=1').then(r => r.json()),
        ]);
        setStats({
          players: p.total || 0,
          teams: t.total || 0,
          championships: c.total || 0,
          matches: m.total || 0,
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
