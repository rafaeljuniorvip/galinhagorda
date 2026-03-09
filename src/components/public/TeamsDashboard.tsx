import { getOne, getMany } from '@/lib/db';
import { getChampionshipStandings, getTopScorers } from '@/services/statsService';
import { Championship, Standing } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/cn';
import { Trophy, Swords, Target, Shield } from 'lucide-react';
import Link from 'next/link';

async function getActiveChampionship(): Promise<Championship | null> {
  return getOne<Championship>(
    `SELECT * FROM championships WHERE active = true AND status IN ('Em Andamento', 'Inscricoes Abertas') ORDER BY CASE WHEN status = 'Em Andamento' THEN 0 ELSE 1 END, year DESC LIMIT 1`
  );
}

async function getTeamGoals(championshipId: string): Promise<any[]> {
  return getMany(
    `SELECT t.id AS team_id, t.name AS team_name, t.logo_url, t.short_name,
      COALESCE(SUM(CASE WHEN m.home_team_id = t.id THEN m.home_score WHEN m.away_team_id = t.id THEN m.away_score ELSE 0 END), 0)::int AS goals_for,
      COALESCE(SUM(CASE WHEN m.home_team_id = t.id THEN m.away_score WHEN m.away_team_id = t.id THEN m.home_score ELSE 0 END), 0)::int AS goals_against
    FROM team_championships tc
    JOIN teams t ON t.id = tc.team_id
    LEFT JOIN matches m ON m.championship_id = tc.championship_id
      AND (m.home_team_id = tc.team_id OR m.away_team_id = tc.team_id)
      AND m.status = 'Finalizada'
    WHERE tc.championship_id = $1
    GROUP BY t.id, t.name, t.logo_url, t.short_name
    ORDER BY goals_for DESC
    LIMIT 5`,
    [championshipId]
  );
}

export default async function TeamsDashboard() {
  const champ = await getActiveChampionship();
  if (!champ) return null;

  const [standings, teamGoals] = await Promise.all([
    getChampionshipStandings(champ.id),
    getTeamGoals(champ.id),
  ]);

  if (standings.length === 0) return null;

  const totalGoals = teamGoals.reduce((s, t) => s + t.goals_for, 0);
  const bestDefense = [...teamGoals].sort((a, b) => a.goals_against - b.goals_against)[0];
  const bestAttack = teamGoals[0];

  return (
    <div className="mb-8">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<Trophy className="h-5 w-5 text-[#ffd600]" />} value={standings[0]?.team_name || '-'} label="Lider" isText />
        <StatCard icon={<Target className="h-5 w-5 text-emerald-500" />} value={bestAttack?.team_name || '-'} label={`Melhor ataque (${bestAttack?.goals_for || 0} gols)`} isText />
        <StatCard icon={<Shield className="h-5 w-5 text-blue-500" />} value={bestDefense?.team_name || '-'} label={`Melhor defesa (${bestDefense?.goals_against || 0} gols)`} isText />
        <StatCard icon={<Swords className="h-5 w-5 text-[#1a237e]" />} value={totalGoals} label="Total de gols no campeonato" />
      </div>

      {/* Mini standings */}
      <div className="rounded-lg overflow-hidden border mb-6">
        <div className="flex items-center justify-between bg-[#0d1b2a] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-[#1a237e]" />
            <span className="text-xs font-semibold text-white uppercase tracking-wide">
              Classificacao - {champ.name}
            </span>
          </div>
          <Link href={`/campeonatos/${champ.id}`} className="text-[10px] text-white/50 hover:text-white/80 transition-colors">
            Ver completa →
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-[11px] text-muted-foreground">
              <th className="px-3 py-2 text-left font-medium w-8">#</th>
              <th className="px-3 py-2 text-left font-medium">Time</th>
              <th className="px-3 py-2 text-center font-medium">P</th>
              <th className="px-3 py-2 text-center font-medium">J</th>
              <th className="px-3 py-2 text-center font-medium">V</th>
              <th className="px-3 py-2 text-center font-medium hidden sm:table-cell">E</th>
              <th className="px-3 py-2 text-center font-medium hidden sm:table-cell">D</th>
              <th className="px-3 py-2 text-center font-medium">SG</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => (
              <tr key={s.team_id} className={cn('border-t border-border/50', i % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fa]')}>
                <td className="px-3 py-2">
                  <span className={cn(
                    'inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold',
                    i === 0 ? 'bg-[#ffd600] text-[#0d1b2a]' : i < 4 ? 'bg-[#2e7d32] text-white' : 'bg-gray-200 text-gray-600'
                  )}>
                    {i + 1}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <Link href={`/times/${s.team_id}`} className="flex items-center gap-2 hover:underline">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={s.logo_url || ''} />
                      <AvatarFallback className="text-[8px] font-bold">{s.short_name?.[0] || s.team_name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-[#0d1b2a] text-xs">{s.team_name}</span>
                  </Link>
                </td>
                <td className="px-3 py-2 text-center font-extrabold text-[#1a237e] text-xs">{s.points}</td>
                <td className="px-3 py-2 text-center text-xs text-muted-foreground">{s.matches_played}</td>
                <td className="px-3 py-2 text-center text-xs text-muted-foreground">{s.wins}</td>
                <td className="px-3 py-2 text-center text-xs text-muted-foreground hidden sm:table-cell">{s.draws}</td>
                <td className="px-3 py-2 text-center text-xs text-muted-foreground hidden sm:table-cell">{s.losses}</td>
                <td className="px-3 py-2 text-center text-xs text-muted-foreground">{s.goals_for - s.goals_against}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, isText }: { icon: React.ReactNode; value: string | number; label: string; isText?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-white p-4">
      {icon}
      <div className="min-w-0">
        <p className={cn('font-extrabold text-[#0d1b2a] leading-tight truncate', isText ? 'text-sm' : 'text-xl')}>{value}</p>
        <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
      </div>
    </div>
  );
}
