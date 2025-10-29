'use client';

import { useEffect, useState } from 'react';
import { Header } from './header';
import { AdminHeader } from './admin-header';
import { Footer } from './footer';
import { AdminSidebar } from './admin-sidebar';
import { Toaster } from '@/components/ui/toaster';
import { useHeartbeat } from '@/hooks/use-heartbeat';

interface SessionUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'BUYER';
}

interface AppShellProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

export function AppShell({ children, isAdmin = false }: AppShellProps) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Track online users with heartbeat
  useHeartbeat();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        setUser(data.user || null);
      } catch (error) {
        console.error('Failed to fetch session:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, []);

  if (loading) {
    return <div style={{ minHeight: '100vh', backgroundColor: '#0B0B10' }} />;
  }

  if (isAdmin && user?.role === 'ADMIN') {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        backgroundColor: '#0B0B10'
      }}>
        <AdminSidebar />
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <AdminHeader />
          <main style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden'
          }}>
            {children}
          </main>
        </div>
        <Toaster />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0B0B10',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Header />
      <main style={{ flex: 1 }}>
        {children}
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}



