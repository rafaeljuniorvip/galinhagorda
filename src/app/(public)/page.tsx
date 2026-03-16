import { CircleDot, Users, Users2, Trophy, Newspaper, ArrowRight, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getMany, getOne } from '@/lib/db';
import { Championship, Match, NewsArticle } from '@/types';
import { getChampionshipStandings, getTopScorers } from '@/services/statsService';
import { getPublishedNews } from '@/services/newsPublicService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import FeaturedMatches from '@/components/public/FeaturedMatches';
import NewsCard from '@/components/public/NewsCard';
import MatchResultCard from '@/components/public/MatchResultCard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Galinha Gorda - Gestao de Campeonatos',
  description: 'Sistema de gestao de campeonatos de futebol de Itapecerica-MG',
};

async function getActiveChampionship(): Promise<Championship | null> {
  return getOne<Championship>(
    `SELECT * FROM championships WHERE active = true AND (is_demo IS NOT TRUE) AND status IN ('Em Andamento', 'Inscricoes Abertas') ORDER BY CASE WHEN status = 'Em Andamento' THEN 0 ELSE 1 END, year DESC LIMIT 1`
  );
}

async function getRecentResults(champId: string): Promise<Match[]> {
  return getMany<Match>(
    `SELECT m.*, ht.name AS home_team_name, ht.logo_url AS home_team_logo, ht.short_name AS home_team_short, at.name AS away_team_name, at.logo_url AS away_team_logo, at.short_name AS away_team_short, c.name AS championship_name FROM matches m JOIN teams ht ON ht.id = m.home_team_id JOIN teams at ON at.id = m.away_team_id JOIN championships c ON c.id = m.championship_id WHERE m.championship_id = $1 AND m.status = 'Finalizada' ORDER BY m.match_date DESC NULLS LAST LIMIT 6`,
    [champId]
  );
}

async function getUpcomingMatches(champId: string): Promise<Match[]> {
  return getMany<Match>(
    `SELECT m.*, ht.name AS home_team_name, ht.logo_url AS home_team_logo, ht.short_name AS home_team_short, at.name AS away_team_name, at.logo_url AS away_team_logo, at.short_name AS away_team_short, c.name AS championship_name FROM matches m JOIN teams ht ON ht.id = m.home_team_id JOIN teams at ON at.id = m.away_team_id JOIN championships c ON c.id = m.championship_id WHERE m.championship_id = $1 AND m.status = 'Agendada' ORDER BY m.match_date ASC NULLS LAST LIMIT 6`,
    [champId]
  );
}

async function getFeaturedMatchesData(): Promise<Match[]> {
  return getMany<Match>(
    `SELECT m.*, ht.name AS home_team_name, ht.logo_url AS home_team_logo, ht.short_name AS home_team_short, at.name AS away_team_name, at.logo_url AS away_team_logo, at.short_name AS away_team_short, c.name AS championship_name FROM matches m JOIN teams ht ON ht.id = m.home_team_id JOIN teams at ON at.id = m.away_team_id JOIN championships c ON c.id = m.championship_id WHERE (c.is_demo IS NOT TRUE) AND (m.is_featured = true OR m.status = 'Em Andamento' OR (m.status = 'Finalizada' AND m.match_date >= NOW() - INTERVAL '7 days')) ORDER BY CASE WHEN m.status = 'Em Andamento' THEN 0 WHEN m.is_featured = true THEN 1 ELSE 2 END, m.match_date DESC NULLS LAST LIMIT 10`
  );
}

export default async function HomePage() {
  const [activeChampionship, featuredMatches, newsResult] = await Promise.all([
    getActiveChampionship(),
    getFeaturedMatchesData(),
    getPublishedNews(1, 4),
  ]);

  let standings: any[] = [];
  let topScorers: any[] = [];
  let recentResults: Match[] = [];
  let upcomingMatches: Match[] = [];
  if (activeChampionship) {
    [standings, topScorers, recentResults, upcomingMatches] = await Promise.all([
      getChampionshipStandings(activeChampionship.id),
      getTopScorers(activeChampionship.id, 5),
      getRecentResults(activeChampionship.id),
      getUpcomingMatches(activeChampionship.id),
    ]);
  }

  const latestNews = newsResult.news;

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0d1b2a] via-[#1a237e] to-[#1565c0] text-white py-12 md:py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="max-w-2xl mx-auto px-4 relative">
          <CircleDot className="h-16 w-16 text-[#ffd600] mx-auto mb-4" />
          <h1 className="text-3xl md:text-5xl font-extrabold mb-2 tracking-tight">GALINHA GORDA</h1>
          <p className="text-[#ffd600] text-lg font-semibold mb-2">Itapecerica - MG</p>
          {activeChampionship && (
            <p className="text-white/90 mb-1">{activeChampionship.name} {activeChampionship.year}</p>
          )}
          <p className="text-white/70 max-w-md mx-auto mb-8">
            Sistema oficial de gestao de campeonatos de futebol. Consulte jogadores, times, tabelas e resultados.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button asChild size="lg" className="bg-[#ffd600] text-[#0d1b2a] font-bold hover:bg-[#ffd600]/90">
              <Link href="/jogadores">Ver Jogadores</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:border-[#ffd600] hover:text-[#ffd600] bg-white/5">
              <Link href="/campeonatos">Campeonatos</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Featured Matches */}
      {featuredMatches.length > 0 && (
        <div className="bg-muted py-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-7 bg-[#d32f2f] rounded-full" />
              <h2 className="text-lg font-bold text-[#0d1b2a] uppercase tracking-wide">Partidas em Destaque</h2>
            </div>
            <FeaturedMatches initialMatches={featuredMatches} />
          </div>
        </div>
      )}

      {/* Latest News */}
      {latestNews.length > 0 && (
        <div className="py-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-1 h-7 bg-[#1a237e] rounded-full" />
                <h2 className="text-lg font-bold text-[#0d1b2a] uppercase tracking-wide">Ultimas Noticias</h2>
              </div>
              <Button variant="link" asChild className="text-[#1a237e] font-semibold">
                <Link href="/noticias">Ver todas<ArrowRight className="h-4 w-4 ml-1" /></Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {latestNews.map((article, index) => (
                <div key={article.id} className={index === 0 ? 'sm:col-span-2' : ''}>
                  <NewsCard article={article} featured={index === 0} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Results & Upcoming Matches */}
      {activeChampionship && (recentResults.length > 0 || upcomingMatches.length > 0) && (() => {
        const hasBoth = recentResults.length > 0 && upcomingMatches.length > 0;
        return (
          <div className="bg-muted py-10">
            <div className="max-w-7xl mx-auto px-4">
              <div className={cn(
                'grid grid-cols-1 gap-8',
                hasBoth ? 'md:grid-cols-2' : 'max-w-3xl mx-auto'
              )}>
                {recentResults.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-1 h-7 bg-[#2e7d32] rounded-full" />
                      <h2 className="text-lg font-bold text-[#0d1b2a] uppercase tracking-wide">Ultimos Resultados</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {recentResults.map((m) => <MatchResultCard key={m.id} match={m} />)}
                    </div>
                  </div>
                )}
                {upcomingMatches.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-1 h-7 bg-[#1a237e] rounded-full" />
                      <h2 className="text-lg font-bold text-[#0d1b2a] uppercase tracking-wide">Proximos Jogos</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {upcomingMatches.map((m) => <MatchResultCard key={m.id} match={m} />)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Standings & Top Scorers */}
      {activeChampionship && (standings.length > 0 || topScorers.length > 0) && (() => {
        const hasBothStats = standings.length > 0 && topScorers.length > 0;
        return (
        <div className="py-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className={cn(
              'grid grid-cols-1 gap-8',
              hasBothStats ? 'md:grid-cols-12' : 'max-w-4xl mx-auto'
            )}>
              {/* Standings */}
              {standings.length > 0 && (
                <div className={hasBothStats ? 'md:col-span-7' : ''}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-7 bg-[#1a237e] rounded-full" />
                      <h2 className="text-lg font-bold text-[#0d1b2a] uppercase tracking-wide">Classificacao</h2>
                    </div>
                    <Button variant="link" asChild size="sm" className="text-[#1a237e] font-semibold">
                      <Link href={`/campeonatos/${activeChampionship.id}`}>Ver completa<ArrowRight className="h-4 w-4 ml-1" /></Link>
                    </Button>
                  </div>
                  <div className="rounded-lg overflow-hidden border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#0d1b2a] text-white text-xs">
                          <th className="px-3 py-2.5 text-left font-semibold w-10">#</th>
                          <th className="px-3 py-2.5 text-left font-semibold">Time</th>
                          <th className="px-3 py-2.5 text-center font-semibold">P</th>
                          <th className="px-3 py-2.5 text-center font-semibold">J</th>
                          <th className="px-3 py-2.5 text-center font-semibold">V</th>
                          <th className="px-3 py-2.5 text-center font-semibold">E</th>
                          <th className="px-3 py-2.5 text-center font-semibold">D</th>
                          <th className="px-3 py-2.5 text-center font-semibold">SG</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.slice(0, 6).map((s, i) => (
                          <tr key={s.team_id} className={cn('border-b border-border/50', i % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fa]')}>
                            <td className="px-3 py-2.5">
                              <span className={cn(
                                'inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold',
                                i < 4 ? 'bg-[#2e7d32] text-white' : 'bg-gray-200 text-gray-600'
                              )}>
                                {i + 1}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={s.logo_url || ''} />
                                  <AvatarFallback className="text-[9px] font-bold">{s.short_name?.[0]}</AvatarFallback>
                                </Avatar>
                                <span className="font-semibold text-[#0d1b2a]">{s.team_name}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-center font-extrabold text-[#1a237e]">{s.points}</td>
                            <td className="px-3 py-2.5 text-center text-muted-foreground">{s.matches_played}</td>
                            <td className="px-3 py-2.5 text-center text-muted-foreground">{s.wins}</td>
                            <td className="px-3 py-2.5 text-center text-muted-foreground">{s.draws}</td>
                            <td className="px-3 py-2.5 text-center text-muted-foreground">{s.losses}</td>
                            <td className="px-3 py-2.5 text-center text-muted-foreground">{s.goals_for - s.goals_against}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Top Scorers */}
              {topScorers.length > 0 && (
                <div className={hasBothStats ? 'md:col-span-5' : ''}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-7 bg-[#ffd600] rounded-full" />
                      <h2 className="text-lg font-bold text-[#0d1b2a] uppercase tracking-wide">Artilharia</h2>
                    </div>
                    <Button variant="link" asChild size="sm" className="text-[#1a237e] font-semibold">
                      <Link href={`/campeonatos/${activeChampionship.id}`}>Ver todos<ArrowRight className="h-4 w-4 ml-1" /></Link>
                    </Button>
                  </div>
                  <div className="rounded-lg overflow-hidden border border-border">
                    {/* Header */}
                    <div className="bg-[#0d1b2a] px-4 py-2.5">
                      <span className="text-[11px] text-white/50 font-medium uppercase tracking-wide">Top Goleadores</span>
                    </div>
                    {topScorers.map((s: any, i: number) => (
                      <div
                        key={s.player_id}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3',
                          i % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fa]',
                          i !== topScorers.length - 1 && 'border-b border-border/50'
                        )}
                      >
                        <span className={cn(
                          'text-base font-extrabold w-6 text-center tabular-nums',
                          i === 0 ? 'text-[#ffd600]' : i < 3 ? 'text-amber-600' : 'text-muted-foreground'
                        )}>
                          {i + 1}
                        </span>
                        <Avatar className="h-10 w-10 ring-1 ring-border">
                          <AvatarImage src={s.photo_url || ''} />
                          <AvatarFallback className="font-bold bg-muted">{s.player_name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#0d1b2a] leading-tight">{s.player_name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={s.team_logo || ''} />
                              <AvatarFallback className="text-[7px]">{s.team_name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-[11px] text-muted-foreground">{s.team_name}</span>
                          </div>
                        </div>
                        <div className={cn(
                          'px-2.5 py-1 rounded-md text-sm font-extrabold tabular-nums',
                          i === 0 ? 'bg-[#ffd600] text-[#0d1b2a]' : 'bg-[#1a237e] text-white'
                        )}>
                          {s.goals}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        );
      })()}

      {/* Quick Links */}
      <div className="bg-muted py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'Jogadores', desc: 'Consulte o BID e perfil completo dos atletas inscritos', icon: Users, bg: 'bg-[#1a237e]', href: '/jogadores' },
              { title: 'Times', desc: 'Veja todos os times participantes dos campeonatos', icon: Users2, bg: 'bg-[#2e7d32]', href: '/times' },
              { title: 'Campeonatos', desc: 'Acompanhe tabelas, classificacao e resultados', icon: Trophy, bg: 'bg-[#b8860b]', href: '/campeonatos' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.title} href={item.href} className="group">
                  <div className="h-full rounded-lg overflow-hidden border border-border bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                    <div className="p-6 flex items-center gap-4">
                      <div className={cn('h-12 w-12 rounded-full flex items-center justify-center shrink-0', item.bg)}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-[#0d1b2a] mb-0.5">{item.title}</h3>
                        <p className="text-sm text-muted-foreground leading-snug">{item.desc}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-[#1a237e] transition-colors shrink-0" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
