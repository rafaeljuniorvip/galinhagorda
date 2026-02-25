import { Box, Typography } from '@mui/material';
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
    <Box
      sx={{
        width: 1080,
        height: 1080,
        background: 'linear-gradient(160deg, #0a1628 0%, #132744 40%, #0d1f3c 70%, #0a1628 100%)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Inter", sans-serif',
      }}
    >
      {/* Decorative geometric elements */}
      <Box sx={{
        position: 'absolute', top: -100, right: -100,
        width: 400, height: 400, borderRadius: '50%',
        border: '2px solid rgba(255,193,7,0.08)',
      }} />
      <Box sx={{
        position: 'absolute', bottom: -150, left: -150,
        width: 500, height: 500, borderRadius: '50%',
        border: '2px solid rgba(255,193,7,0.06)',
      }} />
      <Box sx={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600, height: 600, borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.03)',
      }} />

      {/* Championship Name */}
      <Box sx={{ textAlign: 'center', pt: 5, pb: 2, position: 'relative', zIndex: 1 }}>
        <Typography sx={{
          color: '#ffc107', fontSize: 16, fontWeight: 700,
          letterSpacing: 4, textTransform: 'uppercase',
        }}>
          {championshipName}
        </Typography>
        {match.match_round && (
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, mt: 0.5, letterSpacing: 2 }}>
            {match.match_round}
          </Typography>
        )}
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, px: 4 }}>
        {/* Home Team */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            width: 180, height: 180, borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid rgba(255,255,255,0.1)',
          }}>
            {match.home_team_logo ? (
              <img src={match.home_team_logo} alt="" width={130} height={130} style={{ objectFit: 'contain' }} />
            ) : (
              <Typography sx={{ fontSize: 48, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>
                {match.home_team_short?.[0] || match.home_team_name?.[0]}
              </Typography>
            )}
          </Box>
          <Typography sx={{ color: '#ffffff', fontSize: 22, fontWeight: 700, textAlign: 'center', maxWidth: 250 }}>
            {match.home_team_name}
          </Typography>
        </Box>

        {/* VS / Score */}
        <Box sx={{ mx: 2, textAlign: 'center' }}>
          {isFinished ? (
            <Box>
              <Typography sx={{ color: '#ffffff', fontSize: 72, fontWeight: 700, lineHeight: 1, letterSpacing: 4 }}>
                {match.home_score} - {match.away_score}
              </Typography>
              <Typography sx={{ color: '#ffc107', fontSize: 14, fontWeight: 600, mt: 1, letterSpacing: 2, textTransform: 'uppercase' }}>
                Final
              </Typography>
            </Box>
          ) : (
            <Typography sx={{
              color: 'rgba(255,255,255,0.15)', fontSize: 80, fontWeight: 700, lineHeight: 1,
            }}>
              VS
            </Typography>
          )}
        </Box>

        {/* Away Team */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            width: 180, height: 180, borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid rgba(255,255,255,0.1)',
          }}>
            {match.away_team_logo ? (
              <img src={match.away_team_logo} alt="" width={130} height={130} style={{ objectFit: 'contain' }} />
            ) : (
              <Typography sx={{ fontSize: 48, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>
                {match.away_team_short?.[0] || match.away_team_name?.[0]}
              </Typography>
            )}
          </Box>
          <Typography sx={{ color: '#ffffff', fontSize: 22, fontWeight: 700, textAlign: 'center', maxWidth: 250 }}>
            {match.away_team_name}
          </Typography>
        </Box>
      </Box>

      {/* Date/Time/Venue */}
      <Box sx={{ textAlign: 'center', pb: 2, position: 'relative', zIndex: 1 }}>
        {!isFinished && date && (
          <Typography sx={{ color: '#ffc107', fontSize: 24, fontWeight: 700, mb: 0.5 }}>
            {date} - {time}
          </Typography>
        )}
        {isFinished && match.match_date && (
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
            {new Date(match.match_date).toLocaleDateString('pt-BR')}
          </Typography>
        )}
        {match.venue && (
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, mt: 0.5 }}>
            {match.venue}
          </Typography>
        )}
      </Box>

      {/* Footer */}
      <Box sx={{
        bgcolor: 'rgba(0,0,0,0.4)',
        py: 2,
        textAlign: 'center',
        borderTop: '1px solid rgba(255,193,7,0.2)',
        position: 'relative', zIndex: 1,
      }}>
        <Typography sx={{ color: '#ffc107', fontSize: 16, fontWeight: 700, letterSpacing: 3 }}>
          GALINHA GORDA
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, mt: 0.3, letterSpacing: 1 }}>
          galinhagorda.vip
        </Typography>
      </Box>
    </Box>
  );
}
