'use client';

import { SessionProvider } from 'next-auth/react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import AdminHeader from '@/components/layout/AdminHeader';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <div className="flex min-h-screen bg-background">
          <AdminSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <AdminHeader />
            <main className="flex-1 p-4 md:p-6 overflow-auto">
              {children}
            </main>
          </div>
        </div>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </SessionProvider>
  );
}
