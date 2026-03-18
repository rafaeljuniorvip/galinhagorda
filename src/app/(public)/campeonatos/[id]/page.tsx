import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getChampionshipById } from '@/services/championshipService';
import { getChampionshipStandings, getTopScorers, getDisciplinaryRanking, getTeamFairPlayRanking } from '@/services/statsService';
import { getEnrolledTeams } from '@/services/registrationService';
import { getNewsByChampionship } from '@/services/newsPublicService';
import { getPublicPhotos } from '@/services/photoPublicService';
import {
  Trophy, MapPin, Gift, Building2, FileText,
  Layers, CircleDot, Newspaper, ArrowRight, ExternalLink, MessageSquare,
  Info, Scale,
} from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import ChampionshipMatchesClient from '@/components/public/ChampionshipMatchesClient';
import NewsCard from '@/components/public/NewsCard';
import PhotoGallery from '@/components/public/PhotoGallery';
import FanWall from '@/components/public/FanWall';
import { cn } from '@/lib/cn';

export const dynamic = 'force-dynamic';

interface Props { params: { id: string }; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getChampionshipById(params.id);
  if (!c) return { title: 'Campeonato nao encontrado' };
  return { title: `${c.name} ${c.year}` };
}

export default async function ChampionshipDetailPage({ params }: Props) {
  const championship = await getChampionshipById(params.id);
  if (!championship) notFound();

  const [standings, topScorers, , relatedNews, photos, disciplinary, fairPlay] = await Promise.all([
    getChampionshipStandings(params.id),
    getTopScorers(params.id),
    getEnrolledTeams(params.id),
    getNewsByChampionship(params.id, 4),
    getPublicPhotos('championship', params.id),
    getDisciplinaryRanking(params.id),
    getTeamFairPlayRanking(params.id),
  ]);

  const hasInfoCards = championship.prize || championship.location || championship.sponsor || championship.format || championship.category;

  return (
    <div>
      {/* Hero Banner */}
      <div
        className="text-white py-10"
        style={{
          background: championship.banner_url
            ? `linear-gradient(to bottom, rgba(230, 81, 0, 0.85) 0%, rgba(245, 124, 0, 0.9) 100%), url(${championship.banner_url}) center/cover no-repeat`
            : 'linear-gradient(135deg, #e65100 0%, #f57c00 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3">
            <Trophy className="h-12 w-12 shrink-0" />
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold">{championship.name}</h1>
              <p className="text-sm text-white/80">
                {championship.category} | {championship.format} | {championship.year}
              </p>
              {championship.description && (
                <p className="text-sm text-white/70 mt-1">{championship.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Info Cards */}
        {hasInfoCards && (
          <div className="mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {championship.location && (
                <Card className="text-center h-full">
                  <CardContent className="p-3">
                    <MapPin className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Local</p>
                    <p className="text-sm font-semibold">{championship.location}</p>
                  </CardContent>
                </Card>
              )}
              {championship.prize && (
                <Card className="text-center h-full">
                  <CardContent className="p-3">
                    <Gift className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Premiacao</p>
                    <p className="text-sm font-semibold">{championship.prize}</p>
                  </CardContent>
                </Card>
              )}
              {championship.sponsor && (
                <Card className="text-center h-full">
                  <CardContent className="p-3">
                    <Building2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Patrocinador</p>
                    <p className="text-sm font-semibold">{championship.sponsor}</p>
                  </CardContent>
                </Card>
              )}
              <Card className="text-center h-full">
                <CardContent className="p-3">
                  <CircleDot className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Formato</p>
                  <p className="text-sm font-semibold">{championship.format}</p>
                </CardContent>
              </Card>
              <Card className="text-center h-full">
                <CardContent className="p-3">
                  <Layers className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Categoria</p>
                  <p className="text-sm font-semibold">{championship.category}</p>
                </CardContent>
              </Card>
              {championship.rules_url && (
                <Card className="text-center h-full">
                  <CardContent className="p-3">
                    <FileText className="h-5 w-5 text-cyan-600 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Regulamento</p>
                    <Button variant="link" size="sm" asChild className="h-auto p-0 text-xs">
                      <a href={championship.rules_url} target="_blank" rel="noopener">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Abrir PDF
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Classificacao */}
        {standings.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3 text-[#1a237e]">CLASSIFICACAO</h2>
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
                    <th className="px-3 py-2.5 text-center font-semibold">GP</th>
                    <th className="px-3 py-2.5 text-center font-semibold">GC</th>
                    <th className="px-3 py-2.5 text-center font-semibold">SG</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((s, i) => {
                    const hasTie = s.tiebreaker !== null;
                    return (
                      <tr key={s.team_id} className={cn(
                        'border-b border-border/50 hover:bg-muted/30 transition-colors',
                        i % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fa]'
                      )}>
                        <td className="px-3 py-2.5">
                          <span className={cn(
                            'inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold',
                            i < 4 ? 'bg-[#2e7d32] text-white' : i >= standings.length - 2 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'
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
                            {hasTie && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium whitespace-nowrap" title={`Desempate: ${s.tiebreaker}`}>
                                {s.tiebreaker}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center font-extrabold text-[#1a237e]">{s.points}</td>
                        <td className="px-3 py-2.5 text-center text-muted-foreground">{s.matches_played}</td>
                        <td className="px-3 py-2.5 text-center text-muted-foreground">{s.wins}</td>
                        <td className="px-3 py-2.5 text-center text-muted-foreground">{s.draws}</td>
                        <td className="px-3 py-2.5 text-center text-muted-foreground">{s.losses}</td>
                        <td className="px-3 py-2.5 text-center text-muted-foreground">{s.goals_for}</td>
                        <td className="px-3 py-2.5 text-center text-muted-foreground">{s.goals_against}</td>
                        <td className="px-3 py-2.5 text-center text-muted-foreground">{s.goals_for - s.goals_against}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Criterios de Desempate */}
            <div className="mt-3 p-4 rounded-lg bg-[#f8f9fb] border border-border/60">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="h-4 w-4 text-[#1a237e]" />
                <h3 className="text-sm font-bold text-[#1a237e]">Criterios de Desempate</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Quando dois ou mais times possuem a mesma pontuacao, a classificacao e definida pelos seguintes criterios, nesta ordem:
              </p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li><span className="font-semibold text-foreground">Maior numero de vitorias</span></li>
                <li><span className="font-semibold text-foreground">Maior saldo de gols</span> (gols marcados - gols sofridos)</li>
                <li><span className="font-semibold text-foreground">Maior numero de gols pro</span> (total de gols marcados)</li>
                <li><span className="font-semibold text-foreground">Confronto direto</span> (pontos nos jogos entre os times empatados — so entre 2 clubes)</li>
                <li><span className="font-semibold text-foreground">Menor numero de cartoes vermelhos</span></li>
                <li><span className="font-semibold text-foreground">Menor numero de cartoes amarelos</span></li>
                <li><span className="font-semibold text-foreground">Sorteio</span></li>
              </ol>
              {standings.some(s => s.tiebreaker) && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Info className="h-3.5 w-3.5 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-700">Desempates aplicados nesta classificacao:</span>
                  </div>
                  <div className="space-y-1">
                    {(() => {
                      const tieGroups: { teams: string[]; reason: string }[] = [];
                      let i = 0;
                      while (i < standings.length) {
                        if (standings[i].tiebreaker) {
                          const pts = standings[i].points;
                          const group: string[] = [];
                          const reason = standings[i].tiebreaker!;
                          while (i < standings.length && standings[i].points === pts && standings[i].tiebreaker) {
                            group.push(standings[i].team_name);
                            i++;
                          }
                          if (group.length >= 2) {
                            tieGroups.push({ teams: group, reason });
                          }
                        } else {
                          i++;
                        }
                      }
                      return tieGroups.map((g, idx) => (
                        <p key={idx} className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{g.teams.join(', ')}</span>
                          {' '}({g.teams.length} times com mesma pontuacao)
                          {' '}<span className="text-amber-700">→ {g.reason}</span>
                        </p>
                      ));
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Artilharia */}
        {topScorers.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3 text-[#1a237e]">ARTILHARIA</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {topScorers.map((s: any, i: number) => (
                <Card key={s.player_id}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <span className={`text-xl font-extrabold w-8 ${i < 3 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                      {i + 1}
                    </span>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={s.photo_url || ''} />
                      <AvatarFallback>{s.player_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{s.player_name}</p>
                      <p className="text-xs text-muted-foreground">{s.team_name}</p>
                    </div>
                    <Badge className="bg-blue-600 text-white">
                      {s.goals} gol{s.goals > 1 ? 's' : ''}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Cartoes / Disciplinar */}
        {(disciplinary.length > 0 || fairPlay.length > 0) && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3 text-[#1a237e]">CARTOES</h2>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {disciplinary.length > 0 && (
                <div className="md:col-span-7">
                  <p className="text-sm font-semibold mb-2">Ranking Disciplinar</p>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="text-left px-3 py-2 font-semibold">#</th>
                          <th className="text-left px-3 py-2 font-semibold">Jogador</th>
                          <th className="text-left px-3 py-2 font-semibold">Time</th>
                          <th className="text-center px-2 py-2 font-semibold">AM</th>
                          <th className="text-center px-2 py-2 font-semibold">VM</th>
                          <th className="text-center px-2 py-2 font-semibold">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {disciplinary.map((d, i) => (
                          <tr key={d.player_id} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="px-3 py-2">{i + 1}</td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1.5">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={d.photo_url || ''} />
                                  <AvatarFallback className="text-[10px]">{d.player_name[0]}</AvatarFallback>
                                </Avatar>
                                <span className="font-semibold">{d.player_name}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1">
                                <Avatar className="h-[18px] w-[18px]">
                                  <AvatarImage src={d.team_logo || ''} />
                                  <AvatarFallback className="text-[8px]">{d.team_name[0]}</AvatarFallback>
                                </Avatar>
                                <span className="text-xs">{d.team_name}</span>
                              </div>
                            </td>
                            <td className="text-center px-2 py-2">
                              <span className="inline-flex items-center justify-center h-6 min-w-7 rounded-full bg-yellow-400 text-xs font-bold text-gray-800">
                                {d.yellow_cards}
                              </span>
                            </td>
                            <td className="text-center px-2 py-2">
                              <span className={`inline-flex items-center justify-center h-6 min-w-7 rounded-full text-xs font-bold ${d.red_cards > 0 ? 'bg-red-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                                {d.red_cards}
                              </span>
                            </td>
                            <td className="text-center px-2 py-2 font-bold">{d.penalty_points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {fairPlay.length > 0 && (
                <div className="md:col-span-5">
                  <p className="text-sm font-semibold mb-2">Fair Play por Time</p>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="text-left px-3 py-2 font-semibold">Time</th>
                          <th className="text-center px-2 py-2 font-semibold">AM</th>
                          <th className="text-center px-2 py-2 font-semibold">VM</th>
                          <th className="text-center px-2 py-2 font-semibold">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fairPlay.map((fp) => (
                          <tr key={fp.team_id} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1.5">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={fp.logo_url || ''} />
                                  <AvatarFallback className="text-[10px]">{fp.team_name[0]}</AvatarFallback>
                                </Avatar>
                                <span className="font-semibold">{fp.team_name}</span>
                              </div>
                            </td>
                            <td className="text-center px-2 py-2">{fp.yellow_cards}</td>
                            <td className="text-center px-2 py-2">{fp.red_cards}</td>
                            <td className="text-center px-2 py-2 font-bold">{fp.penalty_points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Partidas */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-3 text-[#1a237e]">PARTIDAS</h2>
          <ChampionshipMatchesClient championshipId={params.id} />
        </div>

        <Separator className="my-6" />

        {/* Photo Gallery */}
        {photos.length > 0 && (
          <div className="mb-6">
            <PhotoGallery photos={photos} title="FOTOS DO CAMPEONATO" />
          </div>
        )}

        {/* Related News */}
        {relatedNews.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-[#1a237e]">
                <Newspaper className="h-5 w-5 inline-block mr-1 align-middle" />
                NOTICIAS
              </h2>
              <Button variant="link" size="sm" asChild className="text-blue-600">
                <Link href={`/noticias?campeonato=${params.id}`}>
                  Ver todas
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {relatedNews.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        )}

        {/* Fan Wall */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-6 w-6 text-[#1a237e]" />
            <h2 className="text-xl font-bold text-[#1a237e]">MURAL DO TORCEDOR</h2>
          </div>
          <FanWall targetType="championship" targetId={params.id} />
        </div>
      </div>
    </div>
  );
}
