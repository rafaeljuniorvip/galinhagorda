'use client';

import { useState, ReactNode } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, useMediaQuery, useTheme, Box } from '@mui/material';
import { MoreVert } from '@mui/icons-material';
import Link from 'next/link';

interface ActionItem {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  href?: string;
  color?: 'inherit' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'default';
  disabled?: boolean;
}

interface MobileActionsMenuProps {
  actions: ActionItem[];
}

export default function MobileActionsMenu({ actions }: MobileActionsMenuProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  if (!isMobile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        {actions.map((action, i) =>
          action.href ? (
            <IconButton
              key={i}
              component={Link}
              href={action.href}
              size="small"
              color={action.color as any || 'default'}
              title={action.label}
              disabled={action.disabled}
            >
              {action.icon}
            </IconButton>
          ) : (
            <IconButton
              key={i}
              size="small"
              color={action.color as any || 'default'}
              onClick={action.onClick}
              title={action.label}
              disabled={action.disabled}
            >
              {action.icon}
            </IconButton>
          )
        )}
      </Box>
    );
  }

  return (
    <>
      <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
        <MoreVert fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {actions.map((action, i) => (
          <MenuItem
            key={i}
            onClick={() => {
              setAnchorEl(null);
              if (action.onClick) action.onClick();
            }}
            component={action.href ? Link : 'li'}
            href={action.href || undefined}
            disabled={action.disabled}
            sx={{ minHeight: 44, color: action.color === 'error' ? 'error.main' : undefined }}
          >
            <ListItemIcon sx={{ color: action.color === 'error' ? 'error.main' : action.color === 'primary' ? 'primary.main' : undefined }}>
              {action.icon}
            </ListItemIcon>
            <ListItemText>{action.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
