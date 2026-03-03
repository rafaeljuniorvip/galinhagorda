'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/cn';
import { Player, PaginatedResponse } from '@/types';
import { POSITIONS, calculateAge } from '@/lib/utils';

const positionColor = (p: string) => {
  if (p === 'Goleiro') return { bg: 'bg-amber-500', text: 'text-white' };
  if (p === 'Zagueiro' || p === 'Lateral') return { bg: 'bg-blue-600', text: 'text-white' };
  if (p === 'Volante' || p === 'Meia') return { bg: 'bg-emerald-600', text: 'text-white' };
  if (p === 'Atacante') return { bg: 'bg-red-600', text: 'text-white' };
  return { bg: 'bg-gray-500', text: 'text-white' };
};

export default function PlayersListClient() {
  const [data, setData] = useState<PaginatedResponse<Player> | null>(null);
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState('');
  const [page, setPage] = useState(1);

  const loadData = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: '12', active: 'true' });
    if (search) params.set('search', search);
    if (position) params.set('position', position);
    const res = await fetch(`/api/players?${params}`);
    if (res.ok) setData(await res.json());
  }, [page, search, position]);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <div>
      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar jogador..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-9"
          />
        </div>
        <Select
          value={position}
          onValueChange={(val) => { setPosition(val === '__all__' ? '' : val); setPage(1); }}
        >
          <SelectTrigger className="min-w-[160px] h-9">
            <SelectValue placeholder="Posicao" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas</SelectItem>
            {POSITIONS.map(p => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {data?.data.map((player) => {
          const pc = positionColor(player.position);
          return (
            <Link key={player.id} href={`/jogadores/${player.id}`} className="block h-full group">
              <div className="h-full rounded-lg overflow-hidden border border-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                {/* Position color bar */}
                <div className={cn('h-1.5', pc.bg)} />

                {/* Content */}
                <div className="bg-white text-center py-5 px-4">
                  <Avatar className="h-20 w-20 mx-auto mb-3 ring-2 ring-border">
                    <AvatarImage src={player.photo_url || ''} alt={player.name} />
                    <AvatarFallback className="text-2xl font-bold bg-muted">
                      {player.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-base font-bold leading-tight">{player.name}</p>
                  {player.full_name && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                      {player.full_name}
                    </p>
                  )}
                  <Badge className={cn('mt-2.5 text-[0.65rem] font-semibold border-transparent', pc.bg, pc.text)}>
                    {player.position}
                  </Badge>
                  {player.birth_date && (
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      {calculateAge(player.birth_date)} anos
                    </p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {data?.data.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Nenhum jogador encontrado</p>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === page ? 'default' : 'outline'}
              size="icon"
              className={cn('h-8 w-8 text-xs', p === page && 'pointer-events-none')}
              onClick={() => setPage(p)}
            >
              {p}
            </Button>
          ))}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
            disabled={page >= data.totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
