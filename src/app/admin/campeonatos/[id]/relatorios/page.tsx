'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Standing, Championship } from '@/types';
import ReportContainer from '@/components/reports/ReportContainer';
import StandingsImage from '@/components/reports/StandingsImage';
import TopScorersImage from '@/components/reports/TopScorersImage';
import { slugify } from '@/lib/utils';
import PageHeader from '@/components/admin/PageHeader';

export default function CampeonatoRelatoriosPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [scorers, setScorers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => { if (!authLoading && !isAdmin) router.push('/admin/login'); }, [isAdmin, authLoading, router]);

  const loadData = useCallback(async () => {
    setLoadingData(true);
    const [champRes, standingsRes, scorersRes] = await Promise.all([
      fetch(`/api/championships/${params.id}`),
      fetch(`/api/championships/${params.id}/standings`),
      fetch(`/api/championships/${params.id}/standings?type=scorers`),
    ]);
    if (champRes.ok) setChampionship(await champRes.json());
    if (standingsRes.ok) setStandings(await standingsRes.json());
    if (scorersRes.ok) setScorers(await scorersRes.json());
    setLoadingData(false);
  }, [params.id]);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  if (authLoading || !isAdmin) return null;
  if (loadingData || !championship) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const slug = slugify(championship.short_name || championship.name);

  return (
    <div>
      <PageHeader title="Relatorios" backHref="/admin/campeonatos">
        <p className="text-sm text-muted-foreground">{championship.name} ({championship.year})</p>
      </PageHeader>

      <div className="space-y-4">
        {/* Standings Table */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-3">Tabela de Classificacao</h3>
            {standings.length > 0 ? (
              <ReportContainer filename={`classificacao-${slug}-${championship.year}`} title="Tabela de Classificacao">
                <StandingsImage standings={standings} championshipName={championship.name} year={championship.year} />
              </ReportContainer>
            ) : (
              <p className="text-muted-foreground">Nenhum dado de classificacao disponivel</p>
            )}
          </CardContent>
        </Card>

        {/* Top Scorers */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-3">Artilharia</h3>
            {scorers.length > 0 ? (
              <ReportContainer filename={`artilharia-${slug}-${championship.year}`} title="Artilharia">
                <TopScorersImage scorers={scorers} championshipName={championship.name} year={championship.year} />
              </ReportContainer>
            ) : (
              <p className="text-muted-foreground">Nenhum gol registrado</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
