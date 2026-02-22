'use client';

import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Typography,
  Chip,
} from '@mui/material';
import {
  PlayArrow,
  LiveTv,
  OndemandVideo,
  OpenInNew,
} from '@mui/icons-material';
import { StreamingLink } from '@/types';

interface Props {
  streamingLinks: StreamingLink[];
  mainStreamUrl?: string | null;
}

const platformConfig: Record<
  string,
  { color: string; gradient: string; icon: React.ReactNode; label: string }
> = {
  youtube: {
    color: '#FF0000',
    gradient: 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)',
    icon: <PlayArrow sx={{ fontSize: 36 }} />,
    label: 'YouTube',
  },
  facebook: {
    color: '#1877F2',
    gradient: 'linear-gradient(135deg, #1877F2 0%, #0D5BB5 100%)',
    icon: <LiveTv sx={{ fontSize: 36 }} />,
    label: 'Facebook',
  },
  instagram: {
    color: '#E4405F',
    gradient: 'linear-gradient(135deg, #833AB4 0%, #E4405F 50%, #FCAF45 100%)',
    icon: <OndemandVideo sx={{ fontSize: 36 }} />,
    label: 'Instagram',
  },
  twitch: {
    color: '#9146FF',
    gradient: 'linear-gradient(135deg, #9146FF 0%, #6441A5 100%)',
    icon: <LiveTv sx={{ fontSize: 36 }} />,
    label: 'Twitch',
  },
  default: {
    color: '#546e7a',
    gradient: 'linear-gradient(135deg, #546e7a 0%, #37474f 100%)',
    icon: <OndemandVideo sx={{ fontSize: 36 }} />,
    label: 'Transmissao',
  },
};

function getPlatformConfig(platform: string) {
  const key = platform.toLowerCase();
  return platformConfig[key] || platformConfig.default;
}

export default function StreamingLinksDisplay({ streamingLinks, mainStreamUrl }: Props) {
  const hasLinks = streamingLinks.length > 0 || mainStreamUrl;
  if (!hasLinks) return null;

  return (
    <Box>
      <Typography
        variant="h6"
        fontWeight={700}
        gutterBottom
        sx={{ color: '#1a237e', display: 'flex', alignItems: 'center', gap: 1 }}
      >
        <LiveTv fontSize="small" />
        TRANSMISSAO
      </Typography>

      {mainStreamUrl && (
        <Card
          sx={{
            mb: 2,
            background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
            color: 'white',
            overflow: 'hidden',
          }}
        >
          <CardActionArea
            href={mainStreamUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ p: 0 }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <LiveTv sx={{ fontSize: 40 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Transmissao Principal
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Clique para assistir
                </Typography>
              </Box>
              <OpenInNew />
            </CardContent>
          </CardActionArea>
        </Card>
      )}

      <Grid container spacing={2}>
        {streamingLinks.map((link) => {
          const config = getPlatformConfig(link.platform);
          return (
            <Grid item xs={12} sm={6} md={4} key={link.id}>
              <Card
                sx={{
                  background: config.gradient,
                  color: 'white',
                  position: 'relative',
                  overflow: 'visible',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 24px ${config.color}40`,
                  },
                }}
              >
                {link.is_live && (
                  <Chip
                    label="AO VIVO"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: -10,
                      right: 12,
                      bgcolor: '#d32f2f',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      animation: 'pulse 1.5s infinite',
                      '@keyframes pulse': {
                        '0%': { boxShadow: '0 0 0 0 rgba(211,47,47,0.6)' },
                        '70%': { boxShadow: '0 0 0 8px rgba(211,47,47,0)' },
                        '100%': { boxShadow: '0 0 0 0 rgba(211,47,47,0)' },
                      },
                      '&::before': {
                        content: '""',
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'white',
                        mr: 0.5,
                        animation: 'blink 1s infinite',
                      },
                      '@keyframes blink': {
                        '0%, 100%': { opacity: 1 },
                        '50%': { opacity: 0.3 },
                      },
                    }}
                  />
                )}
                <CardActionArea
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <CardContent
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      py: 2.5,
                    }}
                  >
                    {config.icon}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {link.label || config.label}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ opacity: 0.8, display: 'block' }}
                        noWrap
                      >
                        {link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}
                      </Typography>
                    </Box>
                    <OpenInNew sx={{ fontSize: 18, opacity: 0.7 }} />
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
