import { Standing } from '@/types';

interface StandingsImageProps {
  standings: Standing[];
  championshipName: string;
  year: number;
}

export default function StandingsImage({ standings, championshipName, year }: StandingsImageProps) {
  return (
    <div style={{ width: 1080, minWidth: 1080, fontFamily: '"Inter", sans-serif', background: '#ffffff' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
        padding: '24px 32px',
        textAlign: 'center',
      }}>
        <div style={{ color: '#ffffff', fontSize: 28, fontWeight: 700 }}>
          {championshipName} {year}
        </div>
      </div>
      <div style={{ padding: '4px 8px', background: '#ffc107', textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a237e', letterSpacing: 2, textTransform: 'uppercase' }}>
          Classificacao
        </div>
      </div>

      {/* Table Header */}
      <div style={{
        display: 'flex', width: '100%', background: '#263238', color: '#ffffff',
        padding: '10px 16px', fontSize: 13, fontWeight: 700, boxSizing: 'border-box',
      }}>
        <div style={{ width: 40, textAlign: 'center', flexShrink: 0 }}>#</div>
        <div style={{ flex: 1 }}>Time</div>
        <div style={{ width: 55, textAlign: 'center', flexShrink: 0 }}>P</div>
        <div style={{ width: 50, textAlign: 'center', flexShrink: 0 }}>J</div>
        <div style={{ width: 50, textAlign: 'center', flexShrink: 0 }}>V</div>
        <div style={{ width: 50, textAlign: 'center', flexShrink: 0 }}>E</div>
        <div style={{ width: 50, textAlign: 'center', flexShrink: 0 }}>D</div>
        <div style={{ width: 50, textAlign: 'center', flexShrink: 0 }}>GP</div>
        <div style={{ width: 50, textAlign: 'center', flexShrink: 0 }}>GC</div>
        <div style={{ width: 55, textAlign: 'center', flexShrink: 0 }}>SG</div>
      </div>

      {/* Rows */}
      {standings.map((team, index) => {
        const pos = index + 1;
        const sg = team.goals_for - team.goals_against;
        const isTop = pos <= 4;
        const isBottom = pos > standings.length - 2 && standings.length > 4;

        return (
          <div
            key={team.team_id}
            style={{
              display: 'flex', width: '100%', alignItems: 'center',
              padding: '8px 16px', fontSize: 14, boxSizing: 'border-box',
              background: index % 2 === 0 ? '#ffffff' : '#f5f5f5',
              borderLeft: isTop ? '4px solid #2e7d32' : isBottom ? '4px solid #d32f2f' : '4px solid transparent',
            }}
          >
            <div style={{
              width: 40, textAlign: 'center', fontWeight: 700, flexShrink: 0,
              color: isTop ? '#2e7d32' : isBottom ? '#d32f2f' : '#333',
            }}>
              {pos}
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              {team.logo_url && (
                <img src={team.logo_url} alt="" width={24} height={24}
                  style={{ objectFit: 'contain', borderRadius: 4, flexShrink: 0 }} />
              )}
              <span style={{ fontWeight: 600 }}>{team.team_name}</span>
            </div>
            <div style={{ width: 55, textAlign: 'center', fontWeight: 700, color: '#1a237e', fontSize: 15, flexShrink: 0 }}>{team.points}</div>
            <div style={{ width: 50, textAlign: 'center', flexShrink: 0 }}>{team.matches_played}</div>
            <div style={{ width: 50, textAlign: 'center', flexShrink: 0 }}>{team.wins}</div>
            <div style={{ width: 50, textAlign: 'center', flexShrink: 0 }}>{team.draws}</div>
            <div style={{ width: 50, textAlign: 'center', flexShrink: 0 }}>{team.losses}</div>
            <div style={{ width: 50, textAlign: 'center', flexShrink: 0 }}>{team.goals_for}</div>
            <div style={{ width: 50, textAlign: 'center', flexShrink: 0 }}>{team.goals_against}</div>
            <div style={{
              width: 55, textAlign: 'center', fontWeight: 600, flexShrink: 0,
              color: sg > 0 ? '#2e7d32' : sg < 0 ? '#d32f2f' : '#666',
            }}>
              {sg > 0 ? `+${sg}` : sg}
            </div>
          </div>
        );
      })}

      {/* Footer */}
      <div style={{
        background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
        padding: '12px 32px', textAlign: 'center',
      }}>
        <div style={{ color: '#ffc107', fontSize: 14, fontWeight: 700 }}>
          galinhagorda.vip
        </div>
      </div>
    </div>
  );
}
