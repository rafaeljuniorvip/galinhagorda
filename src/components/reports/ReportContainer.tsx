'use client';

import { useRef, useState } from 'react';
import { Box, Button, CircularProgress, Dialog, AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import { Download, Visibility, Close } from '@mui/icons-material';
import { downloadElementAsImage } from '@/lib/downloadImage';

interface ReportContainerProps {
  filename: string;
  children: React.ReactNode;
  title?: string;
  width?: number;
  bgColor?: string;
  previewScale?: number;
}

export default function ReportContainer({
  filename,
  children,
  title,
  width = 1080,
  bgColor = '#ffffff',
  previewScale = 0.45,
}: ReportContainerProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  const handleDownload = async () => {
    if (!captureRef.current) return;
    setDownloading(true);
    try {
      const el = captureRef.current;

      // Temporarily remove scale transform for accurate capture
      el.style.transform = 'none';
      el.style.marginBottom = '0px';

      // Wait for the browser to apply the style change
      await new Promise(r => setTimeout(r, 50));

      await downloadElementAsImage(el, filename, {
        backgroundColor: bgColor,
        captureWidth: width,
      });

      // Restore preview scale
      el.style.transform = `scale(${previewScale})`;
      el.style.marginBottom = '';
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
        <Button
          variant="contained"
          startIcon={downloading ? <CircularProgress size={18} color="inherit" /> : <Download />}
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? 'Gerando...' : 'Download JPG'}
        </Button>
        <Button
          variant="outlined"
          startIcon={<Visibility />}
          onClick={() => setFullscreenOpen(true)}
        >
          Visualizar
        </Button>
      </Box>
      <Box
        sx={{
          width: width * previewScale,
          height: 'auto',
          overflow: 'hidden',
          border: '1px solid #e0e0e0',
          borderRadius: 1,
        }}
      >
        <div
          ref={captureRef}
          style={{
            width,
            minWidth: width,
            transformOrigin: 'top left',
            transform: `scale(${previewScale})`,
          }}
        >
          {children}
        </div>
      </Box>

      {/* Fullscreen Dialog */}
      <Dialog
        fullScreen
        open={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
      >
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <Typography sx={{ flex: 1 }} variant="h6">
              {title || 'Relatorio'}
            </Typography>
            <Button
              color="inherit"
              startIcon={downloading ? <CircularProgress size={18} color="inherit" /> : <Download />}
              onClick={handleDownload}
              disabled={downloading}
              sx={{ mr: 1 }}
            >
              {downloading ? 'Gerando...' : 'Download JPG'}
            </Button>
            <IconButton edge="end" color="inherit" onClick={() => setFullscreenOpen(false)}>
              <Close />
            </IconButton>
          </Toolbar>
        </AppBar>
        <Box sx={{ overflow: 'auto', display: 'flex', justifyContent: 'center', bgcolor: '#f5f5f5', p: 2 }}>
          <div style={{ width, minWidth: width }}>
            {children}
          </div>
        </Box>
      </Dialog>
    </Box>
  );
}
