'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Popover,
  Snackbar,
  Alert,
  Tooltip,
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import XIcon from '@mui/icons-material/X';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import CloseIcon from '@mui/icons-material/Close';

interface Props {
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  championship?: string;
  matchUrl?: string;
}

export default function SocialShare({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  championship,
  matchUrl,
}: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [snackbar, setSnackbar] = useState(false);

  const open = Boolean(anchorEl);

  const scoreText = homeScore !== null && awayScore !== null
    ? `${homeScore} x ${awayScore}`
    : 'x';

  const shareText = championship
    ? `\u26BD ${homeTeam} ${scoreText} ${awayTeam} | ${championship} | galinhagorda.vip`
    : `\u26BD ${homeTeam} ${scoreText} ${awayTeam} | galinhagorda.vip`;

  const shareUrl = matchUrl || (typeof window !== 'undefined' ? window.location.href : 'https://galinhagorda.vip');

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
    setAnchorEl(null);
  };

  const handleTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
    setAnchorEl(null);
  };

  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank');
    setAnchorEl(null);
  };

  const handleInstagram = () => {
    // Instagram doesn't have a direct share URL, so we copy the text
    navigator.clipboard.writeText(shareText).then(() => {
      setSnackbar(true);
    });
    setAnchorEl(null);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`).then(() => {
      setSnackbar(true);
    });
    setAnchorEl(null);
  };

  const shareButtons = [
    {
      label: 'WhatsApp',
      icon: <WhatsAppIcon />,
      onClick: handleWhatsApp,
      color: '#25D366',
      bgHover: 'rgba(37,211,102,0.1)',
    },
    {
      label: 'Instagram',
      icon: <InstagramIcon />,
      onClick: handleInstagram,
      color: '#E1306C',
      bgHover: 'rgba(225,48,108,0.1)',
    },
    {
      label: 'X (Twitter)',
      icon: <XIcon />,
      onClick: handleTwitter,
      color: '#000',
      bgHover: 'rgba(0,0,0,0.05)',
    },
    {
      label: 'Facebook',
      icon: <FacebookIcon />,
      onClick: handleFacebook,
      color: '#1877F2',
      bgHover: 'rgba(24,119,242,0.1)',
    },
    {
      label: 'Copiar Link',
      icon: <ContentCopyIcon />,
      onClick: handleCopyLink,
      color: '#666',
      bgHover: 'rgba(0,0,0,0.05)',
    },
  ];

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<ShareIcon />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          borderColor: 'rgba(0,0,0,0.15)',
          color: '#555',
          fontWeight: 600,
          textTransform: 'none',
          borderRadius: 2,
          '&:hover': {
            borderColor: '#1976d2',
            color: '#1976d2',
            bgcolor: 'rgba(25,118,210,0.04)',
          },
        }}
      >
        Compartilhar
      </Button>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            mt: 1,
            overflow: 'visible',
          },
        }}
      >
        <Box sx={{ p: 2, minWidth: 260 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#333' }}>
              Compartilhar
            </Typography>
            <IconButton size="small" onClick={() => setAnchorEl(null)}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          {/* Preview */}
          <Box
            sx={{
              bgcolor: '#f5f5f5',
              borderRadius: 2,
              p: 1.5,
              mb: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="caption" sx={{ color: '#555', lineHeight: 1.4, wordBreak: 'break-word' }}>
              {shareText}
            </Typography>
          </Box>

          {/* Share buttons */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {shareButtons.map((btn) => (
              <Button
                key={btn.label}
                fullWidth
                startIcon={btn.icon}
                onClick={btn.onClick}
                sx={{
                  justifyContent: 'flex-start',
                  color: btn.color,
                  textTransform: 'none',
                  fontWeight: 600,
                  py: 1,
                  borderRadius: 1.5,
                  '&:hover': {
                    bgcolor: btn.bgHover,
                  },
                }}
              >
                {btn.label}
              </Button>
            ))}
          </Box>
        </Box>
      </Popover>

      <Snackbar
        open={snackbar}
        autoHideDuration={2000}
        onClose={() => setSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(false)}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          Texto copiado! Cole no Instagram ou onde preferir.
        </Alert>
      </Snackbar>
    </>
  );
}
