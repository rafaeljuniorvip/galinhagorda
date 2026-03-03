'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
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
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (!referee) return null;
  return <RefereeForm referee={referee} />;
}
