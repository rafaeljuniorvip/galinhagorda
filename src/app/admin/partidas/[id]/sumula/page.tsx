'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { Print } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { Match, MatchEvent, MatchLineup, Championship } from '@/types';

const EVENT_LABELS: Record<string, string> = {
  GOL: 'Gol',
  GOL_PENALTI: 'Gol (Penalti)',
  GOL_CONTRA: 'Gol Contra',
  CARTAO_AMARELO: 'Cartao Amarelo',
  CARTAO_VERMELHO: 'Cartao Vermelho',
  SEGUNDO_AMARELO: 'Segundo Amarelo',
  SUBSTITUICAO_ENTRADA: 'Substituicao (Ent)',
  SUBSTITUICAO_SAIDA: 'Substituicao (Sai)',
};

function formatSumulaDate(date: string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function SumulaPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [lineups, setLineups] = useState<{ home: MatchLineup[]; away: MatchLineup[] }>({ home: [], away: [] });
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push('/admin/login');
  }, [isAdmin, authLoading, router]);

  const loadData = useCallback(async () => {
    setLoadingData(true);
    const [matchRes, eventsRes, lineupsRes] = await Promise.all([
      fetch(`/api/matches/${params.id}`),
      fetch(`/api/matches/${params.id}/events`),
      fetch(`/api/matches/${params.id}/lineups`),
    ]);
    if (matchRes.ok) {
      const m = await matchRes.json();
      setMatch(m);
      const champRes = await fetch(`/api/championships/${m.championship_id}`);
      if (champRes.ok) setChampionship(await champRes.json());
    }
    if (eventsRes.ok) setEvents(await eventsRes.json());
    if (lineupsRes.ok) setLineups(await lineupsRes.json());
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

  const goals = events.filter(e => ['GOL', 'GOL_PENALTI', 'GOL_CONTRA'].includes(e.event_type));
  const yellows = events.filter(e => ['CARTAO_AMARELO', 'SEGUNDO_AMARELO'].includes(e.event_type));
  const reds = events.filter(e => e.event_type === 'CARTAO_VERMELHO');

  const homeStarters = lineups.home.filter(l => l.is_starter);
  const homeSubs = lineups.home.filter(l => !l.is_starter);
  const awayStarters = lineups.away.filter(l => l.is_starter);
  const awaySubs = lineups.away.filter(l => !l.is_starter);

  const cellStyle = { border: '1px solid #333', padding: '4px 8px', fontSize: 12 };
  const headerCellStyle = { ...cellStyle, fontWeight: 700, backgroundColor: '#e0e0e0' };

  return (
    <>
      <style>{`
        @media print {
          nav, header, aside, .admin-sidebar, .MuiDrawer-root, .no-print { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; max-width: 100% !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4; margin: 12mm; }
        }
      `}</style>

      {/* Print button */}
      <Box className="no-print" sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" startIcon={<Print />} onClick={() => window.print()}>
          Imprimir Sumula
        </Button>
      </Box>

      <Box sx={{ maxWidth: 800, mx: 'auto', fontFamily: '"Inter", sans-serif', color: '#000', fontSize: 12 }}>
        {/* Document Title */}
        <Box sx={{ textAlign: 'center', mb: 2, borderBottom: '2px solid #000', pb: 1 }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, textTransform: 'uppercase' }}>
            Sumula de Partida
          </Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
            {championship?.name} {championship?.year}
          </Typography>
          <Typography sx={{ fontSize: 10, color: '#666', mt: 0.5 }}>galinhagorda.vip</Typography>
        </Box>

        {/* Match Info Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
          <tbody>
            {[
              ['Campeonato', `${championship?.name || '-'} (${championship?.year || '-'})`],
              ['Rodada / Fase', match.match_round || '-'],
              ['Data / Hora', formatSumulaDate(match.match_date)],
              ['Local', match.venue || '-'],
              ['Arbitro', match.referee || '-'],
              ['Assistente 1', match.assistant_referee_1 || '-'],
              ['Assistente 2', match.assistant_referee_2 || '-'],
            ].map(([label, value]) => (
              <tr key={label}>
                <td style={{ ...headerCellStyle, width: 150 }}>{label}</td>
                <td style={cellStyle}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Score */}
        <Box sx={{ textAlign: 'center', my: 2, py: 1.5, border: '2px solid #000' }}>
          <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
            {match.home_team_name}
            {'  '}
            <span style={{ fontSize: 28, padding: '0 12px' }}>
              {match.home_score ?? '-'} x {match.away_score ?? '-'}
            </span>
            {'  '}
            {match.away_team_name}
          </Typography>
          <Typography sx={{ fontSize: 11, color: '#666', mt: 0.3 }}>
            Status: {match.status}
          </Typography>
        </Box>

        {/* Lineups - Two columns */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          {/* Home */}
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.5, textTransform: 'uppercase' }}>
              {match.home_team_name}
            </Typography>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <td style={{ ...headerCellStyle, width: 35 }}>N</td>
                  <td style={headerCellStyle}>Jogador</td>
                  <td style={{ ...headerCellStyle, width: 80 }}>Posicao</td>
                </tr>
              </thead>
              <tbody>
                {homeStarters.map(l => (
                  <tr key={l.id}>
                    <td style={{ ...cellStyle, textAlign: 'center' }}>{l.shirt_number || '-'}</td>
                    <td style={cellStyle}>{l.player_name}</td>
                    <td style={cellStyle}>{l.position || '-'}</td>
                  </tr>
                ))}
                {homeSubs.length > 0 && (
                  <tr>
                    <td colSpan={3} style={{ ...headerCellStyle, textAlign: 'center', fontSize: 10, backgroundColor: '#f0f0f0' }}>
                      RESERVAS
                    </td>
                  </tr>
                )}
                {homeSubs.map(l => (
                  <tr key={l.id}>
                    <td style={{ ...cellStyle, textAlign: 'center' }}>{l.shirt_number || '-'}</td>
                    <td style={cellStyle}>{l.player_name}</td>
                    <td style={cellStyle}>{l.position || '-'}</td>
                  </tr>
                ))}
                {lineups.home.length === 0 && (
                  <tr><td colSpan={3} style={{ ...cellStyle, textAlign: 'center', color: '#999' }}>Nao informada</td></tr>
                )}
              </tbody>
            </table>
          </Box>

          {/* Away */}
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.5, textTransform: 'uppercase' }}>
              {match.away_team_name}
            </Typography>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <td style={{ ...headerCellStyle, width: 35 }}>N</td>
                  <td style={headerCellStyle}>Jogador</td>
                  <td style={{ ...headerCellStyle, width: 80 }}>Posicao</td>
                </tr>
              </thead>
              <tbody>
                {awayStarters.map(l => (
                  <tr key={l.id}>
                    <td style={{ ...cellStyle, textAlign: 'center' }}>{l.shirt_number || '-'}</td>
                    <td style={cellStyle}>{l.player_name}</td>
                    <td style={cellStyle}>{l.position || '-'}</td>
                  </tr>
                ))}
                {awaySubs.length > 0 && (
                  <tr>
                    <td colSpan={3} style={{ ...headerCellStyle, textAlign: 'center', fontSize: 10, backgroundColor: '#f0f0f0' }}>
                      RESERVAS
                    </td>
                  </tr>
                )}
                {awaySubs.map(l => (
                  <tr key={l.id}>
                    <td style={{ ...cellStyle, textAlign: 'center' }}>{l.shirt_number || '-'}</td>
                    <td style={cellStyle}>{l.player_name}</td>
                    <td style={cellStyle}>{l.position || '-'}</td>
                  </tr>
                ))}
                {lineups.away.length === 0 && (
                  <tr><td colSpan={3} style={{ ...cellStyle, textAlign: 'center', color: '#999' }}>Nao informada</td></tr>
                )}
              </tbody>
            </table>
          </Box>
        </Box>

        {/* Events */}
        <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.5, textTransform: 'uppercase' }}>
          Eventos da Partida
        </Typography>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
          <thead>
            <tr>
              <td style={{ ...headerCellStyle, width: 50 }}>Tempo</td>
              <td style={{ ...headerCellStyle, width: 40 }}>Min</td>
              <td style={headerCellStyle}>Jogador</td>
              <td style={headerCellStyle}>Time</td>
              <td style={{ ...headerCellStyle, width: 130 }}>Evento</td>
            </tr>
          </thead>
          <tbody>
            {events.map(e => (
              <tr key={e.id}>
                <td style={{ ...cellStyle, textAlign: 'center' }}>{e.half || '-'}</td>
                <td style={{ ...cellStyle, textAlign: 'center' }}>{e.minute ?? '-'}</td>
                <td style={cellStyle}>{e.player_name}</td>
                <td style={cellStyle}>{e.team_name}</td>
                <td style={cellStyle}>{EVENT_LABELS[e.event_type] || e.event_type}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr><td colSpan={5} style={{ ...cellStyle, textAlign: 'center', color: '#999' }}>Nenhum evento registrado</td></tr>
            )}
          </tbody>
        </table>

        {/* Summary sections */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.3 }}>Gols:</Typography>
            <Typography sx={{ fontSize: 11 }}>
              {goals.length > 0
                ? goals.map(g => `${g.player_name} (${g.team_name}${g.minute ? `, ${g.minute}'` : ''})`).join('; ')
                : 'Nenhum'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.3 }}>Cartoes Amarelos:</Typography>
            <Typography sx={{ fontSize: 11 }}>
              {yellows.length > 0
                ? yellows.map(c => `${c.player_name} (${c.team_name}${c.minute ? `, ${c.minute}'` : ''})`).join('; ')
                : 'Nenhum'}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.3 }}>Cartoes Vermelhos:</Typography>
            <Typography sx={{ fontSize: 11 }}>
              {reds.length > 0
                ? reds.map(c => `${c.player_name} (${c.team_name}${c.minute ? `, ${c.minute}'` : ''})`).join('; ')
                : 'Nenhum'}
            </Typography>
          </Box>
        </Box>

        {/* Observations */}
        {match.observations && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.3 }}>Observacoes:</Typography>
            <Typography sx={{ fontSize: 11 }}>{match.observations}</Typography>
          </Box>
        )}

        {/* Signatures */}
        <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #ccc' }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 2, textAlign: 'center' }}>ASSINATURAS</Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            {['Arbitro', 'Delegado', `Repr. ${match.home_team_name}`, `Repr. ${match.away_team_name}`].map(label => (
              <Box key={label} sx={{ flex: 1, textAlign: 'center' }}>
                <Box sx={{ borderBottom: '1px solid #333', mb: 0.5, height: 40 }} />
                <Typography sx={{ fontSize: 10 }}>{label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </>
  );
}
