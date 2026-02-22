import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getMatchById } from '@/services/matchService';
import { getEventsByMatch } from '@/services/matchEventService';
import { getStreamingLinks } from '@/services/streamingService';
import { getMatchLineups } from '@/services/lineupService';
import {
  Container,
  Typography,
  Box,
  Avatar,
  Chip,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActionArea,
} from '@mui/material';
import {
  Stadium,
  CalendarMonth,
  Gavel,
  Star,
  PlayCircleOutline,
  OpenInNew,
} from '@mui/icons-material';
import { formatDateTime } from '@/lib/utils';
import StreamingLinksDisplay from '@/components/public/StreamingLinksDisplay';
import MatchLineupDisplay from '@/components/public/MatchLineupDisplay';
import MatchTimeline from '@/components/public/MatchTimeline';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const match = await getMatchById(params.id);
  if (!match) return { title: 'Partida nao encontrada' };
  return {
    title: `${match.home_team_name} x ${match.away_team_name}`,
    description: `${match.championship_name} - ${match.match_round || 'Partida'} | ${match.home_team_name} ${match.home_score ?? '-'} x ${match.away_score ?? '-'} ${match.away_team_name}`,
  };
}

const statusConfig: Record<string, { color: string; bgcolor: string; label: string }> = {
  Agendada: { color: '#546e7a', bgcolor: '#eceff1', label: 'Agendada' },
  'Em Andamento': { color: '#ffffff', bgcolor: '#2e7d32', label: 'Em Andamento' },
  Finalizada: { color: '#ffffff', bgcolor: '#1565c0', label: 'Finalizada' },
  Adiada: { color: '#e65100', bgcolor: '#fff3e0', label: 'Adiada' },
  Cancelada: { color: '#c62828', bgcolor: '#ffebee', label: 'Cancelada' },
  WO: { color: '#c62828', bgcolor: '#ffebee', label: 'W.O.' },
};

export default async function MatchDetailPage({ params }: Props) {
  const match = await getMatchById(params.id);
  if (!match) notFound();

  const [events, streamingLinks, lineups] = await Promise.all([
    getEventsByMatch(params.id),
    getStreamingLinks(params.id),
    getMatchLineups(params.id),
  ]);

  const status = statusConfig[match.status] || statusConfig.Agendada;
  const isLive = match.status === 'Em Andamento';
  const hasAnyLiveStream = streamingLinks.some((l) => l.is_live);

  // Compute simple stats from events
  const homeGoals = events.filter(
    (e) =>
      e.team_id === match.home_team_id &&
      ['GOL', 'GOL_PENALTI'].includes(e.event_type)
  ).length;
  const awayGoals = events.filter(
    (e) =>
      e.team_id === match.away_team_id &&
      ['GOL', 'GOL_PENALTI'].includes(e.event_type)
  ).length;
  const homeYellows = events.filter(
    (e) =>
      e.team_id === match.home_team_id &&
      ['CARTAO_AMARELO', 'SEGUNDO_AMARELO'].includes(e.event_type)
  ).length;
  const awayYellows = events.filter(
    (e) =>
      e.team_id === match.away_team_id &&
      ['CARTAO_AMARELO', 'SEGUNDO_AMARELO'].includes(e.event_type)
  ).length;
  const homeReds = events.filter(
    (e) =>
      e.team_id === match.home_team_id &&
      ['CARTAO_VERMELHO'].includes(e.event_type)
  ).length;
  const awayReds = events.filter(
    (e) =>
      e.team_id === match.away_team_id &&
      ['CARTAO_VERMELHO'].includes(e.event_type)
  ).length;

  const hasStats = events.length > 0;

  return (
    <Box>
      {/* ===== HEADER SECTION ===== */}
      <Box
        sx={{
          background: match.is_featured
            ? 'linear-gradient(135deg, #1a237e 0%, #0d47a1 40%, #01579b 100%)'
            : 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
          color: 'white',
          py: { xs: 4, md: 6 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative bg pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.05,
            backgroundImage:
              'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {match.is_featured && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: 'linear-gradient(90deg, #ffd600 0%, #ffab00 50%, #ffd600 100%)',
            }}
          />
        )}

        <Container maxWidth="lg" sx={{ position: 'relative' }}>
          {/* Championship & round info */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            {match.is_featured && (
              <Chip
                icon={<Star sx={{ color: '#1a237e !important', fontSize: 16 }} />}
                label="JOGO EM DESTAQUE"
                size="small"
                sx={{
                  bgcolor: '#ffd600',
                  color: '#1a237e',
                  fontWeight: 700,
                  mb: 1,
                  fontSize: '0.7rem',
                }}
              />
            )}
            <Typography
              variant="body2"
              sx={{ color: 'rgba(255,255,255,0.7)', letterSpacing: 1, textTransform: 'uppercase' }}
            >
              {match.championship_name}
              {match.match_round ? ` | ${match.match_round}` : ''}
            </Typography>
          </Box>

          {/* Teams and Score */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: { xs: 2, md: 4 },
              mb: 3,
            }}
          >
            {/* Home team */}
            <Box sx={{ textAlign: 'center', flex: 1, maxWidth: 200 }}>
              <Avatar
                src={match.home_team_logo || ''}
                sx={{
                  width: { xs: 60, md: 80 },
                  height: { xs: 60, md: 80 },
                  mx: 'auto',
                  mb: 1,
                  bgcolor: 'rgba(255,255,255,0.15)',
                  border: '3px solid rgba(255,255,255,0.2)',
                }}
              >
                <Typography variant="h5" fontWeight={700}>
                  {(match.home_team_short || match.home_team_name || '?')[0]}
                </Typography>
              </Avatar>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{ fontSize: { xs: '0.85rem', md: '1rem' } }}
              >
                {match.home_team_name}
              </Typography>
              {match.home_team_short && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  {match.home_team_short}
                </Typography>
              )}
            </Box>

            {/* Score */}
            <Box sx={{ textAlign: 'center', minWidth: { xs: 90, md: 140 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <Typography
                  variant="h2"
                  fontWeight={900}
                  sx={{
                    fontSize: { xs: '2.5rem', md: '4rem' },
                    lineHeight: 1,
                    textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}
                >
                  {match.home_score ?? '-'}
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    color: 'rgba(255,255,255,0.5)',
                    mx: { xs: 0.5, md: 1 },
                    fontSize: { xs: '1.5rem', md: '2rem' },
                  }}
                >
                  x
                </Typography>
                <Typography
                  variant="h2"
                  fontWeight={900}
                  sx={{
                    fontSize: { xs: '2.5rem', md: '4rem' },
                    lineHeight: 1,
                    textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}
                >
                  {match.away_score ?? '-'}
                </Typography>
              </Box>
              <Chip
                label={status.label}
                size="small"
                sx={{
                  mt: 1,
                  color: status.color,
                  bgcolor: isLive ? '#2e7d32' : status.bgcolor,
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  ...(isLive && {
                    animation: 'statusPulse 2s infinite',
                    '@keyframes statusPulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.7 },
                    },
                  }),
                }}
              />
            </Box>

            {/* Away team */}
            <Box sx={{ textAlign: 'center', flex: 1, maxWidth: 200 }}>
              <Avatar
                src={match.away_team_logo || ''}
                sx={{
                  width: { xs: 60, md: 80 },
                  height: { xs: 60, md: 80 },
                  mx: 'auto',
                  mb: 1,
                  bgcolor: 'rgba(255,255,255,0.15)',
                  border: '3px solid rgba(255,255,255,0.2)',
                }}
              >
                <Typography variant="h5" fontWeight={700}>
                  {(match.away_team_short || match.away_team_name || '?')[0]}
                </Typography>
              </Avatar>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{ fontSize: { xs: '0.85rem', md: '1rem' } }}
              >
                {match.away_team_name}
              </Typography>
              {match.away_team_short && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  {match.away_team_short}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Match info bar */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: { xs: 2, md: 4 },
              flexWrap: 'wrap',
              color: 'rgba(255,255,255,0.8)',
            }}
          >
            {match.match_date && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarMonth sx={{ fontSize: 16 }} />
                <Typography variant="caption">{formatDateTime(match.match_date)}</Typography>
              </Box>
            )}
            {match.venue && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Stadium sx={{ fontSize: 16 }} />
                <Typography variant="caption">{match.venue}</Typography>
              </Box>
            )}
            {match.referee && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Gavel sx={{ fontSize: 16 }} />
                <Typography variant="caption">{match.referee}</Typography>
              </Box>
            )}
          </Box>

          {/* Live streaming indicator in header */}
          {(isLive || hasAnyLiveStream) && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Chip
                label="TRANSMISSAO AO VIVO DISPONIVEL"
                size="small"
                sx={{
                  bgcolor: 'rgba(211,47,47,0.9)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  animation: 'headerLivePulse 1.5s infinite',
                  '@keyframes headerLivePulse': {
                    '0%': { boxShadow: '0 0 0 0 rgba(211,47,47,0.5)' },
                    '70%': { boxShadow: '0 0 0 8px rgba(211,47,47,0)' },
                    '100%': { boxShadow: '0 0 0 0 rgba(211,47,47,0)' },
                  },
                }}
              />
            </Box>
          )}
        </Container>
      </Box>

      {/* ===== CONTENT SECTION ===== */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* Main column */}
          <Grid item xs={12} md={8}>
            {/* Streaming Links */}
            {(streamingLinks.length > 0 || match.streaming_url) && (
              <Box sx={{ mb: 4 }}>
                <StreamingLinksDisplay
                  streamingLinks={streamingLinks}
                  mainStreamUrl={match.streaming_url}
                />
              </Box>
            )}

            {/* Match Timeline */}
            {events.length > 0 && (
              <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, mb: 4, borderRadius: 2 }}>
                <MatchTimeline events={events} match={match} />
              </Paper>
            )}

            {/* Lineups */}
            {(lineups.home.length > 0 || lineups.away.length > 0) && (
              <Box sx={{ mb: 4 }}>
                <MatchLineupDisplay
                  homeLineup={lineups.home}
                  awayLineup={lineups.away}
                  match={match}
                />
              </Box>
            )}

            {/* Highlights */}
            {match.highlights_url && (
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  gutterBottom
                  sx={{ color: '#1a237e', display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <PlayCircleOutline fontSize="small" />
                  MELHORES MOMENTOS
                </Typography>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  {match.highlights_url.includes('youtube.com') ||
                  match.highlights_url.includes('youtu.be') ? (
                    <Box
                      sx={{
                        position: 'relative',
                        paddingBottom: '56.25%',
                        height: 0,
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        component="iframe"
                        src={getYouTubeEmbedUrl(match.highlights_url)}
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          border: 'none',
                        }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Melhores Momentos"
                      />
                    </Box>
                  ) : (
                    <CardActionArea
                      href={match.highlights_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <CardContent
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
                          color: 'white',
                        }}
                      >
                        <PlayCircleOutline sx={{ fontSize: 40 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight={700}>
                            Assistir Melhores Momentos
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            Clique para assistir
                          </Typography>
                        </Box>
                        <OpenInNew />
                      </CardContent>
                    </CardActionArea>
                  )}
                </Card>
              </Box>
            )}
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            {/* Match Stats */}
            {hasStats && (
              <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  gutterBottom
                  sx={{ color: '#1a237e', fontSize: '1rem' }}
                >
                  ESTATISTICAS
                </Typography>

                <StatRow
                  label="Gols"
                  home={homeGoals}
                  away={awayGoals}
                />
                <StatRow
                  label="Cartoes Amarelos"
                  home={homeYellows}
                  away={awayYellows}
                />
                <StatRow
                  label="Cartoes Vermelhos"
                  home={homeReds}
                  away={awayReds}
                />
              </Paper>
            )}

            {/* Match Details */}
            <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
              <Typography
                variant="h6"
                fontWeight={700}
                gutterBottom
                sx={{ color: '#1a237e', fontSize: '1rem' }}
              >
                DETALHES
              </Typography>

              <DetailRow label="Campeonato" value={match.championship_name} />
              {match.match_round && <DetailRow label="Rodada" value={match.match_round} />}
              {match.match_date && (
                <DetailRow label="Data/Hora" value={formatDateTime(match.match_date)} />
              )}
              {match.venue && <DetailRow label="Local" value={match.venue} />}
              {match.referee && <DetailRow label="Arbitro" value={match.referee} />}
              {match.assistant_referee_1 && (
                <DetailRow label="Assistente 1" value={match.assistant_referee_1} />
              )}
              {match.assistant_referee_2 && (
                <DetailRow label="Assistente 2" value={match.assistant_referee_2} />
              )}
            </Paper>

            {/* Observations */}
            {match.observations && (
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  gutterBottom
                  sx={{ color: '#1a237e', fontSize: '1rem' }}
                >
                  OBSERVACOES
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                  {match.observations}
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

/* ---------- Helper components ---------- */

function StatRow({
  label,
  home,
  away,
}: {
  label: string;
  home: number;
  away: number;
}) {
  const total = home + away;
  const homePercent = total > 0 ? (home / total) * 100 : 50;
  const awayPercent = total > 0 ? (away / total) * 100 : 50;

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" fontWeight={700}>
          {home}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={700}>
          {away}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5, height: 6, borderRadius: 3, overflow: 'hidden' }}>
        <Box
          sx={{
            width: `${homePercent}%`,
            bgcolor: '#1a237e',
            borderRadius: '3px 0 0 3px',
            transition: 'width 0.3s ease',
          }}
        />
        <Box
          sx={{
            width: `${awayPercent}%`,
            bgcolor: '#b71c1c',
            borderRadius: '0 3px 3px 0',
            transition: 'width 0.3s ease',
          }}
        />
      </Box>
    </Box>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        py: 0.75,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} sx={{ textAlign: 'right', maxWidth: '60%' }}>
        {value}
      </Typography>
    </Box>
  );
}

/* ---------- Helper functions ---------- */

function getYouTubeEmbedUrl(url: string): string {
  let videoId = '';

  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
  } else if (url.includes('youtube.com/watch')) {
    const urlObj = new URL(url);
    videoId = urlObj.searchParams.get('v') || '';
  } else if (url.includes('youtube.com/embed/')) {
    videoId = url.split('youtube.com/embed/')[1]?.split('?')[0] || '';
  }

  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}
