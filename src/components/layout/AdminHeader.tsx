'use client';

import { AppBar, Toolbar, Button, Box, Chip, Avatar, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { Logout } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleLogout = async () => {
    await logout();
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e0e0e0',
        color: '#333',
      }}
    >
      <Toolbar sx={{ justifyContent: 'flex-end', gap: isMobile ? 1 : 2, pl: isMobile ? 6 : undefined }}>
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              avatar={
                user.avatar_url
                  ? <Avatar src={user.avatar_url} alt={user.name} />
                  : undefined
              }
              label={isMobile ? undefined : user.name}
              variant="outlined"
              size="small"
            />
            {isMobile ? (
              <IconButton onClick={handleLogout} size="small" color="inherit">
                <Logout fontSize="small" />
              </IconButton>
            ) : (
              <Button
                startIcon={<Logout />}
                onClick={handleLogout}
                size="small"
                color="inherit"
              >
                Sair
              </Button>
            )}
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
