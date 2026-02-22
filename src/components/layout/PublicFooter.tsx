'use client';

import { Box, Typography, Container } from '@mui/material';
import { SportsSoccer } from '@mui/icons-material';

export default function PublicFooter() {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#1a237e',
        color: 'white',
        py: 3,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <SportsSoccer sx={{ color: '#ffd600' }} />
          <Typography variant="body2">
            Galinha Gorda - Gestao de Campeonatos
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1, color: 'rgba(255,255,255,0.6)' }}>
          Itapecerica - MG | {new Date().getFullYear()}
        </Typography>
      </Container>
    </Box>
  );
}
