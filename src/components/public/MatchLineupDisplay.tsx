'use client';

import {
  Box,
  Typography,
  Avatar,
  Paper,
  Grid,
  Chip,
  Divider,
} from '@mui/material';
import { Groups, Person } from '@mui/icons-material';
import { MatchLineup, Match } from '@/types';

interface Props {
  homeLineup: MatchLineup[];
  awayLineup: MatchLineup[];
  match: Match;
}

const positionGroups = [
  { key: 'Goleiro', label: 'Goleiro', positions: ['Goleiro'] },
  {
    key: 'Defesa',
    label: 'Defesa',
    positions: ['Zagueiro', 'Lateral Direito', 'Lateral Esquerdo'],
  },
  {
    key: 'Meio',
    label: 'Meio-campo',
    positions: ['Volante', 'Meia', 'Meia Atacante'],
  },
  {
    key: 'Ataque',
    label: 'Ataque',
    positions: ['Atacante', 'Ponta Direita', 'Ponta Esquerda'],
  },
];

function groupPlayersByPosition(players: MatchLineup[]) {
  const starters = players.filter((p) => p.is_starter);
  const substitutes = players.filter((p) => !p.is_starter);

  const grouped: { label: string; players: MatchLineup[] }[] = [];

  for (const group of positionGroups) {
    const groupPlayers = starters.filter((p) =>
      group.positions.includes(p.position || '')
    );
    if (groupPlayers.length > 0) {
      grouped.push({ label: group.label, players: groupPlayers });
    }
  }

  // Players without matching position group
  const allGroupedIds = new Set(grouped.flatMap((g) => g.players.map((p) => p.id)));
  const ungroupedStarters = starters.filter((p) => !allGroupedIds.has(p.id));
  if (ungroupedStarters.length > 0) {
    grouped.push({ label: 'Outros', players: ungroupedStarters });
  }

  return { grouped, substitutes };
}

function PlayerRow({ player }: { player: MatchLineup }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        py: 0.75,
        px: 1,
        borderRadius: 1,
        transition: 'background-color 0.15s',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Avatar
        src={player.player_photo || ''}
        sx={{ width: 32, height: 32, bgcolor: '#e0e0e0' }}
      >
        <Person sx={{ fontSize: 18, color: '#9e9e9e' }} />
      </Avatar>
      {player.shirt_number != null && (
        <Typography
          variant="body2"
          fontWeight={800}
          sx={{
            minWidth: 24,
            textAlign: 'center',
            color: '#1a237e',
          }}
        >
          {player.shirt_number}
        </Typography>
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {player.player_name || 'Jogador'}
        </Typography>
        {player.position && (
          <Typography variant="caption" color="text.secondary">
            {player.position}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function TeamLineup({
  lineup,
  teamName,
  teamLogo,
  teamColor,
}: {
  lineup: MatchLineup[];
  teamName: string;
  teamLogo?: string | null;
  teamColor: string;
}) {
  const { grouped, substitutes } = groupPlayersByPosition(lineup);

  if (lineup.length === 0) {
    return (
      <Paper
        variant="outlined"
        sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}
      >
        <Typography color="text.secondary" variant="body2">
          Escalacao nao definida
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      {/* Team header */}
      <Box
        sx={{
          background: teamColor,
          color: 'white',
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Avatar
          src={teamLogo || ''}
          sx={{ width: 28, height: 28, bgcolor: 'rgba(255,255,255,0.2)' }}
        >
          <Groups sx={{ fontSize: 16 }} />
        </Avatar>
        <Typography variant="subtitle2" fontWeight={700}>
          {teamName}
        </Typography>
        <Chip
          label={`${lineup.filter((p) => p.is_starter).length} titulares`}
          size="small"
          sx={{
            ml: 'auto',
            bgcolor: 'rgba(255,255,255,0.2)',
            color: 'white',
            fontSize: '0.65rem',
          }}
        />
      </Box>

      {/* Starters by position group */}
      <Box sx={{ p: 1.5 }}>
        {grouped.map((group, i) => (
          <Box key={group.label} sx={{ mb: i < grouped.length - 1 ? 1 : 0 }}>
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
              sx={{ px: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}
            >
              {group.label}
            </Typography>
            {group.players.map((player) => (
              <PlayerRow key={player.id} player={player} />
            ))}
          </Box>
        ))}
      </Box>

      {/* Substitutes */}
      {substitutes.length > 0 && (
        <>
          <Divider />
          <Box sx={{ p: 1.5 }}>
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
              sx={{ px: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}
            >
              Reservas
            </Typography>
            {substitutes.map((player) => (
              <PlayerRow key={player.id} player={player} />
            ))}
          </Box>
        </>
      )}
    </Paper>
  );
}

export default function MatchLineupDisplay({
  homeLineup,
  awayLineup,
  match,
}: Props) {
  const hasLineup = homeLineup.length > 0 || awayLineup.length > 0;

  if (!hasLineup) return null;

  return (
    <Box>
      <Typography
        variant="h6"
        fontWeight={700}
        gutterBottom
        sx={{ color: '#1a237e', display: 'flex', alignItems: 'center', gap: 1 }}
      >
        <Groups fontSize="small" />
        ESCALACAO
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TeamLineup
            lineup={homeLineup}
            teamName={match.home_team_name || 'Mandante'}
            teamLogo={match.home_team_logo}
            teamColor="linear-gradient(135deg, #1a237e 0%, #283593 100%)"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TeamLineup
            lineup={awayLineup}
            teamName={match.away_team_name || 'Visitante'}
            teamLogo={match.away_team_logo}
            teamColor="linear-gradient(135deg, #b71c1c 0%, #c62828 100%)"
          />
        </Grid>
      </Grid>
    </Box>
  );
}
