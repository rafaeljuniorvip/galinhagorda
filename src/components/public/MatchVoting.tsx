'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trophy, CheckCircle, Vote, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { VoteResult } from '@/types';

interface MatchPlayer {
  player_id: string;
  player_name: string;
  player_photo: string | null;
  team_id: string;
  team_name: string;
  team_logo: string | null;
  shirt_number: number | null;
  position: string;
}

interface VotingData {
  results: VoteResult[];
  status: {
    isOpen: boolean;
    deadline: string | null;
    totalVotes: number;
    winner: VoteResult | null;
  };
  userVotedFor: string | null;
  players: MatchPlayer[];
}

interface Props {
  matchId: string;
}

function CountdownTimer({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const end = new Date(deadline).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('Encerrado');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <div className="flex items-center gap-1">
      <Timer className="h-[18px] w-[18px] text-[#ffd600]" />
      <span className="text-sm text-[#ffd600] font-semibold">
        {timeLeft}
      </span>
    </div>
  );
}

export default function MatchVoting({ matchId }: Props) {
  const [data, setData] = useState<VotingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [voterName, setVoterName] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/votes?matchId=${matchId}&include=players`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Error fetching voting data:', error);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleVoteClick = (playerId: string) => {
    setSelectedPlayer(playerId);
    setShowNameDialog(true);
  };

  const handleConfirmVote = async () => {
    if (!selectedPlayer) return;
    setVoting(true);
    setShowNameDialog(false);

    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          playerId: selectedPlayer,
          voterName: voterName || undefined,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        toast.success(json.message);
        await fetchData();
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error('Erro ao registrar voto');
    } finally {
      setVoting(false);
      setVoterName('');
      setSelectedPlayer(null);
    }
  };

  if (loading) {
    return (
      <div
        className="rounded-xl p-6"
        style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d1642 100%)' }}
      >
        <Skeleton className="h-10 w-[200px] bg-white/10" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[140px] rounded-lg bg-white/10" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { status, results, userVotedFor, players } = data;

  // Group players by team
  const teamGroups: Record<string, MatchPlayer[]> = {};
  (players || []).forEach((p) => {
    if (!teamGroups[p.team_id]) teamGroups[p.team_id] = [];
    teamGroups[p.team_id].push(p);
  });

  return (
    <div
      className="rounded-xl p-4 md:p-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d1642 100%)' }}
    >
      {/* Background decoration */}
      <div
        className="absolute -top-[50px] -right-[50px] w-[200px] h-[200px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,214,0,0.08) 0%, transparent 70%)' }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-8 w-8 text-[#ffd600]" />
          <h3 className="text-lg text-white font-extrabold uppercase tracking-wide">
            Craque do Jogo
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {status.isOpen && status.deadline && (
            <CountdownTimer deadline={status.deadline} />
          )}
          <Badge
            className={cn(
              'font-semibold border',
              status.isOpen
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : 'bg-white/10 text-white/50 border-white/10'
            )}
          >
            {status.isOpen ? 'Votacao Aberta' : 'Votacao Encerrada'}
          </Badge>
        </div>
      </div>

      {status.totalVotes > 0 && (
        <p className="text-sm text-white/50 mb-4">
          {status.totalVotes} {status.totalVotes === 1 ? 'voto' : 'votos'} registrados
        </p>
      )}

      {/* Voting Open State */}
      {status.isOpen && !userVotedFor && (
        <>
          {Object.entries(teamGroups).map(([teamId, teamPlayers]) => (
            <div key={teamId} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={teamPlayers[0]?.team_logo || ''} />
                  <AvatarFallback className="text-[10px]">
                    {teamPlayers[0]?.team_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-white/70 font-semibold">
                  {teamPlayers[0]?.team_name}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {teamPlayers.map((player) => (
                  <div
                    key={player.player_id}
                    className="bg-white/5 border border-white/10 rounded-lg cursor-pointer transition-all duration-200 hover:bg-[#ffd600]/10 hover:border-[#ffd600]/30 hover:-translate-y-0.5"
                    onClick={() => handleVoteClick(player.player_id)}
                  >
                    <div className="p-3 text-center">
                      <Avatar className="h-12 w-12 mx-auto mb-2 border-2 border-[#ffd600]/30">
                        <AvatarImage src={player.player_photo || ''} />
                        <AvatarFallback>{player.player_name?.[0]}</AvatarFallback>
                      </Avatar>
                      {player.shirt_number && (
                        <span className="text-[0.65rem] text-[#ffd600] font-extrabold">
                          #{player.shirt_number}
                        </span>
                      )}
                      <p className="text-[0.75rem] text-white font-semibold leading-tight mb-1 truncate">
                        {player.player_name}
                      </p>
                      <span className="text-[0.65rem] text-white/40">
                        {player.position}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={voting}
                        className="mt-2 w-full text-[0.65rem] py-1 h-7 text-[#ffd600] border-[#ffd600]/40 bg-transparent hover:border-[#ffd600] hover:bg-[#ffd600]/10 hover:text-[#ffd600]"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVoteClick(player.player_id);
                        }}
                      >
                        <Vote className="h-3.5 w-3.5 mr-1" />
                        Votar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {/* User already voted */}
      {status.isOpen && userVotedFor && (
        <div className="text-center py-4">
          <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-2" />
          <h3 className="text-lg text-white font-bold mb-2">
            Voto registrado!
          </h3>
          {(() => {
            const votedPlayer = (players || []).find((p) => p.player_id === userVotedFor);
            if (!votedPlayer) return null;
            return (
              <div className="flex items-center justify-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={votedPlayer.player_photo || ''} />
                  <AvatarFallback>{votedPlayer.player_name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-base text-white font-semibold">
                    {votedPlayer.player_name}
                  </p>
                  <span className="text-xs text-white/50">
                    {votedPlayer.team_name}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Show partial results after voting */}
          {results.length > 0 && (
            <div className="mt-6 text-left">
              <p className="text-sm text-white/60 mb-3 text-center">
                Resultados parciais
              </p>
              {results.slice(0, 5).map((r, idx) => (
                <div key={r.player_id} className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-white/40 w-5 font-bold">
                      {idx + 1}.
                    </span>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={r.player_photo || ''} />
                      <AvatarFallback className="text-[10px]">{r.player_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm text-white font-semibold flex-1 truncate">
                      {r.player_name}
                    </p>
                    <span className="text-xs text-[#ffd600] font-bold">
                      {r.percentage}%
                    </span>
                  </div>
                  <div className="ml-7 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        idx === 0 ? 'bg-[#ffd600]' : 'bg-[#1976d2]'
                      )}
                      style={{ width: `${r.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Voting Closed - Show Results */}
      {!status.isOpen && results.length > 0 && (
        <VotingResultsInline results={results} totalVotes={status.totalVotes} />
      )}

      {/* No votes */}
      {!status.isOpen && results.length === 0 && (
        <p className="text-sm text-white/40 text-center py-6">
          Nenhum voto registrado para esta partida
        </p>
      )}

      {/* Name dialog */}
      <Dialog
        open={showNameDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowNameDialog(false);
            setSelectedPlayer(null);
          }
        }}
      >
        <DialogContent className="bg-[#1a237e] text-white border-[#1a237e] rounded-xl max-w-[340px]">
          <DialogHeader>
            <DialogTitle className="text-white font-bold">Confirmar voto</DialogTitle>
            <DialogDescription className="text-white/70">
              Insira seu nome para registrar o voto (opcional):
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Seu nome"
            value={voterName}
            onChange={(e) => setVoterName(e.target.value)}
            className="bg-transparent text-white border-white/20 placeholder:text-white/40 focus-visible:ring-[#ffd600] focus-visible:border-[#ffd600]"
          />
          <DialogFooter className="flex-row justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => { setShowNameDialog(false); setSelectedPlayer(null); }}
              className="text-white/50 hover:text-white hover:bg-white/10"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmVote}
              disabled={voting}
              className="bg-[#ffd600] text-[#1a237e] font-bold hover:bg-[#ffca00]"
            >
              {voting ? 'Votando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VotingResultsInline({ results, totalVotes }: { results: VoteResult[]; totalVotes: number }) {
  const top3 = results.slice(0, 3);
  const rest = results.slice(3);

  return (
    <div>
      {/* Podium */}
      <div className="flex items-end justify-center gap-2 sm:gap-4 mb-6 pt-4">
        {/* 2nd Place */}
        {top3[1] && (
          <PodiumCard
            result={top3[1]}
            position={2}
            totalVotes={totalVotes}
          />
        )}
        {/* 1st Place */}
        {top3[0] && (
          <PodiumCard
            result={top3[0]}
            position={1}
            totalVotes={totalVotes}
          />
        )}
        {/* 3rd Place */}
        {top3[2] && (
          <PodiumCard
            result={top3[2]}
            position={3}
            totalVotes={totalVotes}
          />
        )}
      </div>

      {/* Rest of results */}
      {rest.map((r, idx) => (
        <div key={r.player_id} className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-white/40 w-6 font-bold text-center">
              {idx + 4}
            </span>
            <Avatar className="h-7 w-7">
              <AvatarImage src={r.player_photo || ''} />
              <AvatarFallback className="text-[10px]">{r.player_name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-semibold truncate">
                {r.player_name}
              </p>
              <span className="text-xs text-white/40">
                {r.team_name}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-white font-bold">
                {r.votes}
              </p>
              <span className="text-xs text-white/40">
                {r.percentage}%
              </span>
            </div>
          </div>
          <div className="ml-8 h-1 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-white/20 transition-all"
              style={{ width: `${r.percentage}%` }}
            />
          </div>
        </div>
      ))}

      {/* Total */}
      <div className="text-center mt-4 pt-4 border-t border-white/10">
        <span className="text-xs text-white/40">
          Total de votos: {totalVotes}
        </span>
      </div>
    </div>
  );
}

function PodiumCard({
  result,
  position,
  totalVotes,
}: {
  result: VoteResult;
  position: 1 | 2 | 3;
  totalVotes: number;
}) {
  const configs = {
    1: {
      color: '#ffd600',
      borderColor: 'rgba(255,214,0,0.4)',
      bgGradient: 'linear-gradient(180deg, rgba(255,214,0,0.15) 0%, rgba(255,214,0,0.05) 100%)',
      avatarSize: 64,
      height: 160,
      label: '1o',
    },
    2: {
      color: '#bdbdbd',
      borderColor: 'rgba(189,189,189,0.3)',
      bgGradient: 'linear-gradient(180deg, rgba(189,189,189,0.1) 0%, rgba(189,189,189,0.03) 100%)',
      avatarSize: 52,
      height: 130,
      label: '2o',
    },
    3: {
      color: '#a1887f',
      borderColor: 'rgba(161,136,127,0.3)',
      bgGradient: 'linear-gradient(180deg, rgba(161,136,127,0.1) 0%, rgba(161,136,127,0.03) 100%)',
      avatarSize: 48,
      height: 120,
      label: '3o',
    },
  };

  const config = configs[position];

  return (
    <div
      className="flex flex-col items-center w-[100px] sm:w-[120px] rounded-lg p-3 pt-4 relative"
      style={{
        minHeight: config.height,
        background: config.bgGradient,
        border: `1px solid ${config.borderColor}`,
      }}
    >
      {position === 1 && (
        <Trophy
          className="absolute -top-3 h-7 w-7 text-[#ffd600]"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(255,214,0,0.4))' }}
        />
      )}
      <span
        className={cn(
          'font-extrabold mb-1',
          position === 1 ? 'text-[0.85rem]' : 'text-[0.7rem]'
        )}
        style={{ color: config.color }}
      >
        {config.label}
      </span>
      <Avatar
        className="mb-2"
        style={{
          width: config.avatarSize,
          height: config.avatarSize,
          border: `2px solid ${config.color}`,
        }}
      >
        <AvatarImage src={result.player_photo || ''} />
        <AvatarFallback>{result.player_name?.[0]}</AvatarFallback>
      </Avatar>
      <p className="text-[0.75rem] text-white font-bold text-center leading-tight truncate w-full">
        {result.player_name}
      </p>
      <span className="text-[0.6rem] text-white/40 mb-1 truncate w-full text-center">
        {result.team_name}
      </span>
      <p className="text-base font-extrabold mt-auto" style={{ color: config.color }}>
        {result.votes}
      </p>
      <span className="text-[0.65rem] text-white/50">
        {result.percentage}%
      </span>
    </div>
  );
}
