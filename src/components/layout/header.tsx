'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  ShoppingCart,
  User,
  LogOut,
  Search,
  Package,
  MessageCircle,
  CreditCard,
  Wrench,
  Shield,
  TrendingUp,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModeToggle } from '@/components/ui/mode-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface SessionUser {
  id: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'USER';
}

interface Category {
  id: string;
  name: string;
  icon?: string;
}

interface SearchKeyword {
  id: string;
  keyword: string;
  subtitle: string | null;
  icon: string;
}

// Fallback suggestions (used if no keywords from admin)
const FALLBACK_SUGGESTIONS: SearchKeyword[] = [
  { id: '1', keyword: 'Netflix Premium', subtitle: 'Bán chạy nhất 7 ngày qua', icon: '🎬' },
  { id: '2', keyword: 'ChatGPT Plus', subtitle: 'Công cụ AI giá rẻ', icon: '🤖' },
  { id: '3', keyword: 'Telegram Premium', subtitle: 'Phù hợp chạy tool', icon: '📱' },
];

export function Header() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchFocused, setSearchFocused] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchKeywords, setSearchKeywords] = useState<SearchKeyword[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { getItemCount } = useCart();
  const cartCount = getItemCount();

  const telegramUrl = process.env.NEXT_PUBLIC_TELEGRAM_URL || 'https://t.me/webmmo';

  useEffect(() => {
    fetchSession();
    fetchCategories();
    fetchSearchKeywords();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch session:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories((data.categories || []).slice(0, 5)); // Get first 5 categories
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchSearchKeywords = async () => {
    try {
      const res = await fetch('/api/admin/search-keywords');
      if (res.ok) {
        const data = await res.json();
        setSearchKeywords(data);
      }
    } catch (error) {
      console.error('Failed to fetch search keywords:', error);
    }
  };

  useEffect(() => {
    if (user && user.id) {
      fetch('/api/wallet/balance')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.balance !== undefined) {
            setWalletBalance(data.balance);
          }
        })
        .catch(() => setWalletBalance(0));
    }
  }, [user?.id]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* LEFT: Logo */}
        <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
          <div className="h-9 w-9 rounded-xl bg-brand flex items-center justify-center shadow-lg shadow-brand/20">
            <span className="text-white font-bold text-lg">W</span>
          </div>
          <span className="font-bold text-xl text-foreground hidden sm:inline-block tracking-tight">
            {process.env.NEXT_PUBLIC_SITE_NAME || 'Digital Shop'}
          </span>
        </Link>

        {/* CENTER: Search Bar with Dropdown */}
        <div ref={searchRef} className="hidden md:flex flex-1 max-w-md mx-4 relative">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm sản phẩm, dịch vụ..."
              className="w-full pl-10 h-10 bg-secondary/50 border-transparent focus:bg-background focus:border-brand transition-all rounded-full"
              onFocus={() => setSearchFocused(true)}
            />
          </div>

          {/* Search Dropdown */}
          {searchFocused && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
              {/* Popular Suggestions */}
              <div className="p-3 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Gợi ý phổ biến</p>
                <div className="space-y-1">
                  {(searchKeywords.length > 0 ? searchKeywords : FALLBACK_SUGGESTIONS).map((item) => (
                    <Link
                      key={item.id}
                      href={`/products?search=${encodeURIComponent(item.keyword)}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                      onClick={() => setSearchFocused(false)}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.keyword}</p>
                        <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                      </div>
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="p-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Danh mục</p>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/products?categoryId=${cat.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                      onClick={() => setSearchFocused(false)}
                    >
                      <span className="text-lg">{cat.icon || '📦'}</span>
                      <span className="flex-1 text-sm font-medium">{cat.name}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center space-x-1 sm:space-x-2">

          {/* Tools Button */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Wrench className="h-4 w-4 mr-1.5" />
                <span className="hidden lg:inline">Tools</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push('/authenticator')}>
                <Shield className="mr-2 h-4 w-4" />
                <span>2FA Authenticator</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Actions */}
          {loading ? (
            <div className="h-9 w-20 bg-muted animate-pulse rounded-full" />
          ) : user ? (
            <>
              {/* Quick Actions (Desktop) */}
              <div className="hidden lg:flex items-center space-x-1 mr-1">
                <Link href="/orders">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <Package className="h-4 w-4 mr-1.5" />
                    Đơn hàng
                  </Button>
                </Link>
                <Link href={telegramUrl} target="_blank">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <MessageCircle className="h-4 w-4 mr-1.5" />
                    Hỗ trợ
                  </Button>
                </Link>
              </div>

              {/* Deposit Button */}
              <Link href="/wallet" className="hidden sm:block">
                <Button className="font-semibold shadow-brand/20 shadow-lg" size="sm">
                  <CreditCard className="h-4 w-4 mr-1.5" />
                  Nạp tiền
                  {walletBalance !== null && (
                    <span className="ml-2 pl-2 border-l border-brand-foreground/20">
                      {formatCurrency(walletBalance)}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Cart */}
              <Link href="/cart">
                <Button variant="outline" size="icon" className="relative rounded-full">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-[10px] bg-red-500 text-white rounded-full font-bold border-2 border-background">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarFallback className="bg-brand/10 text-brand font-bold">
                        {user.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.email.split('@')[0]}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/account')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Tài khoản</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/orders')}>
                    <Package className="mr-2 h-4 w-4" />
                    <span>Đơn hàng đã mua</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/wallet')}>
                    <Wallet className="mr-2 h-4 w-4" />
                    <span>Ví của tôi</span>
                  </DropdownMenuItem>
                  {user.role === 'ADMIN' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push('/admin')}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Trang quản trị</span>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/signup" className="hidden sm:block">
                <Button variant="ghost">Đăng ký</Button>
              </Link>
              <Link href="/auth/signin">
                <Button>Đăng nhập</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
