interface Scorer {
  player_id: string;
  player_name: string;
  photo_url: string | null;
  team_name: string;
  team_logo: string | null;
  goals: number;
}

interface TopScorersImageProps {
  scorers: Scorer[];
  championshipName: string;
  year: number;
}

const MEDAL_COLORS: Record<number, string> = {
  1: '#FFD700',
  2: '#C0C0C0',
  3: '#CD7F32',
};

export default function TopScorersImage({ scorers, championshipName, year }: TopScorersImageProps) {
  return (
    <div style={{ width: 1080, minWidth: 1080, fontFamily: '"Inter", sans-serif', background: '#ffffff' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
        padding: '24px 32px', textAlign: 'center',
      }}>
        <div style={{ color: '#ffffff', fontSize: 28, fontWeight: 700 }}>
          {championshipName} {year}
        </div>
      </div>
      <div style={{ padding: '4px 8px', background: '#ffc107', textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a237e', letterSpacing: 2, textTransform: 'uppercase' }}>
          Artilharia
        </div>
      </div>

      {/* Scorers list */}
      {scorers.map((scorer, index) => {
        const pos = index + 1;
        const medalColor = MEDAL_COLORS[pos];
        const isTop3 = pos <= 3;
        const photoSize = isTop3 ? 52 : 40;

        return (
          <div
            key={scorer.player_id}
            style={{
              display: 'flex', width: '100%', alignItems: 'center',
              padding: isTop3 ? '12px 24px' : '8px 24px', boxSizing: 'border-box',
              background: index % 2 === 0 ? '#ffffff' : '#f5f5f5',
              borderLeft: medalColor ? `4px solid ${medalColor}` : '4px solid transparent',
            }}
          >
            {/* Position */}
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: medalColor || '#e0e0e0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: isTop3 ? 18 : 15,
              color: medalColor ? '#1a237e' : '#666',
              marginRight: 16, flexShrink: 0,
            }}>
              {pos}
            </div>

            {/* Player photo */}
            <div style={{
              width: photoSize, height: photoSize, borderRadius: '50%',
              overflow: 'hidden', background: '#e0e0e0',
              marginRight: 16, flexShrink: 0,
              border: medalColor ? `2px solid ${medalColor}` : '2px solid #e0e0e0',
            }}>
              {scorer.photo_url ? (
                <img src={scorer.photo_url} alt="" width={photoSize} height={photoSize} style={{ objectFit: 'cover' }} />
              ) : (
                <div style={{
                  width: '100%', height: '100%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: isTop3 ? 20 : 16, fontWeight: 700, color: '#999',
                }}>
                  {scorer.player_name[0]}
                </div>
              )}
            </div>

            {/* Name + Team */}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: isTop3 ? 17 : 15, color: '#333' }}>
                {scorer.player_name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                {scorer.team_logo && (
                  <img src={scorer.team_logo} alt="" width={16} height={16} style={{ objectFit: 'contain' }} />
                )}
                <span style={{ fontSize: 12, color: '#666' }}>{scorer.team_name}</span>
              </div>
            </div>

            {/* Goals */}
            <div style={{
              background: isTop3 ? '#1a237e' : '#424242',
              color: '#ffffff', borderRadius: 8,
              padding: '6px 20px', fontWeight: 700,
              fontSize: isTop3 ? 20 : 16,
              minWidth: 60, textAlign: 'center', flexShrink: 0,
            }}>
              {scorer.goals}
            </div>
          </div>
        );
      })}

      {scorers.length === 0 && (
        <div style={{ padding: '32px', textAlign: 'center', color: '#999' }}>
          Nenhum gol registrado
        </div>
      )}

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
