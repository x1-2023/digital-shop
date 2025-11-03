'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface RequireAdminProps {
  children: React.ReactNode;
}

export function RequireAdmin({ children }: RequireAdminProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data.user && data.user.role === 'ADMIN') {
            setIsAuthorized(true);
            setIsLoading(false);
          } else {
            // Not admin, redirect to home
            router.push('/');
          }
        } else {
          // Not authenticated, redirect to signin
          router.push('/auth/signin?callbackUrl=/admin');
        }
      } catch (error) {
        console.error('Failed to check admin access:', error);
        router.push('/');
      }
    };

    checkAdminAccess();
  }, [router]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0B0B10',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#9AA0AA' }}>Loading...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
