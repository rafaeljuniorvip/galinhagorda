import type { Metadata } from 'next';
import { getAllTeams } from '@/services/teamService';
import TeamsDashboard from '@/components/public/TeamsDashboard';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Times' };

export default async function TimesPage() {
  const teams = await getAllTeams();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-7 bg-[#1a237e] rounded-full" />
        <div>
          <h1 className="text-2xl font-bold text-[#0d1b2a]">Times</h1>
          <p className="text-sm text-muted-foreground">Times participantes dos campeonatos</p>
        </div>
      </div>
      <TeamsDashboard />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {teams.map((team) => (
          <Link key={team.id} href={`/times/${team.id}`} className="group">
            <div className="h-full rounded-lg overflow-hidden border border-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              {/* Team color accent bar */}
              <div
                className="h-1.5"
                style={{ backgroundColor: team.primary_color || '#1a237e' }}
              />

              {/* Content */}
              <div className="bg-white text-center py-6 px-4">
                <Avatar
                  className="h-[76px] w-[76px] mx-auto mb-3 ring-2 ring-border"
                  style={{ backgroundColor: team.primary_color || 'hsl(var(--primary))' }}
                >
                  <AvatarImage src={team.logo_url || ''} />
                  <AvatarFallback
                    className="text-white text-2xl font-bold"
                    style={{ backgroundColor: team.primary_color || 'hsl(var(--primary))' }}
                  >
                    {team.short_name?.[0] || team.name[0]}
                  </AvatarFallback>
                </Avatar>
                <p className="font-bold text-[#0d1b2a] leading-tight">{team.name}</p>
                {team.short_name && (
                  <p className="text-xs text-muted-foreground mt-0.5">{team.short_name}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{team.city}/{team.state}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {teams.length === 0 && (
        <p className="text-center py-12 text-muted-foreground">Nenhum time cadastrado</p>
      )}
    </div>
  );
}
