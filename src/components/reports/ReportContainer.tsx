'use client';

import { useRef, useState } from 'react';
import { Download, Eye, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { downloadElementAsImage } from '@/lib/downloadImage';
import { useIsMobile } from '@/hooks/useIsMobile';

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
  const isMobile = useIsMobile();
  const effectiveScale = isMobile ? Math.min(previewScale, 0.3) : previewScale;

  const handleDownload = async () => {
    if (!captureRef.current) return;
    setDownloading(true);
    try {
      const el = captureRef.current;
      el.style.transform = 'none';
      el.style.marginBottom = '0px';
      await new Promise(r => setTimeout(r, 50));
      await downloadElementAsImage(el, filename, { backgroundColor: bgColor, captureWidth: width });
      el.style.transform = `scale(${effectiveScale})`;
      el.style.marginBottom = '';
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <div className="mb-2 flex gap-2">
        <Button onClick={handleDownload} disabled={downloading}>
          {downloading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
          {downloading ? 'Gerando...' : 'Download JPG'}
        </Button>
        <Button variant="outline" onClick={() => setFullscreenOpen(true)}>
          <Eye className="h-4 w-4 mr-1" />Visualizar
        </Button>
      </div>
      <div
        style={{ width: width * effectiveScale, height: 'auto', overflow: 'hidden' }}
        className="border rounded"
      >
        <div
          ref={captureRef}
          style={{ width, minWidth: width, transformOrigin: 'top left', transform: `scale(${effectiveScale})` }}
        >
          {children}
        </div>
      </div>

      {/* Fullscreen Dialog */}
      <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
        <DialogContent className="max-w-[100vw] h-[100vh] w-[100vw] p-0 rounded-none border-none">
          <div className="sticky top-0 z-10 bg-primary text-primary-foreground px-4 py-3 flex items-center">
            <span className="flex-1 font-semibold">{title || 'Relatorio'}</span>
            <Button variant="ghost" size="sm" className="text-primary-foreground hover:text-primary-foreground/80" onClick={handleDownload} disabled={downloading}>
              {downloading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
              {downloading ? 'Gerando...' : 'Download JPG'}
            </Button>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:text-primary-foreground/80 ml-1" onClick={() => setFullscreenOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="overflow-auto flex justify-center bg-muted p-4" style={{ height: 'calc(100vh - 56px)' }}>
            <div style={{ width, minWidth: width }}>
              {children}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
