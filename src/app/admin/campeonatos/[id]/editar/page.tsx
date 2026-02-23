'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CircularProgress, Box } from '@mui/material';
import ChampionshipForm from '@/components/admin/ChampionshipForm';
import { useAuth } from '@/contexts/AuthContext';
import { Championship } from '@/types';

export default function EditarCampeonatoPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!authLoading && !isAdmin) router.push('/admin/login'); }, [isAdmin, authLoading, router]);
  useEffect(() => {
    async function load() { const res = await fetch(`/api/championships/${params.id}`); if (res.ok) setChampionship(await res.json()); setLoading(false); }
    if (user) load();
  }, [params.id, user]);

  if (loading || authLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  if (!championship) return null;
  return <ChampionshipForm championship={championship} />;
}
