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
  AlertCircle,
  Star,
  Image,
  Trophy,
  Search,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Danh mục', href: '/admin/categories', icon: Layers },
  { name: 'Sản phẩm', href: '/admin/products', icon: Package },
  { name: 'Đơn hàng', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Đánh giá', href: '/admin/reviews', icon: Star },
  { name: 'Báo cáo lỗi', href: '/admin/error-reports', icon: AlertCircle },
  { name: 'Mã giảm giá', href: '/admin/coupons', icon: Tag },
  { name: 'Yêu cầu nạp', href: '/admin/topups', icon: CreditCard },
  { name: 'Ví người dùng', href: '/admin/wallets', icon: Wallet },
  { name: 'Người dùng', href: '/admin/users', icon: Users },
  { name: 'Banner Slider', href: '/admin/banners', icon: Image },
  { name: 'Top Sellers', href: '/admin/featured-users', icon: Trophy },
  { name: 'Từ khóa tìm kiếm', href: '/admin/search-keywords', icon: Search },
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
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 w-64 h-full bg-card border-r border-border flex flex-col flex-shrink-0 overflow-y-auto`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border flex-shrink-0">
          <Link href="/" className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
              <span className="text-white font-bold text-xs">WM</span>
            </div>
            <span className="font-bold text-lg text-text-primary">{process.env.NEXT_PUBLIC_SITE_NAME || 'Digital Shop'} Admin</span>
          </Link>

          {/* Close button (mobile only) */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg bg-transparent border-none text-text-muted cursor-pointer flex items-center justify-center hover:bg-card-dark transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
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
                className={`flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all ${isActive
                  ? 'bg-brand text-white shadow-md shadow-brand/20'
                  : 'text-text-muted hover:bg-card-dark hover:text-text-primary'
                  }`}
              >
                <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive ? 'text-white' : 'text-text-muted group-hover:text-text-primary'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
