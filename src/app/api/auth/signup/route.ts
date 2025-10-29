import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { customAlphabet } from 'nanoid';
import { createSessionToken } from '@/lib/jwt-session';
import { checkRateLimit, getClientIdentifier, getRateLimitConfig } from '@/lib/rate-limit';

// Generate 8-character alphanumeric ID (lowercase)
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

const signupSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
    .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
    .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 số'),
  confirmPassword: z.string(),
  referralCode: z.string().optional(),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'Bạn phải đồng ý với điều khoản sử dụng',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: Prevent spam signups
    const identifier = getClientIdentifier(request);
    const rateLimit = checkRateLimit(identifier, getRateLimitConfig('SIGNUP'));

    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: 'Quá nhiều lần đăng ký. Vui lòng thử lại sau.',
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

    const body = await request.json();

    // Validate input
    const validationResult = signupSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(
        { error: 'Validation failed', errors },
        { status: 400 }
      );
    }

    const { email, password, referralCode } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email đã được sử dụng' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 8-character user ID
    const userId = nanoid();

    // Create user with wallet
    const user = await prisma.user.create({
      data: {
        id: userId,
        email,
        password: hashedPassword,
        role: 'BUYER', // Default role
        wallet: {
          create: {
            balanceVnd: 0,
          },
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    // Register referral if code provided (code is user ID, lowercase)
    if (referralCode && referralCode.trim()) {
      try {
        const { registerReferral } = await import('@/lib/referral');
        const registered = await registerReferral(user.id, referralCode.trim().toLowerCase());
        if (!registered) {
          console.log('[Signup] Invalid or expired referral code:', referralCode);
        }
      } catch (refError) {
        console.error('[Signup] Referral registration error:', refError);
        // Don't fail signup if referral fails
      }
    }

    // Create JWT session token
    const token = createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Set secure cookie with JWT
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({
      success: true,
      message: 'Đăng ký thành công',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi đăng ký' },
      { status: 500 }
    );
  }
}
