'use client';

import { useState } from 'react';
import {
  CircleDot, Square, User,
  Ruler, Dumbbell, MapPin,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Player, PlayerStats, PlayerRegistration } from '@/types';
import { calculateAge, formatDate } from '@/lib/utils';
import PlayerMatchHistory from './PlayerMatchHistory';

interface Props {
  player: Player;
  stats: PlayerStats[];
  registrations: PlayerRegistration[];
}

export default function PlayerBIDProfile({ player, stats, registrations }: Props) {
  const [selectedChampionship, setSelectedChampionship] = useState<string>(
    stats[0]?.championship_id || ''
  );

  const currentStats = stats.find(s => s.championship_id === selectedChampionship);
  const currentReg = registrations.find(r => r.championship_id === selectedChampionship);
  const age = player.birth_date ? calculateAge(player.birth_date) : null;

  return (
    <div>
      {/* Header com fundo escuro */}
      <div
        className="text-white py-8 md:py-12"
        style={{ background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Foto */}
            <Avatar className="h-[140px] w-[140px] md:h-[180px] md:w-[180px] border-4 border-[#ffd600]">
              <AvatarImage src={player.photo_url || ''} />
              <AvatarFallback className="bg-[#3949ab] text-white text-6xl font-bold">
                {player.name[0]}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl md:text-[2.8rem] font-extrabold text-[#ffd600] uppercase tracking-wide leading-tight">
                {player.name}
              </h1>
              <p className="text-lg text-white/85 mb-4">
                {player.full_name}
              </p>

              {/* Dados rapidos */}
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                {currentStats && (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={currentStats.team_logo || ''} />
                      <AvatarFallback className="text-[10px]">{currentStats.team_name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="text-[10px] text-white/60 block uppercase">CLUBE ATUAL</span>
                      <span className="text-sm font-bold">{currentStats.team_name}</span>
                    </div>
                  </div>
                )}

                {player.birth_date && (
                  <div>
                    <span className="text-[10px] text-white/60 block uppercase">NASCIMENTO</span>
                    <span className="text-sm font-bold">{formatDate(player.birth_date)}</span>
                  </div>
                )}

                {age && (
                  <div>
                    <span className="text-[10px] text-white/60 block uppercase">IDADE</span>
                    <span className="text-sm font-bold">{age} anos</span>
                  </div>
                )}

                <div>
                  <span className="text-[10px] text-white/60 block uppercase">POSICAO</span>
                  <span className="text-sm font-bold">{player.position}</span>
                </div>

                {currentReg?.bid_number && (
                  <div>
                    <span className="text-[10px] text-white/60 block uppercase">N BID</span>
                    <span className="text-sm font-bold">{currentReg.bid_number}</span>
                  </div>
                )}

                {currentReg?.shirt_number && (
                  <div>
                    <span className="text-[10px] text-white/60 block uppercase">CAMISA</span>
                    <span className="text-sm font-bold">#{currentReg.shirt_number}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Info adicional do jogador */}
        <div className="flex flex-wrap gap-2 mb-8">
          {player.height && (
            <Badge variant="outline" className="gap-1">
              <Ruler className="h-4 w-4" />
              {player.height}m
            </Badge>
          )}
          {player.weight && (
            <Badge variant="outline" className="gap-1">
              <Dumbbell className="h-4 w-4" />
              {player.weight}kg
            </Badge>
          )}
          {player.dominant_foot && (
            <Badge variant="outline">
              Pe {player.dominant_foot}
            </Badge>
          )}
          <Badge variant="outline" className="gap-1">
            <MapPin className="h-4 w-4" />
            {player.city}/{player.state}
          </Badge>
        </div>

        {/* Seletor de Campeonato */}
        {stats.length > 0 && (
          <>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <h2 className="text-xl font-bold text-[#1a237e]">
                ESTATISTICAS
              </h2>
              {stats.length > 1 && (
                <Select value={selectedChampionship} onValueChange={setSelectedChampionship}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Campeonato" />
                  </SelectTrigger>
                  <SelectContent>
                    {stats.map(s => (
                      <SelectItem key={s.championship_id} value={s.championship_id}>
                        {s.championship_name} ({s.year})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Cards de estatisticas */}
            {currentStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <Card className="text-center border-2 border-[#e0e0e0]">
                  <CardContent className="py-6">
                    <CircleDot className="h-7 w-7 text-[#1976d2] mx-auto mb-1" />
                    <p className="text-4xl font-extrabold text-[#1a237e]">
                      {String(currentStats.matches_played).padStart(2, '0')}
                    </p>
                    <span className="text-xs font-semibold text-muted-foreground">
                      PARTIDAS
                    </span>
                  </CardContent>
                </Card>
                <Card className="text-center border-2 border-[#e0e0e0]">
                  <CardContent className="py-6">
                    <CircleDot className="h-7 w-7 text-[#2e7d32] mx-auto mb-1" />
                    <p className="text-4xl font-extrabold text-[#1a237e]">
                      {String(currentStats.goals).padStart(2, '0')}
                    </p>
                    <span className="text-xs font-semibold text-muted-foreground">
                      GOL
                    </span>
                  </CardContent>
                </Card>
                <Card className="text-center border-2 border-[#e0e0e0]">
                  <CardContent className="py-6">
                    <Square className="h-7 w-7 text-[#ffd600] mx-auto mb-1" />
                    <p className="text-4xl font-extrabold text-[#1a237e]">
                      {String(currentStats.yellow_cards).padStart(2, '0')}
                    </p>
                    <span className="text-xs font-semibold text-muted-foreground">
                      AMARELO
                    </span>
                  </CardContent>
                </Card>
                <Card className="text-center border-2 border-[#e0e0e0]">
                  <CardContent className="py-6">
                    <Square className="h-7 w-7 text-[#d32f2f] mx-auto mb-1" />
                    <p className="text-4xl font-extrabold text-[#1a237e]">
                      {String(currentStats.red_cards).padStart(2, '0')}
                    </p>
                    <span className="text-xs font-semibold text-muted-foreground">
                      VERMELHO
                    </span>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Historico de partidas */}
            {selectedChampionship && (
              <PlayerMatchHistory playerId={player.id} championshipId={selectedChampionship} />
            )}
          </>
        )}

        {stats.length === 0 && (
          <div className="text-center py-12">
            <User className="h-16 w-16 text-[#ccc] mx-auto" />
            <p className="text-lg text-muted-foreground mt-4">
              Este jogador ainda nao possui inscricoes em campeonatos
            </p>
          </div>
        )}

        {/* Historico de inscricoes */}
        {registrations.length > 0 && (
          <div className="mt-8">
            <Separator className="mb-6" />
            <h3 className="text-lg font-bold text-[#1a237e] mb-4">
              HISTORICO DE INSCRICOES
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {registrations.map((r) => (
                <Card key={r.id} className="border">
                  <CardContent className="flex items-center gap-4 p-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={r.team_logo || ''} />
                      <AvatarFallback>{r.team_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{r.team_name}</p>
                      <span className="text-xs text-muted-foreground">{r.championship_name}</span>
                    </div>
                    <div className="text-right">
                      {r.shirt_number && (
                        <Badge variant="secondary" className="text-xs">#{r.shirt_number}</Badge>
                      )}
                      <span className="text-xs text-muted-foreground block">{r.bid_number}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
