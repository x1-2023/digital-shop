'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  CreditCard,
  Settings,
  FileText,
  Globe,
  Users,
  Wallet,
  Layers,
  Tag,
  Shield,
  MonitorPlay,
  Gift,
  X,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Danh mục', href: '/admin/categories', icon: Layers },
  { name: 'Sản phẩm', href: '/admin/products', icon: Package },
  { name: 'Đơn hàng', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Mã giảm giá', href: '/admin/coupons', icon: Tag },
  { name: 'Yêu cầu nạp', href: '/admin/topups', icon: CreditCard },
  { name: 'Ví người dùng', href: '/admin/wallets', icon: Wallet },
  { name: 'Người dùng', href: '/admin/users', icon: Users },
  { name: 'Quảng cáo', href: '/admin/advertisements', icon: MonitorPlay },
  { name: 'Thưởng nạp tiền', href: '/admin/deposit-bonus', icon: Gift },
  { name: 'Giới thiệu', href: '/admin/referrals', icon: Users },
  { name: 'Nhật ký', href: '/admin/logs', icon: FileText },
  { name: 'Rate Limits', href: '/admin/rate-limits', icon: Shield },
  { name: 'Website Settings', href: '/admin/website-settings', icon: Globe },
  { name: 'Cài đặt', href: '/admin/settings', icon: Settings },
];

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ isOpen = true, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
        style={{
          width: '256px',
          height: '100%',
          backgroundColor: '#111318',
          borderRight: '1px solid #22252E',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '24px',
          paddingRight: '24px',
          borderBottom: '1px solid #22252E',
          flexShrink: 0
        }}>
          <Link href="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            cursor: 'pointer'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#8B5CF6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '12px' }}>WM</span>
            </div>
            <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#E6E8EC' }}>WebMMO Admin</span>
          </Link>

          {/* Close button (mobile only) */}
          <button
            onClick={onClose}
            className="lg:hidden"
            style={{
              padding: '8px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#9AA0AA',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Navigation */}
        <nav style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          padding: '16px',
          overflowY: 'auto'
        }}>
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  // Close sidebar on mobile when clicking a link
                  if (window.innerWidth < 1024 && onClose) {
                    onClose();
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderRadius: '12px',
                  transition: 'all 0.2s',
                  textDecoration: 'none',
                  backgroundColor: isActive ? '#8B5CF6' : 'transparent',
                  color: isActive ? 'white' : '#9AA0AA'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#1A1D26';
                    e.currentTarget.style.color = '#E6E8EC';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#9AA0AA';
                  }
                }}
              >
                <Icon style={{ width: '20px', height: '20px', marginRight: '12px', flexShrink: 0 }} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
