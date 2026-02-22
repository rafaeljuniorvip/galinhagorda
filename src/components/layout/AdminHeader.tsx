'use client';

import { AppBar, Toolbar, Button, Box, Chip } from '@mui/material';
import { Logout, Person } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
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
      <Toolbar sx={{ justifyContent: 'flex-end', gap: 2 }}>
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={<Person />}
              label={user.name}
              variant="outlined"
              size="small"
            />
            <Button
              startIcon={<Logout />}
              onClick={handleLogout}
              size="small"
              color="inherit"
            >
              Sair
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
