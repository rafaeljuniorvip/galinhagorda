'use client';

import { useRef, useState } from 'react';
import { Box, Button, CircularProgress } from '@mui/material';
import { Download } from '@mui/icons-material';
import { downloadElementAsImage } from '@/lib/downloadImage';

interface ReportContainerProps {
  filename: string;
  children: React.ReactNode;
  width?: number;
  bgColor?: string;
  previewScale?: number;
}

export default function ReportContainer({
  filename,
  children,
  width = 1080,
  bgColor = '#ffffff',
  previewScale = 0.45,
}: ReportContainerProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

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
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={downloading ? <CircularProgress size={18} color="inherit" /> : <Download />}
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? 'Gerando...' : 'Download JPG'}
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
    </Box>
  );
}
