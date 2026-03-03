'use client';

import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { VoteResult } from '@/types';

interface Props {
  matchId: string;
}

export default function VotingResults({ matchId }: Props) {
  const [results, setResults] = useState<VoteResult[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await fetch(`/api/votes?matchId=${matchId}`);
        const json = await res.json();
        setResults(json.results || []);
        setTotalVotes(json.status?.totalVotes || 0);
      } catch (error) {
        console.error('Error fetching voting results:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, [matchId]);

  if (loading) {
    return (
      <div
        className="rounded-xl p-6"
        style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d1642 100%)' }}
      >
        <Skeleton className="h-10 w-[200px] mx-auto bg-white/10" />
        <div className="flex justify-center gap-4 mt-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-[120px] h-[160px] rounded-lg bg-white/10" />
          ))}
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div
        className="rounded-xl p-6 text-center"
        style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d1642 100%)' }}
      >
        <Trophy className="h-12 w-12 text-[#ffd600]/30 mx-auto mb-2" />
        <p className="text-sm text-white/40">
          Nenhum voto registrado
        </p>
      </div>
    );
  }

  const top3 = results.slice(0, 3);
  const rest = results.slice(3);

  const podiumColors = {
    0: { main: '#ffd600', border: 'rgba(255,214,0,0.5)', bg: 'rgba(255,214,0,0.12)' },
    1: { main: '#bdbdbd', border: 'rgba(189,189,189,0.4)', bg: 'rgba(189,189,189,0.08)' },
    2: { main: '#a1887f', border: 'rgba(161,136,127,0.4)', bg: 'rgba(161,136,127,0.08)' },
  };

  return (
    <div
      className="rounded-xl p-4 md:p-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d1642 100%)' }}
    >
      {/* Background decoration */}
      <div
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,214,0,0.06) 0%, transparent 70%)' }}
      />

      {/* Header */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <Trophy className="h-8 w-8 text-[#ffd600]" />
        <h3 className="text-lg text-white font-extrabold uppercase tracking-wide">
          Craque do Jogo
        </h3>
      </div>

      {/* Winner highlight */}
      {results[0] && (
        <div className="text-center mb-6 relative animate-in fade-in zoom-in-95 duration-500">
          <Trophy
            className="h-10 w-10 text-[#ffd600] mx-auto mb-2"
            style={{ filter: 'drop-shadow(0 4px 8px rgba(255,214,0,0.4))' }}
          />
          <Avatar
            className="h-20 w-20 mx-auto mb-2 border-[3px] border-[#ffd600]"
            style={{ boxShadow: '0 0 20px rgba(255,214,0,0.3)' }}
          >
            <AvatarImage src={results[0].player_photo || ''} />
            <AvatarFallback>{results[0].player_name?.[0]}</AvatarFallback>
          </Avatar>
          <h2 className="text-xl text-white font-extrabold mb-0.5">
            {results[0].player_name}
          </h2>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Avatar className="h-5 w-5">
              <AvatarImage src={results[0].team_logo || ''} />
              <AvatarFallback className="text-[8px]">{results[0].team_name?.[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-white/60">
              {results[0].team_name}
            </span>
          </div>
          <p className="text-3xl text-[#ffd600] font-black">
            {results[0].votes}
          </p>
          <span className="text-xs text-white/50">
            {results[0].percentage}% dos votos
          </span>
        </div>
      )}

      {/* Podium - 2nd and 3rd */}
      {top3.length > 1 && (
        <div className="flex justify-center gap-4 sm:gap-8 mb-6">
          {top3.slice(1).map((result, idx) => {
            const posIdx = idx + 1;
            const colors = podiumColors[posIdx as keyof typeof podiumColors];
            return (
              <div
                key={result.player_id}
                className="text-center p-4 rounded-lg min-w-[100px] sm:min-w-[130px]"
                style={{
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <p className="text-sm font-extrabold mb-2" style={{ color: colors.main }}>
                  {posIdx + 1}o Lugar
                </p>
                <Avatar
                  className="h-[52px] w-[52px] mx-auto mb-2"
                  style={{ border: `2px solid ${colors.main}` }}
                >
                  <AvatarImage src={result.player_photo || ''} />
                  <AvatarFallback>{result.player_name?.[0]}</AvatarFallback>
                </Avatar>
                <p className="text-sm text-white font-bold mb-0.5 truncate">
                  {result.player_name}
                </p>
                <span className="text-xs text-white/40 block mb-1 truncate">
                  {result.team_name}
                </span>
                <p className="text-lg font-extrabold" style={{ color: colors.main }}>
                  {result.votes}
                </p>
                <span className="text-xs text-white/40">
                  {result.percentage}%
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Rest of results */}
      {rest.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          {rest.map((r, idx) => (
            <div key={r.player_id} className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-white/30 w-6 font-bold text-center">
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
                </div>
                <div className="text-right min-w-[50px]">
                  <p className="text-sm text-white font-bold">
                    {r.votes}
                  </p>
                </div>
              </div>
              <div className="ml-8 h-1 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-white/15 transition-all"
                  style={{ width: `${r.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Total footer */}
      <div className="text-center mt-4 pt-4 border-t border-white/[0.08]">
        <span className="text-xs text-white/30">
          Total: {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'}
        </span>
      </div>
    </div>
  );
}
