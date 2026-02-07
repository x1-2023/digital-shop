import { AdminLayout } from '@/components/layout/admin-layout';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'WebMMO Admin',
    description: 'Admin Dashboard',
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <AdminLayout>{children}</AdminLayout>;
}
