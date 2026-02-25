import { Box, Typography } from '@mui/material';

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
    <Box sx={{ width: 1080, fontFamily: '"Inter", sans-serif', bgcolor: '#ffffff' }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
          px: 4,
          py: 3,
          textAlign: 'center',
        }}
      >
        <Typography sx={{ color: '#ffffff', fontSize: 28, fontWeight: 700 }}>
          {championshipName} {year}
        </Typography>
      </Box>
      <Box sx={{ px: 1, py: 0.5, bgcolor: '#ffc107', textAlign: 'center' }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1a237e', letterSpacing: 2, textTransform: 'uppercase' }}>
          Artilharia
        </Typography>
      </Box>

      {/* Scorers list */}
      {scorers.map((scorer, index) => {
        const pos = index + 1;
        const medalColor = MEDAL_COLORS[pos];
        const isTop3 = pos <= 3;

        return (
          <Box
            key={scorer.player_id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 3,
              py: isTop3 ? 1.5 : 1,
              bgcolor: index % 2 === 0 ? '#ffffff' : '#f5f5f5',
              borderLeft: medalColor ? `4px solid ${medalColor}` : '4px solid transparent',
            }}
          >
            {/* Position */}
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                bgcolor: medalColor || '#e0e0e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: isTop3 ? 18 : 15,
                color: medalColor ? '#1a237e' : '#666',
                mr: 2,
                flexShrink: 0,
              }}
            >
              {pos}
            </Box>

            {/* Player photo */}
            <Box
              sx={{
                width: isTop3 ? 52 : 40,
                height: isTop3 ? 52 : 40,
                borderRadius: '50%',
                overflow: 'hidden',
                bgcolor: '#e0e0e0',
                mr: 2,
                flexShrink: 0,
                border: medalColor ? `2px solid ${medalColor}` : '2px solid #e0e0e0',
              }}
            >
              {scorer.photo_url ? (
                <img src={scorer.photo_url} alt="" width={isTop3 ? 52 : 40} height={isTop3 ? 52 : 40} style={{ objectFit: 'cover' }} />
              ) : (
                <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isTop3 ? 20 : 16, fontWeight: 700, color: '#999' }}>
                  {scorer.player_name[0]}
                </Box>
              )}
            </Box>

            {/* Name + Team */}
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: isTop3 ? 17 : 15, color: '#333' }}>
                {scorer.player_name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2 }}>
                {scorer.team_logo && (
                  <img src={scorer.team_logo} alt="" width={16} height={16} style={{ objectFit: 'contain' }} />
                )}
                <Typography sx={{ fontSize: 12, color: '#666' }}>{scorer.team_name}</Typography>
              </Box>
            </Box>

            {/* Goals */}
            <Box
              sx={{
                bgcolor: isTop3 ? '#1a237e' : '#424242',
                color: '#ffffff',
                borderRadius: 2,
                px: 2.5,
                py: 0.8,
                fontWeight: 700,
                fontSize: isTop3 ? 20 : 16,
                minWidth: 60,
                textAlign: 'center',
              }}
            >
              {scorer.goals}
            </Box>
          </Box>
        );
      })}

      {scorers.length === 0 && (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography sx={{ color: '#999' }}>Nenhum gol registrado</Typography>
        </Box>
      )}

      {/* Footer */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
          px: 4,
          py: 1.5,
          textAlign: 'center',
        }}
      >
        <Typography sx={{ color: '#ffc107', fontSize: 14, fontWeight: 700 }}>
          galinhagorda.vip
        </Typography>
      </Box>
    </Box>
  );
}
