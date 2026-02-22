import { Box } from '@mui/material';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import { UserProvider } from '@/contexts/UserContext';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <PublicHeader />
        <Box component="main" sx={{ flex: 1 }}>
          {children}
        </Box>
        <PublicFooter />
      </Box>
    </UserProvider>
  );
}
