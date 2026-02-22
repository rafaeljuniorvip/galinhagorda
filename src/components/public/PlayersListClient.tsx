'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Box, TextField, Grid, Card, CardActionArea, CardContent, Avatar, Typography,
  Chip, MenuItem, Pagination,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { Player, PaginatedResponse } from '@/types';
import { POSITIONS, calculateAge } from '@/lib/utils';

export default function PlayersListClient() {
  const [data, setData] = useState<PaginatedResponse<Player> | null>(null);
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState('');
  const [page, setPage] = useState(1);

  const loadData = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: '12', active: 'true' });
    if (search) params.set('search', search);
    if (position) params.set('position', position);
    const res = await fetch(`/api/players?${params}`);
    if (res.ok) setData(await res.json());
  }, [page, search, position]);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Buscar jogador..."
          size="small"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
          sx={{ flex: 1, minWidth: 200 }}
        />
        <TextField
          select
          label="Posicao"
          size="small"
          value={position}
          onChange={(e) => { setPosition(e.target.value); setPage(1); }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">Todas</MenuItem>
          {POSITIONS.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
        </TextField>
      </Box>

      <Grid container spacing={2}>
        {data?.data.map((player) => (
          <Grid item xs={6} sm={4} md={3} key={player.id}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea component={Link} href={`/jogadores/${player.id}`} sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Avatar
                    src={player.photo_url || ''}
                    sx={{ width: 80, height: 80, mx: 'auto', mb: 1.5, fontSize: 32 }}
                  >
                    {player.name[0]}
                  </Avatar>
                  <Typography variant="subtitle1" fontWeight={700} noWrap>
                    {player.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {player.full_name}
                  </Typography>
                  <Chip label={player.position} size="small" sx={{ mt: 1 }} />
                  {player.birth_date && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      {calculateAge(player.birth_date)} anos
                    </Typography>
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {data?.data.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">Nenhum jogador encontrado</Typography>
        </Box>
      )}

      {data && data.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={data.totalPages}
            page={page}
            onChange={(_, p) => setPage(p)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
}
