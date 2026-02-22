'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CircularProgress, Box } from '@mui/material';
import TeamForm from '@/components/admin/TeamForm';
import { useAuth } from '@/contexts/AuthContext';
import { Team } from '@/types';

export default function EditarTimePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!authLoading && !user) router.push('/admin/login'); }, [user, authLoading, router]);
  useEffect(() => {
    async function load() { const res = await fetch(`/api/teams/${params.id}`); if (res.ok) setTeam(await res.json()); setLoading(false); }
    if (user) load();
  }, [params.id, user]);

  if (loading || authLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  if (!team) return null;
  return <TeamForm team={team} />;
}
