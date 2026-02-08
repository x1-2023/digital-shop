'use client';

import { useEffect, useState } from 'react';
import { AdminHeader } from './admin-header';
import { AdminSidebar } from './admin-sidebar';
import { Toaster } from '@/components/ui/toaster';
import { useHeartbeat } from '@/hooks/use-heartbeat';
import { useRouter } from 'next/navigation';

interface SessionUser {
    id: string;
    email: string;
    role: 'OWNER' | 'ADMIN' | 'USER';
}

interface AdminLayoutProps {
    children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
    const [user, setUser] = useState<SessionUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true); // Default open on desktop
    const router = useRouter();

    // Track online users with heartbeat
    useHeartbeat();

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const res = await fetch('/api/auth/session');
                const data = await res.json();

                if (!data.user || (data.user.role !== 'ADMIN' && data.user.role !== 'OWNER')) {
                    router.push('/'); // Redirect unauthorized users
                    return;
                }

                setUser(data.user);
            } catch (error) {
                console.error('Failed to fetch session:', error);
                router.push('/');
            } finally {
                setLoading(false);
            }
        };
        fetchSession();
    }, [router]);

    // Set initial sidebar state based on screen size
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };

        // Set initial state
        handleResize();

        // Listen for resize events
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (loading) {
        return <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>;
    }

    return (
        <div className="flex h-screen bg-background">
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <AdminHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
                <main className="flex-1 overflow-y-auto overflow-x-hidden">
                    {children}
                </main>
            </div>
            <Toaster />
        </div>
    );
}
