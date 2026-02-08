import { AdminLayout } from '@/components/layout/admin-layout';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: `${process.env.NEXT_PUBLIC_SITE_NAME || 'Digital Shop'} Admin`,
    description: 'Admin Dashboard',
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <AdminLayout>{children}</AdminLayout>;
}
