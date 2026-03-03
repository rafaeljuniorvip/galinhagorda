import type { Metadata } from 'next';
import { getAllChampionships } from '@/services/championshipService';
import { Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Campeonatos' };

const statusConfig = (s: string) => {
  if (s === 'Em Andamento') return { bg: 'bg-[#1a237e]', text: 'text-white' };
  if (s === 'Finalizado') return { bg: 'bg-[#2e7d32]', text: 'text-white' };
  if (s === 'Cancelado') return { bg: 'bg-[#d32f2f]', text: 'text-white' };
  if (s === 'Inscricoes Abertas') return { bg: 'bg-[#ed6c02]', text: 'text-white' };
  return { bg: 'bg-gray-200', text: 'text-gray-700' };
};

export default async function CampeonatosPage() {
  const championships = await getAllChampionships();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-7 bg-[#1a237e] rounded-full" />
        <div>
          <h1 className="text-2xl font-bold text-[#0d1b2a]">Campeonatos</h1>
          <p className="text-sm text-muted-foreground">Acompanhe os campeonatos organizados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {championships.map((c) => {
          const sc = statusConfig(c.status);
          return (
            <Link key={c.id} href={`/campeonatos/${c.id}`} className="group">
              <div className="h-full rounded-lg overflow-hidden border border-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                {/* Status header */}
                <div className="bg-[#0d1b2a] px-4 py-2.5 flex items-center justify-between">
                  <Badge className={`${sc.bg} ${sc.text} text-[0.6rem] h-5 border-transparent font-semibold`}>
                    {c.status}
                  </Badge>
                  <Badge className="bg-white/10 text-white/60 text-[0.6rem] h-5 border-transparent">
                    {c.format}
                  </Badge>
                </div>

                {/* Content */}
                <div className="bg-white p-5">
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                      <Trophy className="h-6 w-6 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#0d1b2a] text-base leading-tight">{c.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.category} | {c.year}</p>
                    </div>
                  </div>
                  {c.description && (
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2 leading-relaxed">{c.description}</p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {championships.length === 0 && (
        <p className="text-center py-12 text-muted-foreground">Nenhum campeonato cadastrado</p>
      )}
    </div>
  );
}
