'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AppBar, Toolbar, Typography, Button, Box, IconButton, Drawer,
  List, ListItem, ListItemButton, ListItemText, useMediaQuery, useTheme,
} from '@mui/material';
import { Menu as MenuIcon, Close, SportsSoccer } from '@mui/icons-material';

const navItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Jogadores', href: '/jogadores' },
  { label: 'Times', href: '/times' },
  { label: 'Campeonatos', href: '/campeonatos' },
];

export default function PublicHeader() {
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
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
          ) : (
            <IconButton
              sx={{ ml: 'auto', color: 'white' }}
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

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
          </List>
        </Box>
      </Drawer>
    </>
  );
}
