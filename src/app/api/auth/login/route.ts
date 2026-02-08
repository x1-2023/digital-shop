import { NextRequest, NextResponse } from 'next/server';
import { verifyCredentials } from '@/lib/auth';
import { createSessionToken } from '@/lib/jwt-session';
import { cookies } from 'next/headers';
import { apiRateLimiter } from '@/lib/rate-limit';
import { LoginSchema } from '@/lib/validators/auth';
import { logUserLogin, logAdminLogin } from '@/lib/system-log';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: Prevent brute force login attempts
    // Use IP as key
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    // Limit: 5 attempts per minute per IP
    const isAllowed = await apiRateLimiter.check(`login:${ip}`, 5);

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 1 phút.' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Zod Validation
    const validation = LoginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    const user = await verifyCredentials(email, password);

    if (!user) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    // Log login attempt
    const clientIp = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    if (user.role === 'ADMIN' || user.role === 'OWNER') {
      await logAdminLogin(user.id, user.email, clientIp);
    } else {
      await logUserLogin(user.id, user.email, clientIp);
    }

    // Create JWT session token (SSO-compatible)
    const token = createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      aud: ['shop', 'mail'],
      token_version: user.tokenVersion,
    });

    // Set secure cookie with JWT
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({
      success: true,
      token, // SSO: expose token for cross-service auth (Mail can use this)
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra' },
      { status: 500 }
    );
  }
}

