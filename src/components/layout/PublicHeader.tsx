'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  AppBar, Toolbar, Typography, Button, Box, IconButton, Drawer,
  List, ListItem, ListItemButton, ListItemText, useMediaQuery, useTheme,
  Avatar, Menu, MenuItem, ListItemIcon, Divider,
} from '@mui/material';
import {
  Menu as MenuIcon, Close, SportsSoccer, Login, Person,
  Notifications, Logout,
} from '@mui/icons-material';

const navItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Jogadores', href: '/jogadores' },
  { label: 'Times', href: '/times' },
  { label: 'Campeonatos', href: '/campeonatos' },
  { label: 'Noticias', href: '/noticias' },
];

export default function PublicHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const userName = session?.user?.name || '';
  const userAvatar = (session?.user as any)?.avatar_url || session?.user?.image || '';

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await signOut({ callbackUrl: '/' });
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: '#1a237e',
          borderBottom: '3px solid #ffd600',
        }}
      >
        <Toolbar sx={{ maxWidth: 1200, width: '100%', mx: 'auto' }}>
          <Box
            component={Link}
            href="/"
            sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: 'white', mr: 4 }}
          >
            <SportsSoccer sx={{ fontSize: 32, color: '#ffd600' }} />
            <Box>
              <Typography variant="h6" fontWeight={800} lineHeight={1} sx={{ fontSize: { xs: '1rem', md: '1.2rem' } }}>
                GALINHA GORDA
              </Typography>
              <Typography variant="caption" sx={{ color: '#ffd600', fontSize: '0.65rem' }}>
                ITAPECERICA - MG
              </Typography>
            </Box>
          </Box>

          {!isMobile ? (
            <>
              <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                {navItems.map((item) => (
                  <Button
                    key={item.href}
                    component={Link}
                    href={item.href}
                    sx={{
                      color: isActive(item.href) ? '#ffd600' : 'white',
                      fontWeight: isActive(item.href) ? 700 : 500,
                      borderBottom: isActive(item.href) ? '2px solid #ffd600' : '2px solid transparent',
                      borderRadius: 0,
                      '&:hover': { color: '#ffd600' },
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Box>

              {/* User area - desktop */}
              <Box sx={{ ml: 2 }}>
                {isAuthenticated ? (
                  <IconButton onClick={handleMenuOpen} sx={{ p: 0.5 }}>
                    <Avatar
                      src={userAvatar}
                      sx={{
                        width: 36,
                        height: 36,
                        border: '2px solid #ffd600',
                        fontSize: '0.9rem',
                      }}
                    >
                      {userName?.charAt(0)?.toUpperCase()}
                    </Avatar>
                  </IconButton>
                ) : (
                  <Button
                    component={Link}
                    href="/login"
                    startIcon={<Login />}
                    sx={{
                      color: '#1a237e',
                      backgroundColor: '#ffd600',
                      fontWeight: 600,
                      textTransform: 'none',
                      px: 2,
                      '&:hover': {
                        backgroundColor: '#ffea00',
                      },
                    }}
                  >
                    Entrar
                  </Button>
                )}
              </Box>
            </>
          ) : (
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
              {isAuthenticated && (
                <IconButton onClick={handleMenuOpen} sx={{ p: 0.5 }}>
                  <Avatar
                    src={userAvatar}
                    sx={{
                      width: 32,
                      height: 32,
                      border: '2px solid #ffd600',
                      fontSize: '0.8rem',
                    }}
                  >
                    {userName?.charAt(0)?.toUpperCase()}
                  </Avatar>
                </IconButton>
              )}
              <IconButton
                sx={{ color: 'white' }}
                onClick={() => setDrawerOpen(true)}
              >
                <MenuIcon />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* User dropdown menu (shared for desktop and mobile) */}
      {isAuthenticated && (
        <Menu
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 200,
              '& .MuiMenuItem-root': { fontSize: '0.9rem' },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="body2" fontWeight={600}>{userName}</Typography>
            <Typography variant="caption" color="text.secondary">
              {session?.user?.email}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => router.push('/meu-perfil')}>
            <ListItemIcon><Person fontSize="small" /></ListItemIcon>
            Meu Perfil
          </MenuItem>
          <MenuItem onClick={() => router.push('/meu-perfil')}>
            <ListItemIcon><Notifications fontSize="small" /></ListItemIcon>
            Notificacoes
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
            Sair
          </MenuItem>
        </Menu>
      )}

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 260, p: 2 }}>
          <IconButton onClick={() => setDrawerOpen(false)} sx={{ mb: 1 }}>
            <Close />
          </IconButton>
          <List>
            {navItems.map((item) => (
              <ListItem key={item.href} disablePadding>
                <ListItemButton
                  component={Link}
                  href={item.href}
                  onClick={() => setDrawerOpen(false)}
                  selected={isActive(item.href)}
                >
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
            {!isAuthenticated && (
              <>
                <Divider sx={{ my: 1 }} />
                <ListItem disablePadding>
                  <ListItemButton
                    component={Link}
                    href="/login"
                    onClick={() => setDrawerOpen(false)}
                    sx={{ color: '#1a237e', fontWeight: 600 }}
                  >
                    <ListItemIcon><Login sx={{ color: '#1a237e' }} /></ListItemIcon>
                    <ListItemText primary="Entrar" />
                  </ListItemButton>
                </ListItem>
              </>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
