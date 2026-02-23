'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CircularProgress, Box } from '@mui/material';
import MatchForm from '@/components/admin/MatchForm';
import { useAuth } from '@/contexts/AuthContext';
import { Match } from '@/types';

export default function EditarPartidaPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!authLoading && !isAdmin) router.push('/admin/login'); }, [isAdmin, authLoading, router]);
  useEffect(() => {
    async function load() { const res = await fetch(`/api/matches/${params.id}`); if (res.ok) setMatch(await res.json()); setLoading(false); }
    if (user) load();
  }, [params.id, user]);

  if (loading || authLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  if (!match) return null;
  return <MatchForm match={match} />;
}
