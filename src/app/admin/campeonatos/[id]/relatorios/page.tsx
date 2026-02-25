'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Box, Typography, Button, Card, CardContent, Grid, CircularProgress } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { Standing, Championship } from '@/types';
import ReportContainer from '@/components/reports/ReportContainer';
import StandingsImage from '@/components/reports/StandingsImage';
import TopScorersImage from '@/components/reports/TopScorersImage';
import { slugify } from '@/lib/utils';

export default function CampeonatoRelatoriosPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [scorers, setScorers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push('/admin/login');
  }, [isAdmin, authLoading, router]);

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

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  if (authLoading || !isAdmin) return null;

  if (loadingData || !championship) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const slug = slugify(championship.short_name || championship.name);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button component={Link} href="/admin/campeonatos" startIcon={<ArrowBack />} color="inherit">
          Voltar
        </Button>
        <Box>
          <Typography variant="h4" fontWeight={700}>Relatorios</Typography>
          <Typography variant="body2" color="text.secondary">
            {championship.name} ({championship.year})
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Standings Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Tabela de Classificacao
              </Typography>
              {standings.length > 0 ? (
                <ReportContainer filename={`classificacao-${slug}-${championship.year}`} title="Tabela de Classificacao">
                  <StandingsImage
                    standings={standings}
                    championshipName={championship.name}
                    year={championship.year}
                  />
                </ReportContainer>
              ) : (
                <Typography color="text.secondary">Nenhum dado de classificacao disponivel</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top Scorers */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Artilharia
              </Typography>
              {scorers.length > 0 ? (
                <ReportContainer filename={`artilharia-${slug}-${championship.year}`} title="Artilharia">
                  <TopScorersImage
                    scorers={scorers}
                    championshipName={championship.name}
                    year={championship.year}
                  />
                </ReportContainer>
              ) : (
                <Typography color="text.secondary">Nenhum gol registrado</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
