import { Match } from '@/types';

interface MatchArtProps {
  match: Match;
  championshipName: string;
}

function formatArtDate(date: string | null): { date: string; time: string } {
  if (!date) return { date: '', time: '' };
  const d = new Date(date);
  return {
    date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }).toUpperCase(),
    time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  };
}

export default function MatchArt({ match, championshipName }: MatchArtProps) {
  const { date, time } = formatArtDate(match.match_date);
  const isFinished = match.status === 'Finalizada';

  return (
    <div style={{
      width: 1080, minWidth: 1080, height: 1080,
      background: 'linear-gradient(160deg, #0a1628 0%, #132744 40%, #0d1f3c 70%, #0a1628 100%)',
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      fontFamily: '"Inter", sans-serif', boxSizing: 'border-box',
    }}>
      {/* Decorative circles */}
      <div style={{
        position: 'absolute', top: -100, right: -100,
        width: 400, height: 400, borderRadius: '50%',
        border: '2px solid rgba(255,193,7,0.08)',
      }} />
      <div style={{
        position: 'absolute', bottom: -150, left: -150,
        width: 500, height: 500, borderRadius: '50%',
        border: '2px solid rgba(255,193,7,0.06)',
      }} />

      {/* Championship Name */}
      <div style={{ textAlign: 'center', paddingTop: 48, paddingBottom: 16, position: 'relative', zIndex: 1 }}>
        <div style={{
          color: '#ffc107', fontSize: 16, fontWeight: 700,
          letterSpacing: 4, textTransform: 'uppercase',
        }}>
          {championshipName}
        </div>
        {match.match_round && (
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4, letterSpacing: 2 }}>
            {match.match_round}
          </div>
        )}
      </div>

      {/* Main Content - Teams */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 1, padding: '0 32px', width: '100%', boxSizing: 'border-box',
      }}>
        {/* Home Team */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 180, height: 180, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid rgba(255,255,255,0.1)',
          }}>
            {match.home_team_logo ? (
              <img src={match.home_team_logo} alt="" width={130} height={130} style={{ objectFit: 'contain' }} />
            ) : (
              <div style={{ fontSize: 48, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>
                {match.home_team_short?.[0] || match.home_team_name?.[0]}
              </div>
            )}
          </div>
          <div style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, textAlign: 'center', maxWidth: 250 }}>
            {match.home_team_name}
          </div>
        </div>

        {/* VS / Score */}
        <div style={{ margin: '0 16px', textAlign: 'center' }}>
          {isFinished ? (
            <div>
              <div style={{ color: '#ffffff', fontSize: 72, fontWeight: 700, lineHeight: 1, letterSpacing: 4 }}>
                {match.home_score} - {match.away_score}
              </div>
              <div style={{ color: '#ffc107', fontSize: 14, fontWeight: 600, marginTop: 8, letterSpacing: 2, textTransform: 'uppercase' }}>
                Final
              </div>
            </div>
          ) : (
            <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: 80, fontWeight: 700, lineHeight: 1 }}>
              VS
            </div>
          )}
        </div>

        {/* Away Team */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 180, height: 180, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid rgba(255,255,255,0.1)',
          }}>
            {match.away_team_logo ? (
              <img src={match.away_team_logo} alt="" width={130} height={130} style={{ objectFit: 'contain' }} />
            ) : (
              <div style={{ fontSize: 48, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>
                {match.away_team_short?.[0] || match.away_team_name?.[0]}
              </div>
            )}
          </div>
          <div style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, textAlign: 'center', maxWidth: 250 }}>
            {match.away_team_name}
          </div>
        </div>
      </div>

      {/* Date/Time/Venue */}
      <div style={{ textAlign: 'center', paddingBottom: 16, position: 'relative', zIndex: 1 }}>
        {!isFinished && date && (
          <div style={{ color: '#ffc107', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
            {date} - {time}
          </div>
        )}
        {isFinished && match.match_date && (
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
            {new Date(match.match_date).toLocaleDateString('pt-BR')}
          </div>
        )}
        {match.venue && (
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 4 }}>
            {match.venue}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        background: 'rgba(0,0,0,0.4)', padding: '16px 0',
        textAlign: 'center', borderTop: '1px solid rgba(255,193,7,0.2)',
        position: 'relative', zIndex: 1, width: '100%',
      }}>
        <div style={{ color: '#ffc107', fontSize: 16, fontWeight: 700, letterSpacing: 3 }}>
          GALINHA GORDA
        </div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2, letterSpacing: 1 }}>
          galinhagorda.vip
        </div>
      </div>
    </div>
  );
}
