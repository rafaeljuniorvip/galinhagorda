import { Box, Typography } from '@mui/material';
import { Standing } from '@/types';

interface StandingsImageProps {
  standings: Standing[];
  championshipName: string;
  year: number;
}

export default function StandingsImage({ standings, championshipName, year }: StandingsImageProps) {
  return (
    <Box sx={{ width: 1080, fontFamily: '"Inter", sans-serif', bgcolor: '#ffffff' }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
          px: 4,
          py: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <Typography sx={{ color: '#ffffff', fontSize: 28, fontWeight: 700, textAlign: 'center' }}>
          {championshipName} {year}
        </Typography>
      </Box>
      <Box sx={{ px: 1, py: 0.5, bgcolor: '#ffc107', textAlign: 'center' }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1a237e', letterSpacing: 2, textTransform: 'uppercase' }}>
          Classificacao
        </Typography>
      </Box>

      {/* Table Header */}
      <Box
        sx={{
          display: 'flex',
          bgcolor: '#263238',
          color: '#ffffff',
          px: 2,
          py: 1.2,
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        <Box sx={{ width: 40, textAlign: 'center' }}>#</Box>
        <Box sx={{ flex: 1 }}>Time</Box>
        <Box sx={{ width: 50, textAlign: 'center' }}>P</Box>
        <Box sx={{ width: 50, textAlign: 'center' }}>J</Box>
        <Box sx={{ width: 50, textAlign: 'center' }}>V</Box>
        <Box sx={{ width: 50, textAlign: 'center' }}>E</Box>
        <Box sx={{ width: 50, textAlign: 'center' }}>D</Box>
        <Box sx={{ width: 50, textAlign: 'center' }}>GP</Box>
        <Box sx={{ width: 50, textAlign: 'center' }}>GC</Box>
        <Box sx={{ width: 50, textAlign: 'center' }}>SG</Box>
      </Box>

      {/* Rows */}
      {standings.map((team, index) => {
        const pos = index + 1;
        const sg = team.goals_for - team.goals_against;
        const isTop = pos <= 4;
        const isBottom = pos > standings.length - 2 && standings.length > 4;

        return (
          <Box
            key={team.team_id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 2,
              py: 1,
              fontSize: 14,
              bgcolor: index % 2 === 0 ? '#ffffff' : '#f5f5f5',
              borderLeft: isTop
                ? '4px solid #2e7d32'
                : isBottom
                ? '4px solid #d32f2f'
                : '4px solid transparent',
            }}
          >
            <Box sx={{ width: 40, textAlign: 'center', fontWeight: 700, color: isTop ? '#2e7d32' : isBottom ? '#d32f2f' : '#333' }}>
              {pos}
            </Box>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              {team.logo_url && (
                <img
                  src={team.logo_url}
                  alt=""
                  width={24}
                  height={24}
                  style={{ objectFit: 'contain', borderRadius: 4 }}
                />
              )}
              <span style={{ fontWeight: 600 }}>{team.team_name}</span>
            </Box>
            <Box sx={{ width: 50, textAlign: 'center', fontWeight: 700, color: '#1a237e', fontSize: 15 }}>{team.points}</Box>
            <Box sx={{ width: 50, textAlign: 'center' }}>{team.matches_played}</Box>
            <Box sx={{ width: 50, textAlign: 'center' }}>{team.wins}</Box>
            <Box sx={{ width: 50, textAlign: 'center' }}>{team.draws}</Box>
            <Box sx={{ width: 50, textAlign: 'center' }}>{team.losses}</Box>
            <Box sx={{ width: 50, textAlign: 'center' }}>{team.goals_for}</Box>
            <Box sx={{ width: 50, textAlign: 'center' }}>{team.goals_against}</Box>
            <Box sx={{ width: 50, textAlign: 'center', fontWeight: 600, color: sg > 0 ? '#2e7d32' : sg < 0 ? '#d32f2f' : '#666' }}>
              {sg > 0 ? `+${sg}` : sg}
            </Box>
          </Box>
        );
      })}

      {/* Footer */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
          px: 4,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
        }}
      >
        <Typography sx={{ color: '#ffc107', fontSize: 14, fontWeight: 700 }}>
          galinhagorda.vip
        </Typography>
      </Box>
    </Box>
  );
}
