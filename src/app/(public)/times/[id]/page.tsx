import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTeamById } from '@/services/teamService';
import { getMany } from '@/lib/db';
import { getPublicPhotos } from '@/services/photoPublicService';
import { Match } from '@/types';
import { Instagram, MessageSquare, Trophy } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import PhotoGallery from '@/components/public/PhotoGallery';
import MatchResultCard from '@/components/public/MatchResultCard';
import FanWall from '@/components/public/FanWall';

export const dynamic = 'force-dynamic';

interface Props { params: { id: string }; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const team = await getTeamById(params.id);
  if (!team) return { title: 'Time nao encontrado' };
  return { title: team.name };
}

export default async function TeamDetailPage({ params }: Props) {
  const team = await getTeamById(params.id);
  if (!team) notFound();

  const players = await getMany(
    `SELECT DISTINCT p.id, p.name, p.position, p.photo_url, pr.shirt_number, pr.bid_number, c.name AS championship_name
     FROM player_registrations pr
     JOIN players p ON p.id = pr.player_id
     JOIN championships c ON c.id = pr.championship_id
     WHERE pr.team_id = $1 AND pr.status = 'Ativo'
     ORDER BY p.name`,
    [params.id]
  );

  const teamStats = await getMany(
    `SELECT
      c.id AS championship_id,
      c.name AS championship_name,
      c.year,
      c.status,
      COUNT(m.id)::int AS matches_played,
      SUM(CASE
        WHEN (m.home_team_id = $1 AND m.home_score > m.away_score)
          OR (m.away_team_id = $1 AND m.away_score > m.home_score)
        THEN 1 ELSE 0
      END)::int AS wins,
      SUM(CASE WHEN m.home_score = m.away_score THEN 1 ELSE 0 END)::int AS draws,
      SUM(CASE
        WHEN (m.home_team_id = $1 AND m.home_score < m.away_score)
          OR (m.away_team_id = $1 AND m.away_score < m.home_score)
        THEN 1 ELSE 0
      END)::int AS losses,
      COALESCE(SUM(CASE WHEN m.home_team_id = $1 THEN m.home_score WHEN m.away_team_id = $1 THEN m.away_score ELSE 0 END), 0)::int AS goals_for,
      COALESCE(SUM(CASE WHEN m.home_team_id = $1 THEN m.away_score WHEN m.away_team_id = $1 THEN m.home_score ELSE 0 END), 0)::int AS goals_against
     FROM team_championships tc
     JOIN championships c ON c.id = tc.championship_id
     LEFT JOIN matches m ON m.championship_id = c.id
       AND (m.home_team_id = $1 OR m.away_team_id = $1)
       AND m.status = 'Finalizada'
     WHERE tc.team_id = $1
     GROUP BY c.id, c.name, c.year, c.status
     ORDER BY c.year DESC, c.name`,
    [params.id]
  );

  const [photos, recentResults, upcomingMatches, topScorer] = await Promise.all([
    getPublicPhotos('team', params.id),
    getMany<Match>(
      `SELECT m.*,
        ht.name AS home_team_name, ht.logo_url AS home_team_logo, ht.short_name AS home_team_short,
        at.name AS away_team_name, at.logo_url AS away_team_logo, at.short_name AS away_team_short,
        c.name AS championship_name
       FROM matches m
       JOIN teams ht ON ht.id = m.home_team_id
       JOIN teams at ON at.id = m.away_team_id
       JOIN championships c ON c.id = m.championship_id
       WHERE (m.home_team_id = $1 OR m.away_team_id = $1) AND m.status = 'Finalizada'
       ORDER BY m.match_date DESC NULLS LAST
       LIMIT 5`,
      [params.id]
    ),
    getMany<Match>(
      `SELECT m.*,
        ht.name AS home_team_name, ht.logo_url AS home_team_logo, ht.short_name AS home_team_short,
        at.name AS away_team_name, at.logo_url AS away_team_logo, at.short_name AS away_team_short,
        c.name AS championship_name
       FROM matches m
       JOIN teams ht ON ht.id = m.home_team_id
       JOIN teams at ON at.id = m.away_team_id
       JOIN championships c ON c.id = m.championship_id
       WHERE (m.home_team_id = $1 OR m.away_team_id = $1) AND m.status = 'Agendada'
       ORDER BY m.match_date ASC NULLS LAST
       LIMIT 3`,
      [params.id]
    ),
    getMany(
      `SELECT p.id, p.name, p.photo_url,
        COUNT(*) FILTER (WHERE me.event_type IN ('GOL', 'GOL_PENALTI'))::int AS goals
       FROM match_events me
       JOIN players p ON p.id = me.player_id
       WHERE me.team_id = $1 AND me.event_type IN ('GOL', 'GOL_PENALTI')
       GROUP BY p.id, p.name, p.photo_url
       ORDER BY goals DESC
       LIMIT 1`,
      [params.id]
    ),
  ]);

  return (
    <div>
      {/* Hero Banner */}
      <div
        className="text-white py-12"
        style={{ background: `linear-gradient(135deg, ${team.primary_color || '#1a237e'} 0%, #283593 100%)` }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 flex-col md:flex-row text-center md:text-left">
            <Avatar className="h-[120px] w-[120px] border-4 border-white text-5xl shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <AvatarImage src={team.logo_url || ''} />
              <AvatarFallback className="text-white text-4xl font-bold" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                {team.short_name?.[0] || team.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-extrabold">{team.name}</h1>
              {team.short_name && <p className="text-lg text-white/80">{team.short_name}</p>}
              <p className="text-sm text-white/70 mt-1">
                {team.city}/{team.state} {team.founded_year ? `| Fundado em ${team.founded_year}` : ''}
              </p>
              {team.instagram && (
                <Button
                  variant="ghost"
                  asChild
                  className="text-white hover:bg-white/10 mt-1 -ml-3"
                >
                  <a
                    href={team.instagram.startsWith('http') ? team.instagram : `https://instagram.com/${team.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener"
                  >
                    <Instagram className="h-4 w-4 mr-1" />
                    {team.instagram.startsWith('http') ? 'Instagram' : team.instagram}
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Bio */}
        {team.bio && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3 text-[#1a237e]">SOBRE O TIME</h2>
            <Card>
              <CardContent className="p-4">
                <p className="leading-7 text-muted-foreground">{team.bio}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Team Stats by Championship */}
        {teamStats.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3 text-[#1a237e]">
              <Trophy className="h-5 w-5 inline-block mr-1 text-orange-600 align-middle" />
              HISTORICO NOS CAMPEONATOS
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {teamStats.map((s: any) => (
                <Link key={s.championship_id} href={`/campeonatos/${s.championship_id}`}>
                  <Card className="h-full hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-bold">{s.championship_name}</p>
                        <Badge
                          variant="outline"
                          className={
                            s.status === 'Em Andamento' ? 'border-green-300 text-green-700 text-[0.65rem]' :
                            s.status === 'Finalizado' ? 'text-[0.65rem]' :
                            'border-blue-300 text-blue-700 text-[0.65rem]'
                          }
                        >
                          {s.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{s.year}</p>
                      {s.matches_played > 0 ? (
                        <div className="flex gap-3">
                          <div className="text-center">
                            <p className="text-lg font-extrabold text-[#1a237e]">{s.matches_played}</p>
                            <p className="text-xs text-muted-foreground">Jogos</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-extrabold text-green-700">{s.wins}</p>
                            <p className="text-xs text-muted-foreground">V</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-extrabold text-orange-600">{s.draws}</p>
                            <p className="text-xs text-muted-foreground">E</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-extrabold text-red-600">{s.losses}</p>
                            <p className="text-xs text-muted-foreground">D</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-extrabold text-blue-600">{s.goals_for}</p>
                            <p className="text-xs text-muted-foreground">GP</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-extrabold text-gray-400">{s.goals_against}</p>
                            <p className="text-xs text-muted-foreground">GC</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Nenhuma partida disputada</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Elenco */}
        <h2 className="text-xl font-bold mb-3 text-[#1a237e]">ELENCO</h2>
        {players.length > 0 ? (
          <div className="border rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-4 py-2 font-semibold">Jogador</th>
                  <th className="text-left px-4 py-2 font-semibold">Posicao</th>
                  <th className="text-left px-4 py-2 font-semibold">N</th>
                  <th className="text-left px-4 py-2 font-semibold">BID</th>
                  <th className="text-left px-4 py-2 font-semibold">Campeonato</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p: any, i: number) => (
                  <tr key={`${p.id}-${i}`} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2">
                      <Link href={`/jogadores/${p.id}`} className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={p.photo_url || ''} />
                          <AvatarFallback className="text-xs">{p.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold">{p.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant="outline">{p.position}</Badge>
                    </td>
                    <td className="px-4 py-2">{p.shirt_number || '-'}</td>
                    <td className="px-4 py-2">{p.bid_number || '-'}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{p.championship_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground mb-6">Nenhum jogador inscrito</p>
        )}

        {/* Recent Results & Upcoming Matches */}
        {(recentResults.length > 0 || upcomingMatches.length > 0 || topScorer.length > 0) && (
          <div className="mb-6">
            <Separator className="mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {recentResults.length > 0 && (
                <div className={topScorer.length > 0 ? 'md:col-span-5' : 'md:col-span-6'}>
                  <h3 className="text-lg font-bold mb-3 text-[#1a237e]">ULTIMOS RESULTADOS</h3>
                  <div className="flex flex-col gap-2">
                    {recentResults.map((m) => (
                      <MatchResultCard key={m.id} match={m} highlightTeamId={params.id} />
                    ))}
                  </div>
                </div>
              )}
              {upcomingMatches.length > 0 && (
                <div className={topScorer.length > 0 ? 'md:col-span-4' : 'md:col-span-6'}>
                  <h3 className="text-lg font-bold mb-3 text-[#1a237e]">PROXIMOS JOGOS</h3>
                  <div className="flex flex-col gap-2">
                    {upcomingMatches.map((m) => (
                      <MatchResultCard key={m.id} match={m} />
                    ))}
                  </div>
                </div>
              )}
              {topScorer.length > 0 && (
                <div className="md:col-span-3">
                  <h3 className="text-lg font-bold mb-3 text-[#1a237e]">ARTILHEIRO</h3>
                  <Card className="text-center p-4">
                    <Avatar className="h-[72px] w-[72px] mx-auto mb-2 border-[3px] border-yellow-400">
                      <AvatarImage src={topScorer[0].photo_url || ''} />
                      <AvatarFallback>{topScorer[0].name[0]}</AvatarFallback>
                    </Avatar>
                    <p className="font-bold">{topScorer[0].name}</p>
                    <Badge className="mt-1 bg-yellow-400 text-[#1a237e] font-bold">
                      {topScorer[0].goals} gol{topScorer[0].goals > 1 ? 's' : ''}
                    </Badge>
                  </Card>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Photo Gallery */}
        {photos.length > 0 && (
          <div className="mb-6">
            <Separator className="mb-6" />
            <PhotoGallery photos={photos} title="FOTOS" />
          </div>
        )}

        {/* Fan Wall */}
        <div className="mb-6">
          <Separator className="mb-6" />
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-6 w-6 text-[#1a237e]" />
            <h2 className="text-xl font-bold text-[#1a237e]">MURAL DO TORCEDOR</h2>
          </div>
          <FanWall targetType="team" targetId={params.id} />
        </div>
      </div>
    </div>
  );
}
