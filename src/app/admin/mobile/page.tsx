'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Copy, Check, QrCode as QrCodeIcon } from 'lucide-react';
import QRCode from 'qrcode';

const EXPO_URL = 'exp://galinhagorda.vip:8081';
const EXPO_HTTPS = 'http://galinhagorda.vip:8081';

export default function MobilePage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(EXPO_URL, {
      width: 280,
      margin: 2,
      color: { dark: '#1a237e', light: '#ffffff' },
    }).then(setQrDataUrl);
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyButton = ({ text, label }: { text: string; label: string }) => (
    <button
      onClick={() => copyToClipboard(text, label)}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-muted rounded hover:bg-accent transition-colors"
    >
      {copied === label ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
      {copied === label ? 'Copiado!' : 'Copiar'}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Smartphone className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">App Mobile</h1>
          <p className="text-muted-foreground text-sm">Acesso ao app de administracao via Expo Go</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* QR Code + Connection Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <QrCodeIcon className="h-5 w-5" />
              QR Code - Expo Go
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {qrDataUrl && (
              <div className="flex justify-center">
                <div className="bg-white p-3 rounded-lg shadow-sm border">
                  <img src={qrDataUrl} alt="QR Code Expo Go" className="w-[280px] h-[280px]" />
                </div>
              </div>
            )}
            <p className="text-center text-sm text-muted-foreground">
              Escaneie com o <strong>Expo Go</strong> ou com a camera do celular.
              Funciona de qualquer rede (IP publico do servidor).
            </p>

            <div className="pt-2 border-t">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">URL Expo Go</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono break-all">
                  {EXPO_URL}
                </code>
                <CopyButton text={EXPO_URL} label="expo" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">URL HTTPS</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono break-all">
                  {EXPO_HTTPS}
                </code>
                <CopyButton text={EXPO_HTTPS} label="https" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credentials */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Credenciais de Acesso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono">
                  admin@galinhagorda.vip
                </code>
                <CopyButton text="admin@galinhagorda.vip" label="email" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Senha</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono">
                  admin123
                </code>
                <CopyButton text="admin123" label="senha" />
              </div>
            </div>

            <div className="pt-2 border-t">
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                Troque a senha em producao!
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Como conectar</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-white text-xs font-bold shrink-0">1</span>
                <span>Instale o app <strong>Expo Go</strong> no celular (Play Store / App Store)</span>
              </li>
              <li className="flex gap-3">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-white text-xs font-bold shrink-0">2</span>
                <span>Abra o Expo Go e toque em <strong>&quot;Enter URL manually&quot;</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-white text-xs font-bold shrink-0">3</span>
                <span>Cole a URL: <code className="bg-muted px-1 rounded text-xs">{EXPO_URL}</code></span>
              </li>
              <li className="flex gap-3">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-white text-xs font-bold shrink-0">4</span>
                <span>Faca login com as credenciais acima</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
