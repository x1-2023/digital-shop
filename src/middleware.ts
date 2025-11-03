import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/jwt-session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // === SETUP WIZARD PROTECTION ===
  // Note: Setup status checks are handled by the pages themselves
  // to avoid Edge Runtime limitations with database access
  // Middleware only handles basic route protection

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
    const sessionCookie = request.cookies.get('session');

    if (!sessionCookie) {
      // No session cookie, redirect to login
      const url = new URL('/auth/signin', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }

    // Verify JWT and check for ADMIN role
    const token = sessionCookie.value;
    const decoded = verifySessionToken(token);

    if (!decoded) {
      // Invalid or expired token, redirect to login
      const url = new URL('/auth/signin', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }

    // Check if user has ADMIN role
    if (decoded.role !== 'ADMIN') {
      // Not an admin, redirect to home
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
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



