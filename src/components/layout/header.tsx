'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Wallet, ShoppingCart, User, LogIn, LogOut, ChevronDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { useCart } from '@/hooks/use-cart';

interface SessionUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'BUYER';
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function Header() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProductMenu, setShowProductMenu] = useState(false);
  const [showToolMenu, setShowToolMenu] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const router = useRouter();
  const { getItemCount } = useCart();
  const cartCount = getItemCount();
  
  const productMenuRef = useRef<HTMLDivElement>(null);
  const toolMenuRef = useRef<HTMLDivElement>(null);

  const telegramUrl = process.env.NEXT_PUBLIC_TELEGRAM_URL || 'https://t.me/webmmo';

  // Fetch session
  useEffect(() => {
    fetchSession();
    fetchCategories();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productMenuRef.current && !productMenuRef.current.contains(event.target as Node)) {
        setShowProductMenu(false);
      }
      if (toolMenuRef.current && !toolMenuRef.current.contains(event.target as Node)) {
        setShowToolMenu(false);
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
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  // Fetch wallet balance
  useEffect(() => {
    if (user && user.id) {
      let isMounted = true;
      
      fetch('/api/wallet/balance')
        .then(res => {
          if (!isMounted) return null;
          if (!res.ok) {
            setWalletBalance(0);
            return null;
          }
          return res.json();
        })
        .then(data => {
          if (isMounted && data && data.balance !== undefined) {
            setWalletBalance(data.balance);
          }
        })
        .catch(() => {
          if (isMounted) setWalletBalance(0);
        });

      return () => {
        isMounted = false;
      };
    } else {
      setWalletBalance(null);
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
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <div className="h-7 w-7 rounded-lg bg-brand flex items-center justify-center">
              <span className="text-white font-bold text-sm">WM</span>
            </div>
            <span className="font-bold text-lg text-text-primary hidden sm:inline">WebMMO</span>
          </Link>

          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-1 flex-1 mx-6">
            {/* Sản phẩm Dropdown */}
            <div className="relative" ref={productMenuRef}>
              <button
                onClick={() => {
                  setShowProductMenu(!showProductMenu);
                  setShowToolMenu(false);
                }}
                className="px-4 py-2 text-text-muted hover:text-text-primary hover:bg-card-dark rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
              >
                Sản phẩm
                <ChevronDown className={`h-3 w-3 transition-transform ${showProductMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {showProductMenu && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-xl py-2 z-50">
                  {categories.slice(0, 4).map((category) => (
                    <Link
                      key={category.id}
                      href={`/products?categoryId=${category.id}`}
                      onClick={() => setShowProductMenu(false)}
                      className="block px-4 py-2 text-sm text-text-muted hover:text-text-primary hover:bg-card-dark transition-colors"
                    >
                      {category.name}
                    </Link>
                  ))}
                  <Link
                    href="/products"
                    onClick={() => setShowProductMenu(false)}
                    className="block px-4 py-2 text-sm text-brand hover:bg-card-dark transition-colors border-t border-border mt-1 pt-2"
                  >
                    Xem tất cả →
                  </Link>
                </div>
              )}
            </div>

            {/* Hỗ trợ - Telegram */}
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-text-muted hover:text-text-primary hover:bg-card-dark rounded-lg transition-colors text-sm font-medium"
            >
              Hỗ trợ
            </a>

            {/* Công cụ Dropdown */}
            <div className="relative" ref={toolMenuRef}>
              <button
                onClick={() => {
                  setShowToolMenu(!showToolMenu);
                  setShowProductMenu(false);
                }}
                className="px-4 py-2 text-text-muted hover:text-text-primary hover:bg-card-dark rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
              >
                Công cụ
                <ChevronDown className={`h-3 w-3 transition-transform ${showToolMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {showToolMenu && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-xl py-2 z-50">
                  <Link
                    href="/authenticator"
                    onClick={() => setShowToolMenu(false)}
                    className="block px-4 py-2 text-sm text-text-muted hover:text-text-primary hover:bg-card-dark transition-colors"
                  >
                    2FA Authenticator
                  </Link>
                  {/* More tools can be added here */}
                </div>
              )}
            </div>

            {/* Nạp tiền */}
            <Link href="/wallet" className="px-4 py-2 text-text-muted hover:text-text-primary hover:bg-card-dark rounded-lg transition-colors text-sm font-medium">
              Nạp tiền
            </Link>
          </nav>

          {/* Search Bar */}
          <div className="flex-1 max-w-xs mx-4 hidden lg:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="w-full px-4 py-1.5 pl-10 rounded-full bg-card-dark border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-colors text-sm"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            {loading ? (
              <div className="animate-pulse bg-card-dark h-8 w-16 rounded"></div>
            ) : user ? (
              <>
                {/* Wallet Balance */}
                <Link href="/wallet">
                  <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/30 hover:bg-brand/20 transition-colors cursor-pointer">
                    <Wallet className="h-4 w-4 text-brand" />
                    <span className="text-sm font-medium text-brand hidden sm:inline">
                      {walletBalance !== null ? formatCurrency(walletBalance) : '...'}
                    </span>
                  </div>
                </Link>

                {/* Cart */}
                <Link href="/cart">
                  <button className="relative inline-flex items-center justify-center h-9 w-9 rounded-full bg-card-dark border border-border hover:bg-background transition-colors">
                    <ShoppingCart className="h-4 w-4 text-text-primary" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-[10px] bg-red-500 text-white rounded-full font-bold">
                        {cartCount}
                      </span>
                    )}
                  </button>
                </Link>

                {/* User Menu */}
                <Link href="/account">
                  <button className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-card-dark border border-border hover:bg-background transition-colors">
                    <User className="h-4 w-4 text-text-primary" />
                  </button>
                </Link>
                
                {user.role === 'ADMIN' && (
                  <Link href="/admin">
                    <button className="inline-flex items-center justify-center h-8 px-3 rounded-full text-xs font-medium bg-brand text-white hover:bg-brand/90 transition-colors hidden sm:inline-flex">
                      Admin
                    </button>
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center h-8 px-3 rounded-full text-xs font-medium bg-card-dark text-text-muted hover:bg-background hover:text-text-primary transition-colors hidden sm:inline-flex"
                >
                  <LogOut className="h-3 w-3 mr-1" />
                  Đăng xuất
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/signup">
                  <button className="inline-flex items-center justify-center h-8 px-4 rounded-full text-sm font-medium border border-border bg-transparent hover:bg-card hover:text-text-primary transition-colors hidden sm:inline-flex">
                    Đăng ký
                  </button>
                </Link>
                <Link href="/auth/signin">
                  <button className="inline-flex items-center justify-center h-8 px-4 rounded-full text-sm font-medium bg-brand text-white hover:bg-brand/90 transition-colors">
                    <LogIn className="h-4 w-4 mr-1.5" />
                    <span>Đăng nhập</span>
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
