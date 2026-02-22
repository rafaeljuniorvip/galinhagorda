import { Container, Typography, Box } from '@mui/material';
import type { Metadata } from 'next';
import PlayersListClient from '@/components/public/PlayersListClient';

export const metadata: Metadata = {
  title: 'Jogadores',
  description: 'Lista de jogadores inscritos nos campeonatos',
};

export default function JogadoresPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Jogadores
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Consulte o perfil e estatisticas dos atletas inscritos
      </Typography>
      <PlayersListClient />
    </Container>
  );
}
