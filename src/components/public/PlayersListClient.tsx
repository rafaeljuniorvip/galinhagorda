'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/cn';
import { Player } from '@/types';
import { POSITIONS, calculateAge } from '@/lib/utils';

const positionColor = (p: string) => {
  if (p === 'Goleiro') return { bg: 'bg-amber-500', text: 'text-white' };
  if (p === 'Zagueiro' || p === 'Lateral') return { bg: 'bg-blue-600', text: 'text-white' };
  if (p === 'Volante' || p === 'Meia') return { bg: 'bg-emerald-600', text: 'text-white' };
  if (p === 'Atacante') return { bg: 'bg-red-600', text: 'text-white' };
  return { bg: 'bg-gray-500', text: 'text-white' };
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function normalize(str: string) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

export default function PlayersListClient() {
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState('');
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/players?all=true');
      if (res.ok) {
        const d = await res.json();
        const players = ((Array.isArray(d) ? d : d.data || []) as Player[])
          .filter(p => p.active !== false)
          .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        setAllPlayers(players);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Filter players
  const filtered = useMemo(() => {
    let list = allPlayers;
    if (search) {
      const q = normalize(search);
      list = list.filter(p =>
        normalize(p.name).includes(q) ||
        normalize(p.full_name).includes(q) ||
        (p.nickname && normalize(p.nickname).includes(q))
      );
    }
    if (position) {
      list = list.filter(p => p.position === position);
    }
    return list;
  }, [allPlayers, search, position]);

  // Group by initial letter
  const grouped = useMemo(() => {
    const map: Record<string, Player[]> = {};
    for (const p of filtered) {
      const letter = normalize(p.name.charAt(0));
      const key = ALPHABET.includes(letter) ? letter : '#';
      if (!map[key]) map[key] = [];
      map[key].push(p);
    }
    return map;
  }, [filtered]);

  // Available letters
  const availableLetters = useMemo(() => {
    const set = new Set(Object.keys(grouped));
    return ALPHABET.filter(l => set.has(l));
  }, [grouped]);

  const scrollToLetter = (letter: string) => {
    setActiveLetter(letter);
    const el = sectionRefs.current[letter];
    if (el) {
      const offset = 120; // account for sticky header + letter bar
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  // Track active letter on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 140;
      let current: string | null = null;
      for (const letter of availableLetters) {
        const el = sectionRefs.current[letter];
        if (el && el.offsetTop <= scrollPos) {
          current = letter;
        }
      }
      if (current) setActiveLetter(current);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [availableLetters]);

  if (loading) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Carregando jogadores...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-4 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar jogador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select
          value={position}
          onValueChange={(val) => setPosition(val === '__all__' ? '' : val)}
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

      {/* Alphabet bar */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b py-2 mb-6 -mx-4 px-4">
        <div className="flex flex-wrap justify-center gap-1">
          {ALPHABET.map((letter) => {
            const available = availableLetters.includes(letter);
            return (
              <button
                key={letter}
                onClick={() => available && scrollToLetter(letter)}
                disabled={!available}
                className={cn(
                  'h-8 w-8 rounded text-xs font-bold transition-all',
                  available && activeLetter === letter
                    ? 'bg-[#1a237e] text-white shadow-sm'
                    : available
                      ? 'bg-muted hover:bg-[#1a237e]/10 text-foreground hover:text-[#1a237e]'
                      : 'text-muted-foreground/30 cursor-default'
                )}
              >
                {letter}
              </button>
            );
          })}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-1.5">
          {filtered.length} jogador{filtered.length !== 1 ? 'es' : ''}
        </p>
      </div>

      {/* Grouped players */}
      {availableLetters.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Nenhum jogador encontrado</p>
        </div>
      )}

      {availableLetters.map((letter) => (
        <div
          key={letter}
          ref={(el) => { sectionRefs.current[letter] = el; }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="flex items-center justify-center h-9 w-9 rounded-lg bg-[#1a237e] text-white font-extrabold text-lg shrink-0">
              {letter}
            </span>
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">{grouped[letter].length}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {grouped[letter].map((player) => {
              const pc = positionColor(player.position);
              return (
                <Link key={player.id} href={`/jogadores/${player.id}`} className="block h-full group">
                  <div className="h-full rounded-lg overflow-hidden border border-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                    <div className={cn('h-1.5', pc.bg)} />
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
        </div>
      ))}
    </div>
  );
}
