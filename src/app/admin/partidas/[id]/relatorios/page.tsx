'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Match, MatchEvent, Championship } from '@/types';
import ReportContainer from '@/components/reports/ReportContainer';
import MatchEventsImage from '@/components/reports/MatchEventsImage';
import MatchArt from '@/components/reports/MatchArt';
import { slugify } from '@/lib/utils';
import PageHeader from '@/components/admin/PageHeader';

export default function PartidaRelatoriosPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => { if (!authLoading && !isAdmin) router.push('/admin/login'); }, [isAdmin, authLoading, router]);

  const loadData = useCallback(async () => {
    setLoadingData(true);
    const [matchRes, eventsRes] = await Promise.all([fetch(`/api/matches/${params.id}`), fetch(`/api/matches/${params.id}/events`)]);
    if (matchRes.ok) {
      const m = await matchRes.json(); setMatch(m);
      const champRes = await fetch(`/api/championships/${m.championship_id}`);
      if (champRes.ok) setChampionship(await champRes.json());
    }
    if (eventsRes.ok) setEvents(await eventsRes.json());
    setLoadingData(false);
  }, [params.id]);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  if (authLoading || !isAdmin) return null;
  if (loadingData || !match) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const homeShort = slugify(match.home_team_short || match.home_team_name || 'casa');
  const awayShort = slugify(match.away_team_short || match.away_team_name || 'visitante');
  const dateStr = match.match_date ? new Date(match.match_date).toISOString().slice(0, 10) : '';

  return (
    <div>
      <PageHeader title="Relatorios da Partida" backHref="/admin/partidas">
        <p className="text-sm text-muted-foreground">{match.home_team_name} {match.home_score ?? '-'} x {match.away_score ?? '-'} {match.away_team_name}</p>
      </PageHeader>

      <div className="space-y-4">
        {/* Match Art */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-3">Arte do Jogo (Redes Sociais)</h3>
            <ReportContainer filename={`arte-${homeShort}-x-${awayShort}`} title="Arte do Jogo" width={1080} bgColor="#0a1628" previewScale={0.4}>
              <MatchArt match={match} championshipName={championship?.name || ''} />
            </ReportContainer>
          </CardContent>
        </Card>

        {/* Match Events Report */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-3">Relatorio de Eventos / Cartoes</h3>
            {events.length > 0 ? (
              <ReportContainer filename={`relatorio-${homeShort}-x-${awayShort}-${dateStr}`} title="Relatorio de Eventos">
                <MatchEventsImage match={match} events={events} championshipName={championship?.name || ''} />
              </ReportContainer>
            ) : (
              <p className="text-muted-foreground">Nenhum evento registrado nesta partida</p>
            )}
          </CardContent>
        </Card>

        {/* Sumula Link */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-3">Sumula do Jogo</h3>
            <p className="text-sm text-muted-foreground mb-3">Documento oficial da partida para impressao, com escalacoes, eventos e area de assinaturas.</p>
            <Button variant="outline" asChild>
              <Link href={`/admin/partidas/${params.id}/sumula`} target="_blank"><Printer className="h-4 w-4 mr-1" />Abrir Sumula para Impressao</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
