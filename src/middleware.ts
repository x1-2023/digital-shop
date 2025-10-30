import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/jwt-session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // === SETUP WIZARD PROTECTION ===
  // Check if accessing /setup route
  if (pathname.startsWith('/setup')) {
    try {
      // Check setup status
      const apiUrl = new URL('/api/setup/status', request.url);
      const response = await fetch(apiUrl.toString());

      if (response.ok) {
        const data = await response.json();

        // If setup already completed, redirect to signin
        if (data.setupCompleted) {
          return NextResponse.redirect(new URL('/auth/signin', request.url));
        }
      }

      // Allow access to /setup if not yet completed
      return NextResponse.next();
    } catch (error) {
      // On error, allow access to setup page
      return NextResponse.next();
    }
  }

  // === REDIRECT TO SETUP IF NOT COMPLETED ===
  // Skip setup redirect for these paths
  const skipSetupRedirect = [
    '/api/',
    '/_next/',
    '/setup',
    '/favicon.ico',
  ];

  const shouldSkipSetupCheck = skipSetupRedirect.some(path => pathname.startsWith(path));

  if (!shouldSkipSetupCheck) {
    try {
      const apiUrl = new URL('/api/setup/status', request.url);
      const response = await fetch(apiUrl.toString());

      if (response.ok) {
        const data = await response.json();

        // If setup not completed and database not connected, redirect to setup
        if (!data.setupCompleted && !data.adminExists) {
          return NextResponse.redirect(new URL('/setup', request.url));
        }
      }
    } catch (error) {
      // On error, continue to requested page
      console.error('Setup check error:', error);
    }
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/products', '/auth/signin', '/auth/verify-request', '/auth/error'];

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => {
    if (route.includes('[') && route.includes(']')) {
      // Handle dynamic routes like /products/[slug]
      const pattern = route.replace(/\[.*?\]/g, '[^/]+');
      return new RegExp(`^${pattern}$`).test(pathname);
    }
    return pathname === route || pathname.startsWith(route + '/');
  });

  // Admin routes - require ADMIN role
  if (pathname.startsWith('/admin')) {
    // Check session cookie
    const sessionCookie = request.cookies.get('session');

    if (!sessionCookie) {
      // No session, redirect to login
      const url = new URL('/auth/signin', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }

    // Verify JWT session token directly (no fetch needed)
    try {
      const sessionData = verifySessionToken(sessionCookie.value);

      if (!sessionData) {
        // Invalid or expired session
        const url = new URL('/auth/signin', request.url);
        url.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(url);
      }

      // Check if user is admin
      if (sessionData.role !== 'ADMIN') {
        // Not an admin, redirect to homepage
        const url = new URL('/', request.url);
        url.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(url);
      }

      // User is admin, allow access
      return NextResponse.next();
    } catch (error) {
      console.error('Middleware auth check error:', error);
      // On error, redirect to login
      const url = new URL('/auth/signin', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Protected routes (require authentication)
  const isProtectedRoute = pathname.startsWith('/account') || 
                          pathname.startsWith('/wallet') || 
                          pathname.startsWith('/orders') || 
                          pathname.startsWith('/checkout') ||
                          pathname.startsWith('/cart');

  if (isProtectedRoute) {
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) {
      // No session, redirect to login
      const url = new URL('/auth/signin', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Allow public routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
  runtime: 'nodejs', // Use Node.js runtime instead of Edge runtime
};



