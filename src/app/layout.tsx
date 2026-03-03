import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Galinha Gorda - Gestão de Campeonatos',
    template: '%s | Galinha Gorda',
  },
  description: 'Sistema de gestão de campeonatos de futebol - Itapecerica/MG',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.variable}>
        {children}
        <Toaster position="bottom-center" richColors />
      </body>
    </html>
  );
}
