'use client';

import { useState } from 'react';
import {
  Box, Container, Typography, Avatar, Chip, Card, CardContent, Grid,
  MenuItem, TextField, Divider,
} from '@mui/material';
import {
  SportsSoccer, Square, Person,
  Height, FitnessCenter, LocationOn,
} from '@mui/icons-material';
import { Player, PlayerStats, PlayerRegistration } from '@/types';
import { calculateAge, formatDate } from '@/lib/utils';
import PlayerMatchHistory from './PlayerMatchHistory';

interface Props {
  player: Player;
  stats: PlayerStats[];
  registrations: PlayerRegistration[];
}

export default function PlayerBIDProfile({ player, stats, registrations }: Props) {
  const [selectedChampionship, setSelectedChampionship] = useState<string>(
    stats[0]?.championship_id || ''
  );

  const currentStats = stats.find(s => s.championship_id === selectedChampionship);
  const currentReg = registrations.find(r => r.championship_id === selectedChampionship);
  const age = player.birth_date ? calculateAge(player.birth_date) : null;

  return (
    <Box>
      {/* Header com fundo escuro */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
          color: 'white',
          py: { xs: 4, md: 6 },
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'center', md: 'flex-start' }, gap: 4 }}>
            {/* Foto */}
            <Avatar
              src={player.photo_url || ''}
              sx={{
                width: { xs: 140, md: 180 },
                height: { xs: 140, md: 180 },
                border: '4px solid #ffd600',
                fontSize: 64,
                bgcolor: '#3949ab',
              }}
            >
              {player.name[0]}
            </Avatar>

            {/* Info */}
            <Box sx={{ textAlign: { xs: 'center', md: 'left' }, flex: 1 }}>
              <Typography
                variant="h3"
                fontWeight={800}
                sx={{
                  fontSize: { xs: '2rem', md: '2.8rem' },
                  color: '#ffd600',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                {player.name}
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.85)', mb: 2 }}>
                {player.full_name}
              </Typography>

              {/* Dados rapidos */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                {currentStats && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={currentStats.team_logo || ''} sx={{ width: 28, height: 28 }}>{currentStats.team_name[0]}</Avatar>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>CLUBE ATUAL</Typography>
                      <Typography variant="body2" fontWeight={700}>{currentStats.team_name}</Typography>
                    </Box>
                  </Box>
                )}

                {player.birth_date && (
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>NASCIMENTO</Typography>
                    <Typography variant="body2" fontWeight={700}>{formatDate(player.birth_date)}</Typography>
                  </Box>
                )}

                {age && (
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>IDADE</Typography>
                    <Typography variant="body2" fontWeight={700}>{age} anos</Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>POSICAO</Typography>
                  <Typography variant="body2" fontWeight={700}>{player.position}</Typography>
                </Box>

                {currentReg?.bid_number && (
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>N BID</Typography>
                    <Typography variant="body2" fontWeight={700}>{currentReg.bid_number}</Typography>
                  </Box>
                )}

                {currentReg?.shirt_number && (
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>CAMISA</Typography>
                    <Typography variant="body2" fontWeight={700}>#{currentReg.shirt_number}</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Info adicional do jogador */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
          {player.height && (
            <Chip icon={<Height />} label={`${player.height}m`} variant="outlined" />
          )}
          {player.weight && (
            <Chip icon={<FitnessCenter />} label={`${player.weight}kg`} variant="outlined" />
          )}
          {player.dominant_foot && (
            <Chip label={`Pe ${player.dominant_foot}`} variant="outlined" />
          )}
          <Chip icon={<LocationOn />} label={`${player.city}/${player.state}`} variant="outlined" />
        </Box>

        {/* Seletor de Campeonato */}
        {stats.length > 0 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h5" fontWeight={700} sx={{ color: '#1a237e' }}>
                ESTATISTICAS
              </Typography>
              {stats.length > 1 && (
                <TextField
                  select
                  label="Campeonato"
                  size="small"
                  value={selectedChampionship}
                  onChange={(e) => setSelectedChampionship(e.target.value)}
                  sx={{ minWidth: 250 }}
                >
                  {stats.map(s => (
                    <MenuItem key={s.championship_id} value={s.championship_id}>
                      {s.championship_name} ({s.year})
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </Box>

            {/* Cards de estatisticas */}
            {currentStats && (
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ textAlign: 'center', border: '2px solid #e0e0e0' }}>
                    <CardContent sx={{ py: 3 }}>
                      <SportsSoccer sx={{ fontSize: 28, color: '#1976d2', mb: 0.5 }} />
                      <Typography variant="h3" fontWeight={800} sx={{ color: '#1a237e' }}>
                        {String(currentStats.matches_played).padStart(2, '0')}
                      </Typography>
                      <Typography variant="caption" fontWeight={600} color="text.secondary">
                        PARTIDAS
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ textAlign: 'center', border: '2px solid #e0e0e0' }}>
                    <CardContent sx={{ py: 3 }}>
                      <Box sx={{ width: 28, height: 28, mx: 'auto', mb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <SportsSoccer sx={{ fontSize: 28, color: '#2e7d32' }} />
                      </Box>
                      <Typography variant="h3" fontWeight={800} sx={{ color: '#1a237e' }}>
                        {String(currentStats.goals).padStart(2, '0')}
                      </Typography>
                      <Typography variant="caption" fontWeight={600} color="text.secondary">
                        GOL
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ textAlign: 'center', border: '2px solid #e0e0e0' }}>
                    <CardContent sx={{ py: 3 }}>
                      <Square sx={{ fontSize: 28, color: '#ffd600', mb: 0.5 }} />
                      <Typography variant="h3" fontWeight={800} sx={{ color: '#1a237e' }}>
                        {String(currentStats.yellow_cards).padStart(2, '0')}
                      </Typography>
                      <Typography variant="caption" fontWeight={600} color="text.secondary">
                        AMARELO
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ textAlign: 'center', border: '2px solid #e0e0e0' }}>
                    <CardContent sx={{ py: 3 }}>
                      <Square sx={{ fontSize: 28, color: '#d32f2f', mb: 0.5 }} />
                      <Typography variant="h3" fontWeight={800} sx={{ color: '#1a237e' }}>
                        {String(currentStats.red_cards).padStart(2, '0')}
                      </Typography>
                      <Typography variant="caption" fontWeight={600} color="text.secondary">
                        VERMELHO
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* Historico de partidas */}
            {selectedChampionship && (
              <PlayerMatchHistory playerId={player.id} championshipId={selectedChampionship} />
            )}
          </>
        )}

        {stats.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Person sx={{ fontSize: 64, color: '#ccc' }} />
            <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
              Este jogador ainda nao possui inscricoes em campeonatos
            </Typography>
          </Box>
        )}

        {/* Historico de inscricoes */}
        {registrations.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: '#1a237e' }}>
              HISTORICO DE INSCRICOES
            </Typography>
            <Grid container spacing={2}>
              {registrations.map((r) => (
                <Grid item xs={12} sm={6} md={4} key={r.id}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar src={r.team_logo || ''} sx={{ width: 40, height: 40 }}>{r.team_name?.[0]}</Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600}>{r.team_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{r.championship_name}</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        {r.shirt_number && <Chip label={`#${r.shirt_number}`} size="small" />}
                        <Typography variant="caption" display="block" color="text.secondary">{r.bid_number}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  );
}
