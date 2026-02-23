'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import NewsForm from '@/components/admin/NewsForm';

export default function NovaNoticiaPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) router.push('/admin/login');
  }, [isAdmin, loading, router]);

  if (loading || !isAdmin) return null;

  return <NewsForm />;
}
