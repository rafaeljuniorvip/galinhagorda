import { Container, Typography, Box, Grid, Card, CardContent, CardActionArea, Avatar } from '@mui/material';
import type { Metadata } from 'next';
import { getAllTeams } from '@/services/teamService';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Times' };

export default async function TimesPage() {
  const teams = await getAllTeams();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>Times</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Times participantes dos campeonatos
      </Typography>

      <Grid container spacing={2}>
        {teams.map((team) => (
          <Grid item xs={6} sm={4} md={3} key={team.id}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea component={Link} href={`/times/${team.id}`} sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Avatar
                    src={team.logo_url || ''}
                    sx={{ width: 72, height: 72, mx: 'auto', mb: 1.5, bgcolor: team.primary_color || '#1976d2', fontSize: 28 }}
                  >
                    {team.short_name?.[0] || team.name[0]}
                  </Avatar>
                  <Typography variant="subtitle1" fontWeight={700} noWrap>{team.name}</Typography>
                  {team.short_name && (
                    <Typography variant="caption" color="text.secondary">{team.short_name}</Typography>
                  )}
                  <Typography variant="caption" display="block" color="text.secondary">
                    {team.city}/{team.state}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {teams.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">Nenhum time cadastrado</Typography>
        </Box>
      )}
    </Container>
  );
}
