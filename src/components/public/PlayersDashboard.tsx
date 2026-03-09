import { getOne, getMany } from '@/lib/db';
import { getTopScorers } from '@/services/statsService';
import { Championship } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/cn';
import { Target, ShieldAlert, Flame, Award, ChevronRight } from 'lucide-react';
import Link from 'next/link';

async function getActiveChampionship(): Promise<Championship | null> {
  return getOne<Championship>(
    `SELECT * FROM championships WHERE active = true AND status IN ('Em Andamento', 'Inscricoes Abertas') ORDER BY CASE WHEN status = 'Em Andamento' THEN 0 ELSE 1 END, year DESC LIMIT 1`
  );
}

async function getMostCarded(championshipId: string): Promise<any[]> {
  return getMany(
    `SELECT p.id AS player_id, p.name AS player_name, p.photo_url,
      t.name AS team_name, t.logo_url AS team_logo,
      COUNT(*) FILTER (WHERE me.event_type = 'CARTAO_AMARELO')::int AS yellow_cards,
      COUNT(*) FILTER (WHERE me.event_type IN ('CARTAO_VERMELHO', 'SEGUNDO_AMARELO'))::int AS red_cards
    FROM match_events me
    JOIN matches m ON m.id = me.match_id AND m.championship_id = $1
    JOIN players p ON p.id = me.player_id
    JOIN teams t ON t.id = me.team_id
    WHERE me.event_type IN ('CARTAO_AMARELO', 'CARTAO_VERMELHO', 'SEGUNDO_AMARELO')
    GROUP BY p.id, p.name, p.photo_url, t.name, t.logo_url
    ORDER BY red_cards DESC, yellow_cards DESC
    LIMIT 5`,
    [championshipId]
  );
}

async function getMostMatches(championshipId: string): Promise<any[]> {
  return getMany(
    `SELECT p.id AS player_id, p.name AS player_name, p.photo_url,
      t.name AS team_name, t.logo_url AS team_logo,
      COUNT(DISTINCT ml.match_id)::int AS matches
    FROM match_lineups ml
    JOIN matches m ON m.id = ml.match_id AND m.championship_id = $1 AND m.status = 'Finalizada'
    JOIN players p ON p.id = ml.player_id
    JOIN teams t ON t.id = ml.team_id
    GROUP BY p.id, p.name, p.photo_url, t.name, t.logo_url
    ORDER BY matches DESC
    LIMIT 5`,
    [championshipId]
  );
}

async function getTotalPlayers(): Promise<number> {
  const r = await getOne<{ count: number }>('SELECT COUNT(*)::int AS count FROM players WHERE active = true');
  return r?.count || 0;
}

export default async function PlayersDashboard() {
  const champ = await getActiveChampionship();
  if (!champ) return null;

  const [scorers, carded, mostPlayed, totalPlayers] = await Promise.all([
    getTopScorers(champ.id, 5),
    getMostCarded(champ.id),
    getMostMatches(champ.id),
    getTotalPlayers(),
  ]);

  const hasData = scorers.length > 0 || carded.length > 0 || mostPlayed.length > 0;
  if (!hasData) return null;

  const totalGoals = scorers.reduce((s: number, x: any) => s + x.goals, 0);
  const totalReds = carded.reduce((s: number, x: any) => s + x.red_cards, 0);

  return (
    <div className="mb-8">
      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<Award className="h-5 w-5 text-[#1a237e]" />} value={totalPlayers} label="Jogadores ativos" />
        <StatCard
          icon={<Target className="h-5 w-5 text-[#ffd600]" />}
          value={scorers[0]?.goals || 0}
          label={scorers[0] ? `${scorers[0].player_name}` : 'Artilheiro'}
          sublabel="Gols do artilheiro"
        />
        <StatCard icon={<Flame className="h-5 w-5 text-orange-500" />} value={totalGoals} label="Total de gols" />
        <StatCard icon={<ShieldAlert className="h-5 w-5 text-red-500" />} value={totalReds} label="Cartoes vermelhos" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Top Scorers */}
        {scorers.length > 0 && (
          <RankingCard
            title="Artilheiros"
            accentColor="bg-[#ffd600]"
            champId={champ.id}
            items={scorers.map((s: any, i: number) => ({
              id: s.player_id,
              rank: i + 1,
              name: s.player_name,
              photo: s.photo_url,
              team: s.team_name,
              teamLogo: s.team_logo,
              stat: `${s.goals} gol${s.goals !== 1 ? 's' : ''}`,
              isTop: i === 0,
            }))}
          />
        )}

        {/* Most Matches */}
        {mostPlayed.length > 0 && (
          <RankingCard
            title="Mais Jogos"
            accentColor="bg-[#1a237e]"
            champId={champ.id}
            items={mostPlayed.map((p: any, i: number) => ({
              id: p.player_id,
              rank: i + 1,
              name: p.player_name,
              photo: p.photo_url,
              team: p.team_name,
              teamLogo: p.team_logo,
              stat: `${p.matches} jogo${p.matches !== 1 ? 's' : ''}`,
              isTop: i === 0,
            }))}
          />
        )}

        {/* Most Cards */}
        {carded.length > 0 && (
          <RankingCard
            title="Cartoes"
            accentColor="bg-red-500"
            champId={champ.id}
            items={carded.map((c: any, i: number) => ({
              id: c.player_id,
              rank: i + 1,
              name: c.player_name,
              photo: c.photo_url,
              team: c.team_name,
              teamLogo: c.team_logo,
              stat: '',
              yellowCards: c.yellow_cards,
              redCards: c.red_cards,
              isTop: i === 0,
            }))}
          />
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, sublabel }: { icon: React.ReactNode; value: number; label: string; sublabel?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-white p-4">
      {icon}
      <div className="min-w-0">
        <p className="text-xl font-extrabold text-[#0d1b2a] leading-none">{value}</p>
        <p className="text-[11px] text-muted-foreground truncate">{label}</p>
        {sublabel && <p className="text-[10px] text-muted-foreground/70">{sublabel}</p>}
      </div>
    </div>
  );
}

function RankingCard({ title, accentColor, champId, items }: {
  title: string;
  accentColor: string;
  champId: string;
  items: { id: string; rank: number; name: string; photo: string | null; team: string; teamLogo: string | null; stat: string; yellowCards?: number; redCards?: number; isTop: boolean }[];
}) {
  return (
    <div className="rounded-lg overflow-hidden border">
      <div className="flex items-center gap-2 bg-[#0d1b2a] px-4 py-2.5">
        <div className={cn('w-1 h-4 rounded-full', accentColor)} />
        <span className="text-xs font-semibold text-white uppercase tracking-wide">{title}</span>
      </div>
      {items.map((item, i) => (
        <Link
          key={item.id}
          href={`/jogadores/${item.id}`}
          className={cn(
            'flex items-center gap-2.5 px-4 py-2.5 hover:bg-accent/50 transition-colors',
            i % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fa]',
            i !== items.length - 1 && 'border-b border-border/50'
          )}
        >
          <span className={cn(
            'text-sm font-extrabold w-5 text-center tabular-nums',
            item.isTop ? 'text-[#ffd600]' : 'text-muted-foreground'
          )}>
            {item.rank}
          </span>
          <Avatar className="h-8 w-8 ring-1 ring-border">
            <AvatarImage src={item.photo || ''} />
            <AvatarFallback className="text-xs font-bold bg-muted">{item.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#0d1b2a] leading-tight truncate">{item.name}</p>
            <div className="flex items-center gap-1">
              <Avatar className="h-3.5 w-3.5">
                <AvatarImage src={item.teamLogo || ''} />
                <AvatarFallback className="text-[6px]">{item.team[0]}</AvatarFallback>
              </Avatar>
              <span className="text-[10px] text-muted-foreground truncate">{item.team}</span>
            </div>
          </div>
          {/* Stat badge */}
          {item.yellowCards !== undefined ? (
            <div className="flex items-center gap-1">
              {item.yellowCards > 0 && (
                <span className="flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-700">
                  <span className="inline-block w-2 h-3 rounded-[1px] bg-yellow-400" />
                  {item.yellowCards}
                </span>
              )}
              {(item.redCards ?? 0) > 0 && (
                <span className="flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-700">
                  <span className="inline-block w-2 h-3 rounded-[1px] bg-red-500" />
                  {item.redCards}
                </span>
              )}
            </div>
          ) : (
            <span className={cn(
              'text-xs font-bold px-2 py-0.5 rounded tabular-nums',
              item.isTop ? 'bg-[#ffd600] text-[#0d1b2a]' : 'bg-muted text-foreground'
            )}>
              {item.stat}
            </span>
          )}
        </Link>
      ))}
      {/* Ver mais link */}
      <Link
        href={`/campeonatos/${champId}`}
        className="flex items-center justify-center gap-1 px-4 py-2 text-[11px] text-muted-foreground hover:text-[#1a237e] transition-colors border-t border-border/50 bg-white"
      >
        Ver todos no campeonato <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
