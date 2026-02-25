'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CircularProgress, Box } from '@mui/material';
import RefereeForm from '@/components/admin/RefereeForm';
import { useAuth } from '@/contexts/AuthContext';
import { Referee } from '@/types';

export default function EditarArbitroPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [referee, setReferee] = useState<Referee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push('/admin/login');
  }, [isAdmin, authLoading, router]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/referees/${params.id}`);
      if (res.ok) setReferee(await res.json());
      setLoading(false);
    }
    if (user) load();
  }, [params.id, user]);

  if (loading || authLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  if (!referee) return null;
  return <RefereeForm referee={referee} />;
}
