'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography, Box, IconButton, useMediaQuery, useTheme, Divider,
} from '@mui/material';
import {
  Dashboard, People, Groups, EmojiEvents, SportsSoccer,
  Menu as MenuIcon, ChevronLeft, Newspaper, PhotoLibrary, HowToVote, Forum,
} from '@mui/icons-material';

const DRAWER_WIDTH = 240;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, href: '/admin' },
  { text: 'Jogadores', icon: <People />, href: '/admin/jogadores' },
  { text: 'Times', icon: <Groups />, href: '/admin/times' },
  { text: 'Campeonatos', icon: <EmojiEvents />, href: '/admin/campeonatos' },
  { text: 'Partidas', icon: <SportsSoccer />, href: '/admin/partidas' },
];

const secondaryMenuItems = [
  { text: 'Noticias', icon: <Newspaper />, href: '/admin/noticias' },
  { text: 'Fotos', icon: <PhotoLibrary />, href: '/admin/fotos' },
  { text: 'Votacoes', icon: <HowToVote />, href: '/admin/votacoes' },
  { text: 'Mensagens', icon: <Forum />, href: '/admin/mensagens' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  const drawerContent = (
    <>
      <Toolbar sx={{ justifyContent: 'space-between', px: 2 }}>
        <Typography variant="h6" fontWeight={700} sx={{ color: '#1976d2' }}>
          Galinha Gorda
        </Typography>
        {isMobile && (
          <IconButton onClick={() => setMobileOpen(false)}>
            <ChevronLeft />
          </IconButton>
        )}
      </Toolbar>
      <List sx={{ px: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              href={item.href}
              selected={isActive(item.href)}
              onClick={() => isMobile && setMobileOpen(false)}
              sx={{
                borderRadius: 1,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '& .MuiListItemIcon-root': { color: 'white' },
                  '&:hover': { backgroundColor: 'primary.dark' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ mx: 2, my: 1 }} />
      <List sx={{ px: 1 }}>
        {secondaryMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              href={item.href}
              selected={isActive(item.href)}
              onClick={() => isMobile && setMobileOpen(false)}
              sx={{
                borderRadius: 1,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '& .MuiListItemIcon-root': { color: 'white' },
                  '&:hover': { backgroundColor: 'primary.dark' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
  );

  return (
    <>
      {isMobile && (
        <IconButton
          onClick={() => setMobileOpen(true)}
          sx={{ position: 'fixed', top: 12, left: 12, zIndex: 1300, bgcolor: 'white', boxShadow: 1 }}
        >
          <MenuIcon />
        </IconButton>
      )}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
          >
            {drawerContent}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH,
                borderRight: '1px solid #e0e0e0',
                backgroundColor: '#fafafa',
              },
            }}
          >
            {drawerContent}
          </Drawer>
        )}
      </Box>
    </>
  );
}
