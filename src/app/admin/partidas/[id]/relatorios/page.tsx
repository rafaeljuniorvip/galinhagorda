'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box, Typography, Button, Card, CardContent, Grid, CircularProgress,
} from '@mui/material';
import { ArrowBack, Print } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { Match, MatchEvent, Championship } from '@/types';
import ReportContainer from '@/components/reports/ReportContainer';
import MatchEventsImage from '@/components/reports/MatchEventsImage';
import MatchArt from '@/components/reports/MatchArt';
import { slugify } from '@/lib/utils';

export default function PartidaRelatoriosPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push('/admin/login');
  }, [isAdmin, authLoading, router]);

  const loadData = useCallback(async () => {
    setLoadingData(true);
    const [matchRes, eventsRes] = await Promise.all([
      fetch(`/api/matches/${params.id}`),
      fetch(`/api/matches/${params.id}/events`),
    ]);
    if (matchRes.ok) {
      const m = await matchRes.json();
      setMatch(m);
      const champRes = await fetch(`/api/championships/${m.championship_id}`);
      if (champRes.ok) setChampionship(await champRes.json());
    }
    if (eventsRes.ok) setEvents(await eventsRes.json());
    setLoadingData(false);
  }, [params.id]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  if (authLoading || !isAdmin) return null;

  if (loadingData || !match) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const homeShort = slugify(match.home_team_short || match.home_team_name || 'casa');
  const awayShort = slugify(match.away_team_short || match.away_team_name || 'visitante');
  const dateStr = match.match_date ? new Date(match.match_date).toISOString().slice(0, 10) : '';

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button component={Link} href="/admin/partidas" startIcon={<ArrowBack />} color="inherit">
          Voltar
        </Button>
        <Box>
          <Typography variant="h4" fontWeight={700}>Relatorios da Partida</Typography>
          <Typography variant="body2" color="text.secondary">
            {match.home_team_name} {match.home_score ?? '-'} x {match.away_score ?? '-'} {match.away_team_name}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Match Art */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Arte do Jogo (Redes Sociais)
              </Typography>
              <ReportContainer
                filename={`arte-${homeShort}-x-${awayShort}`}
                title="Arte do Jogo"
                width={1080}
                bgColor="#0a1628"
                previewScale={0.4}
              >
                <MatchArt match={match} championshipName={championship?.name || ''} />
              </ReportContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Match Events Report */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Relatorio de Eventos / Cartoes
              </Typography>
              {events.length > 0 ? (
                <ReportContainer filename={`relatorio-${homeShort}-x-${awayShort}-${dateStr}`} title="Relatorio de Eventos">
                  <MatchEventsImage
                    match={match}
                    events={events}
                    championshipName={championship?.name || ''}
                  />
                </ReportContainer>
              ) : (
                <Typography color="text.secondary">Nenhum evento registrado nesta partida</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sumula Link */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Sumula do Jogo
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Documento oficial da partida para impressao, com escalacoes, eventos e area de assinaturas.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Print />}
                component={Link}
                href={`/admin/partidas/${params.id}/sumula`}
                target="_blank"
              >
                Abrir Sumula para Impressao
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
