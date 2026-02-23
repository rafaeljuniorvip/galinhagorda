'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CircularProgress, Box } from '@mui/material';
import NewsForm from '@/components/admin/NewsForm';
import { useAuth } from '@/contexts/AuthContext';
import { NewsArticle } from '@/types';

export default function EditarNoticiaPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [news, setNews] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push('/admin/login');
  }, [isAdmin, authLoading, router]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/news/${params.id}`);
      if (res.ok) setNews(await res.json());
      setLoading(false);
    }
    if (user) load();
  }, [params.id, user]);

  if (loading || authLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }
  if (!news) return null;

  return <NewsForm news={news} />;
}
