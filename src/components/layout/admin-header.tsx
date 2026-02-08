'use client';

import { useRouter } from 'next/navigation';
import { Wallet, LogOut, Menu } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface SessionUser {
  id: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'USER';
}

interface AdminHeaderProps {
  onMenuClick?: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
      }
    };
    fetchSession();
  }, []);

  useEffect(() => {
    if (user && user.id) {
      // Only fetch once when user is available
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
      // No user = don't fetch, set to null
      setWalletBalance(null);
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header style={{
      zIndex: 50,
      height: '64px',
      borderBottom: '1px solid #22252E',
      backgroundColor: 'rgba(11, 11, 16, 0.95)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: '24px',
      paddingRight: '24px',
      backdropFilter: 'blur(10px)',
      flexShrink: 0
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
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
          <Menu style={{ width: '24px', height: '24px' }} />
        </button>

        <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#E6E8EC' }}>
          Tổng quan quản lý
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Wallet */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          paddingLeft: '12px',
          paddingRight: '12px',
          paddingTop: '8px',
          paddingBottom: '8px',
          borderRadius: '12px',
          border: '1px solid #22252E',
          backgroundColor: '#111318'
        }}>
          <Wallet style={{ width: '16px', height: '16px', color: '#8B5CF6' }} />
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#E6E8EC' }}>
            {walletBalance !== null ? formatCurrency(walletBalance) : '...'}
          </span>
        </div>

        {/* User Info */}
        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            paddingLeft: '12px',
            paddingRight: '12px',
            paddingTop: '8px',
            paddingBottom: '8px',
            borderRadius: '12px',
            backgroundColor: '#111318'
          }}>
            <span style={{ fontSize: '14px', color: '#9AA0AA' }}>{user.email}</span>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingLeft: '12px',
            paddingRight: '12px',
            height: '36px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#9AA0AA',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1A1D26';
            e.currentTarget.style.color = '#E6E8EC';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#9AA0AA';
          }}
        >
          <LogOut style={{ width: '16px', height: '16px' }} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}
