import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getMatchById } from '@/services/matchService';
import { getEventsByMatch } from '@/services/matchEventService';
import { getStreamingLinks } from '@/services/streamingService';
import { getMatchLineups } from '@/services/lineupService';
import { Calendar, MapPin, Gavel, Star, PlayCircle, ExternalLink } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import StreamingLinksDisplay from '@/components/public/StreamingLinksDisplay';
import MatchLineupDisplay from '@/components/public/MatchLineupDisplay';
import MatchTimeline from '@/components/public/MatchTimeline';
import MatchVoting from '@/components/public/MatchVoting';
import FanWall from '@/components/public/FanWall';
import SocialShare from '@/components/public/SocialShare';

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
  Agendada: { color: 'text-gray-600', bgcolor: 'bg-gray-100', label: 'Agendada' },
  'Em Andamento': { color: 'text-white', bgcolor: 'bg-green-700', label: 'Em Andamento' },
  Finalizada: { color: 'text-white', bgcolor: 'bg-blue-700', label: 'Finalizada' },
  Adiada: { color: 'text-orange-700', bgcolor: 'bg-orange-50', label: 'Adiada' },
  Cancelada: { color: 'text-red-700', bgcolor: 'bg-red-50', label: 'Cancelada' },
  WO: { color: 'text-red-700', bgcolor: 'bg-red-50', label: 'W.O.' },
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

  const homeGoals = events.filter(
    (e) => e.team_id === match.home_team_id && ['GOL', 'GOL_PENALTI'].includes(e.event_type)
  ).length;
  const awayGoals = events.filter(
    (e) => e.team_id === match.away_team_id && ['GOL', 'GOL_PENALTI'].includes(e.event_type)
  ).length;
  const homeYellows = events.filter(
    (e) => e.team_id === match.home_team_id && ['CARTAO_AMARELO', 'SEGUNDO_AMARELO'].includes(e.event_type)
  ).length;
  const awayYellows = events.filter(
    (e) => e.team_id === match.away_team_id && ['CARTAO_AMARELO', 'SEGUNDO_AMARELO'].includes(e.event_type)
  ).length;
  const homeReds = events.filter(
    (e) => e.team_id === match.home_team_id && ['CARTAO_VERMELHO'].includes(e.event_type)
  ).length;
  const awayReds = events.filter(
    (e) => e.team_id === match.away_team_id && ['CARTAO_VERMELHO'].includes(e.event_type)
  ).length;

  const hasStats = events.length > 0;

  return (
    <div>
      {/* ===== HEADER SECTION ===== */}
      <div
        className="text-white py-8 md:py-12 relative overflow-hidden"
        style={{
          background: match.is_featured
            ? 'linear-gradient(135deg, #1a237e 0%, #0d47a1 40%, #01579b 100%)'
            : 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
        }}
      >
        {/* Decorative pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {match.is_featured && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-400" />
        )}

        <div className="max-w-7xl mx-auto px-4 relative">
          {/* Championship & round info */}
          <div className="text-center mb-6">
            {match.is_featured && (
              <Badge className="bg-yellow-400 text-[#1a237e] font-bold text-[0.7rem] mb-2">
                <Star className="h-3 w-3 mr-1" />
                JOGO EM DESTAQUE
              </Badge>
            )}
            <p className="text-sm text-white/70 tracking-wider uppercase">
              {match.championship_name}
              {match.match_round ? ` | ${match.match_round}` : ''}
            </p>
          </div>

          {/* Teams and Score */}
          <div className="flex items-center justify-center gap-4 md:gap-8 mb-6">
            {/* Home team */}
            <div className="text-center flex-1 max-w-[200px]">
              <Avatar className="h-[60px] w-[60px] md:h-[80px] md:w-[80px] mx-auto mb-2 border-[3px] border-white/20 bg-white/15">
                <AvatarImage src={match.home_team_logo || ''} />
                <AvatarFallback className="text-white text-xl font-bold bg-white/15">
                  {(match.home_team_short || match.home_team_name || '?')[0]}
                </AvatarFallback>
              </Avatar>
              <p className="font-bold text-sm md:text-base">{match.home_team_name}</p>
              {match.home_team_short && (
                <p className="text-xs text-white/60">{match.home_team_short}</p>
              )}
            </div>

            {/* Score */}
            <div className="text-center min-w-[90px] md:min-w-[140px]">
              <div className="flex items-center justify-center gap-1">
                <span className="text-[2.5rem] md:text-[4rem] font-black leading-none drop-shadow-lg">
                  {match.home_score ?? '-'}
                </span>
                <span className="text-2xl md:text-3xl text-white/50 mx-1">x</span>
                <span className="text-[2.5rem] md:text-[4rem] font-black leading-none drop-shadow-lg">
                  {match.away_score ?? '-'}
                </span>
              </div>
              <Badge className={`mt-2 font-bold text-[0.7rem] ${status.bgcolor} ${status.color} ${isLive ? 'animate-pulse' : ''}`}>
                {status.label}
              </Badge>
            </div>

            {/* Away team */}
            <div className="text-center flex-1 max-w-[200px]">
              <Avatar className="h-[60px] w-[60px] md:h-[80px] md:w-[80px] mx-auto mb-2 border-[3px] border-white/20 bg-white/15">
                <AvatarImage src={match.away_team_logo || ''} />
                <AvatarFallback className="text-white text-xl font-bold bg-white/15">
                  {(match.away_team_short || match.away_team_name || '?')[0]}
                </AvatarFallback>
              </Avatar>
              <p className="font-bold text-sm md:text-base">{match.away_team_name}</p>
              {match.away_team_short && (
                <p className="text-xs text-white/60">{match.away_team_short}</p>
              )}
            </div>
          </div>

          {/* Match info bar */}
          <div className="flex items-center justify-center gap-4 md:gap-6 flex-wrap text-white/80 text-xs">
            {match.match_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDateTime(match.match_date)}</span>
              </div>
            )}
            {match.venue && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>{match.venue}</span>
              </div>
            )}
            {(match.referee_name || match.referee) && (
              <div className="flex items-center gap-1">
                <Gavel className="h-3.5 w-3.5" />
                <span>
                  {match.referee_name || match.referee}
                  {(match.assistant_referee_1_name || match.assistant_referee_1) && ` | ${match.assistant_referee_1_name || match.assistant_referee_1}`}
                  {(match.assistant_referee_2_name || match.assistant_referee_2) && ` | ${match.assistant_referee_2_name || match.assistant_referee_2}`}
                </span>
              </div>
            )}
          </div>

          {/* Social Share */}
          <div className="text-center mt-3">
            <SocialShare
              homeTeam={match.home_team_name || ''}
              awayTeam={match.away_team_name || ''}
              homeScore={match.home_score}
              awayScore={match.away_score}
              championship={match.championship_name}
            />
          </div>

          {/* Live streaming indicator */}
          {(isLive || hasAnyLiveStream) && (
            <div className="text-center mt-3">
              <Badge className="bg-red-600/90 text-white font-bold text-[0.65rem] animate-pulse">
                TRANSMISSAO AO VIVO DISPONIVEL
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* ===== CONTENT SECTION ===== */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
          {/* Main column */}
          <div>
            {/* Streaming Links */}
            {(streamingLinks.length > 0 || match.streaming_url) && (
              <div className="mb-6">
                <StreamingLinksDisplay
                  streamingLinks={streamingLinks}
                  mainStreamUrl={match.streaming_url}
                />
              </div>
            )}

            {/* Match Timeline */}
            {events.length > 0 && (
              <Card className="mb-6">
                <CardContent className="p-4 md:p-6">
                  <MatchTimeline events={events} match={match} />
                </CardContent>
              </Card>
            )}

            {/* Lineups */}
            {(lineups.home.length > 0 || lineups.away.length > 0) && (
              <div className="mb-6">
                <MatchLineupDisplay
                  homeLineup={lineups.home}
                  awayLineup={lineups.away}
                  match={match}
                />
              </div>
            )}

            {/* Highlights */}
            {match.highlights_url && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-[#1a237e] mb-2 flex items-center gap-1.5">
                  <PlayCircle className="h-5 w-5" />
                  MELHORES MOMENTOS
                </h3>
                <Card className="overflow-hidden">
                  {match.highlights_url.includes('youtube.com') ||
                  match.highlights_url.includes('youtu.be') ? (
                    <div className="relative pb-[56.25%] h-0 overflow-hidden">
                      <iframe
                        src={getYouTubeEmbedUrl(match.highlights_url)}
                        className="absolute top-0 left-0 w-full h-full border-none"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Melhores Momentos"
                      />
                    </div>
                  ) : (
                    <a
                      href={match.highlights_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-gradient-to-br from-[#1a237e] to-[#283593] text-white hover:opacity-90 transition-opacity"
                    >
                      <PlayCircle className="h-10 w-10 shrink-0" />
                      <div className="flex-1">
                        <p className="font-bold">Assistir Melhores Momentos</p>
                        <p className="text-sm text-white/80">Clique para assistir</p>
                      </div>
                      <ExternalLink className="h-5 w-5" />
                    </a>
                  )}
                </Card>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            {/* Match Stats */}
            {hasStats && (
              <Card className="mb-4">
                <CardContent className="p-4">
                  <h3 className="font-bold text-[#1a237e] mb-3">ESTATISTICAS</h3>
                  <StatRow label="Gols" home={homeGoals} away={awayGoals} />
                  <StatRow label="Cartoes Amarelos" home={homeYellows} away={awayYellows} />
                  <StatRow label="Cartoes Vermelhos" home={homeReds} away={awayReds} />
                </CardContent>
              </Card>
            )}

            {/* Match Details */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <h3 className="font-bold text-[#1a237e] mb-3">DETALHES</h3>
                <DetailRow label="Campeonato" value={match.championship_name} />
                {match.match_round && <DetailRow label="Rodada" value={match.match_round} />}
                {match.match_date && <DetailRow label="Data/Hora" value={formatDateTime(match.match_date)} />}
                {match.venue && <DetailRow label="Local" value={match.venue} />}
                {(match.referee_name || match.referee) && <DetailRow label="Arbitro" value={match.referee_name || match.referee} />}
                {(match.assistant_referee_1_name || match.assistant_referee_1) && (
                  <DetailRow label="Assistente 1" value={match.assistant_referee_1_name || match.assistant_referee_1} />
                )}
                {(match.assistant_referee_2_name || match.assistant_referee_2) && (
                  <DetailRow label="Assistente 2" value={match.assistant_referee_2_name || match.assistant_referee_2} />
                )}
              </CardContent>
            </Card>

            {/* Observations */}
            {match.observations && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-bold text-[#1a237e] mb-3">OBSERVACOES</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {match.observations}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Match Voting */}
        {(match.status === 'Finalizada' || match.voting_open) && (
          <div className="mt-6">
            <MatchVoting matchId={params.id} />
          </div>
        )}

        {/* Fan Wall */}
        <div className="mt-6">
          <FanWall targetType="match" targetId={params.id} />
        </div>
      </div>
    </div>
  );
}

/* ---------- Helper components ---------- */

function StatRow({ label, home, away }: { label: string; home: number; away: number }) {
  const total = home + away;
  const homePercent = total > 0 ? (home / total) * 100 : 50;
  const awayPercent = total > 0 ? (away / total) * 100 : 50;

  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-bold">{home}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-bold">{away}</span>
      </div>
      <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-[#1a237e] rounded-l-full transition-all duration-300"
          style={{ width: `${homePercent}%` }}
        />
        <div
          className="bg-red-800 rounded-r-full transition-all duration-300"
          style={{ width: `${awayPercent}%` }}
        />
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-1.5 border-b last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-right max-w-[60%]">{value}</span>
    </div>
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
