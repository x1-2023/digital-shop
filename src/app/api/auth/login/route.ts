import { NextRequest, NextResponse } from 'next/server';
import { verifyCredentials } from '@/lib/auth';
import { createSessionToken } from '@/lib/jwt-session';
import { cookies } from 'next/headers';
import { checkRateLimit, getClientIdentifier, getRateLimitConfig } from '@/lib/rate-limit';
import { logUserLogin, logAdminLogin } from '@/lib/system-log';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: Prevent brute force login attempts
    const identifier = getClientIdentifier(request);
    const rateLimit = checkRateLimit(identifier, getRateLimitConfig('LOGIN'));

    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau.',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          },
        }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email và password là bắt buộc' },
        { status: 400 }
      );
    }

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

    if (user.role === 'ADMIN') {
      await logAdminLogin(user.id, user.email, clientIp);
    } else {
      await logUserLogin(user.id, user.email, clientIp);
    }

    // Create JWT session token (signed and tamper-proof)
    const token = createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Set secure cookie with JWT
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: true, // Always secure (even in dev, use HTTPS)
      sameSite: 'strict', // Stronger CSRF protection
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({
      success: true,
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
