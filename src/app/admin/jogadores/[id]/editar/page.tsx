'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CircularProgress, Box } from '@mui/material';
import PlayerForm from '@/components/admin/PlayerForm';
import { useAuth } from '@/contexts/AuthContext';
import { Player } from '@/types';

export default function EditarJogadorPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/admin/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/players/${params.id}`);
      if (res.ok) setPlayer(await res.json());
      setLoading(false);
    }
    if (user) load();
  }, [params.id, user]);

  if (loading || authLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  if (!player) return null;
  return <PlayerForm player={player} />;
}
