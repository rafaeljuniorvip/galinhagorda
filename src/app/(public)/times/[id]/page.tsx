import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTeamById } from '@/services/teamService';
import { getMany } from '@/lib/db';
import {
  Container, Typography, Box, Avatar, Card, CardContent, Grid, Chip, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import Link from 'next/link';

interface Props { params: { id: string }; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const team = await getTeamById(params.id);
  if (!team) return { title: 'Time nao encontrado' };
  return { title: team.name };
}

export default async function TeamDetailPage({ params }: Props) {
  const team = await getTeamById(params.id);
  if (!team) notFound();

  // Get players registered for this team across championships
  const players = await getMany(
    `SELECT DISTINCT p.id, p.name, p.position, p.photo_url, pr.shirt_number, pr.bid_number, c.name AS championship_name
     FROM player_registrations pr
     JOIN players p ON p.id = pr.player_id
     JOIN championships c ON c.id = pr.championship_id
     WHERE pr.team_id = $1 AND pr.status = 'Ativo'
     ORDER BY p.name`,
    [params.id]
  );

  return (
    <Box>
      <Box sx={{ background: `linear-gradient(135deg, ${team.primary_color || '#1a237e'} 0%, #283593 100%)`, color: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexDirection: { xs: 'column', md: 'row' }, textAlign: { xs: 'center', md: 'left' } }}>
            <Avatar src={team.logo_url || ''} sx={{ width: 120, height: 120, border: '4px solid white', bgcolor: 'rgba(255,255,255,0.2)', fontSize: 48 }}>
              {team.short_name?.[0] || team.name[0]}
            </Avatar>
            <Box>
              <Typography variant="h3" fontWeight={800}>{team.name}</Typography>
              {team.short_name && <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)' }}>{team.short_name}</Typography>}
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>
                {team.city}/{team.state} {team.founded_year ? `| Fundado em ${team.founded_year}` : ''}
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>Elenco</Typography>
        {players.length > 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Jogador</TableCell>
                  <TableCell>Posicao</TableCell>
                  <TableCell>N</TableCell>
                  <TableCell>BID</TableCell>
                  <TableCell>Campeonato</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {players.map((p: any, i: number) => (
                  <TableRow key={`${p.id}-${i}`} hover component={Link} href={`/jogadores/${p.id}`} sx={{ textDecoration: 'none', cursor: 'pointer' }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar src={p.photo_url || ''} sx={{ width: 32, height: 32 }}>{p.name[0]}</Avatar>
                        <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Chip label={p.position} size="small" /></TableCell>
                    <TableCell>{p.shirt_number || '-'}</TableCell>
                    <TableCell>{p.bid_number || '-'}</TableCell>
                    <TableCell><Typography variant="caption">{p.championship_name}</Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography color="text.secondary">Nenhum jogador inscrito</Typography>
        )}
      </Container>
    </Box>
  );
}
