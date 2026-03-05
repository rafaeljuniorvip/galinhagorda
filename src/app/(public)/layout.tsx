import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import SponsorsBar from '@/components/public/SponsorsBar';
import { UserProvider } from '@/contexts/UserContext';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <div className="flex flex-col min-h-screen">
        <PublicHeader />
        <main className="flex-1">
          {children}
        </main>
        <SponsorsBar />
        <PublicFooter />
      </div>
    </UserProvider>
  );
}
