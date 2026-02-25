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
      await downloadElementAsImage(captureRef.current, filename, {
        backgroundColor: bgColor,
      });
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
        <Box
          ref={captureRef}
          sx={{
            width,
            transformOrigin: 'top left',
            transform: `scale(${previewScale})`,
            marginBottom: `-${100 - previewScale * 100}%`,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
