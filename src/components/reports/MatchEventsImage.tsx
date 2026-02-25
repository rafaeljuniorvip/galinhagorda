import { Match, MatchEvent } from '@/types';

interface MatchEventsImageProps {
  match: Match;
  events: MatchEvent[];
  championshipName: string;
}

const EVENT_ICONS: Record<string, { icon: string; label: string }> = {
  GOL: { icon: '\u26BD', label: 'Gol' },
  GOL_PENALTI: { icon: '\u26BD', label: 'Gol (Pen)' },
  GOL_CONTRA: { icon: '\u26BD', label: 'Gol Contra' },
  CARTAO_AMARELO: { icon: '\uD83D\uDFE8', label: 'Amarelo' },
  CARTAO_VERMELHO: { icon: '\uD83D\uDFE5', label: 'Vermelho' },
  SEGUNDO_AMARELO: { icon: '\uD83D\uDFE7', label: '2 Amarelo' },
  SUBSTITUICAO_ENTRADA: { icon: '\u2B06\uFE0F', label: 'Entrou' },
  SUBSTITUICAO_SAIDA: { icon: '\u2B07\uFE0F', label: 'Saiu' },
};

function formatMatchDate(date: string | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function MatchEventsImage({ match, events, championshipName }: MatchEventsImageProps) {
  const homeEvents = events.filter(e => e.team_name === match.home_team_name);
  const awayEvents = events.filter(e => e.team_name === match.away_team_name);

  const countEvents = (evts: MatchEvent[], types: string[]) =>
    evts.filter(e => types.includes(e.event_type)).length;

  const homeGoals = countEvents(homeEvents, ['GOL', 'GOL_PENALTI']);
  const awayGoals = countEvents(awayEvents, ['GOL', 'GOL_PENALTI']);
  const homeYellows = countEvents(homeEvents, ['CARTAO_AMARELO', 'SEGUNDO_AMARELO']);
  const awayYellows = countEvents(awayEvents, ['CARTAO_AMARELO', 'SEGUNDO_AMARELO']);
  const homeReds = countEvents(homeEvents, ['CARTAO_VERMELHO']);
  const awayReds = countEvents(awayEvents, ['CARTAO_VERMELHO']);

  const renderEvent = (e: MatchEvent) => {
    const info = EVENT_ICONS[e.event_type] || { icon: '', label: e.event_type };
    return (
      <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
        <span style={{ fontSize: 16 }}>{info.icon}</span>
        <span style={{ fontSize: 13, color: '#333' }}>
          <strong>{e.minute ? `${e.minute}'` : ''}</strong> {e.player_name}
        </span>
      </div>
    );
  };

  const stats = [
    { label: 'Gols', home: homeGoals, away: awayGoals },
    { label: 'C. Amarelos', home: homeYellows, away: awayYellows },
    { label: 'C. Vermelhos', home: homeReds, away: awayReds },
  ];

  return (
    <div style={{ width: 1080, minWidth: 1080, fontFamily: '"Inter", sans-serif', background: '#ffffff' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
        padding: '12px 32px', textAlign: 'center', width: '100%', boxSizing: 'border-box',
      }}>
        <div style={{ color: '#ffc107', fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
          {championshipName} {match.match_round ? `- ${match.match_round}` : ''}
        </div>
      </div>

      {/* Score Section */}
      <div style={{
        display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center',
        padding: '24px 32px', background: '#f5f5f5', boxSizing: 'border-box',
      }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16 }}>
          <div style={{ fontSize: 22, fontWeight: 700, textAlign: 'right' }}>{match.home_team_name}</div>
          {match.home_team_logo && (
            <img src={match.home_team_logo} alt="" width={56} height={56} style={{ objectFit: 'contain', flexShrink: 0 }} />
          )}
        </div>
        <div style={{ margin: '0 24px', padding: '8px 32px', background: '#1a237e', borderRadius: 8 }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#ffffff', letterSpacing: 4 }}>
            {match.home_score ?? 0} - {match.away_score ?? 0}
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 16 }}>
          {match.away_team_logo && (
            <img src={match.away_team_logo} alt="" width={56} height={56} style={{ objectFit: 'contain', flexShrink: 0 }} />
          )}
          <div style={{ fontSize: 22, fontWeight: 700 }}>{match.away_team_name}</div>
        </div>
      </div>

      {/* Match Info */}
      <div style={{
        display: 'flex', width: '100%', justifyContent: 'center', gap: 32,
        padding: '8px 16px', background: '#e8eaf6', fontSize: 12, color: '#444', boxSizing: 'border-box',
      }}>
        {match.match_date && <span>{formatMatchDate(match.match_date)}</span>}
        {match.venue && <span>{match.venue}</span>}
        {match.referee && <span>Arbitro: {match.referee}</span>}
      </div>

      {/* Events two columns */}
      <div style={{
        display: 'flex', width: '100%', padding: '16px 32px',
        minHeight: 120, boxSizing: 'border-box',
      }}>
        <div style={{ flex: 1, paddingRight: 24, borderRight: '1px solid #e0e0e0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1a237e', marginBottom: 8, textTransform: 'uppercase' }}>
            {match.home_team_name}
          </div>
          {homeEvents.length > 0 ? homeEvents.map(renderEvent) : (
            <div style={{ fontSize: 12, color: '#999' }}>Sem eventos</div>
          )}
        </div>
        <div style={{ flex: 1, paddingLeft: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1a237e', marginBottom: 8, textTransform: 'uppercase' }}>
            {match.away_team_name}
          </div>
          {awayEvents.length > 0 ? awayEvents.map(renderEvent) : (
            <div style={{ fontSize: 12, color: '#999' }}>Sem eventos</div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{
        display: 'flex', width: '100%', background: '#263238', color: '#ffffff',
        padding: '12px 32px', boxSizing: 'border-box',
      }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 700, width: 30, textAlign: 'right' }}>{stat.home}</span>
            <span style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase' }}>{stat.label}</span>
            <span style={{ fontSize: 16, fontWeight: 700, width: 30, textAlign: 'left' }}>{stat.away}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
        padding: '12px 32px', textAlign: 'center',
      }}>
        <div style={{ color: '#ffc107', fontSize: 14, fontWeight: 700 }}>galinhagorda.vip</div>
      </div>
    </div>
  );
}
