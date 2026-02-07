import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { customAlphabet } from 'nanoid';
import { createSessionToken } from '@/lib/jwt-session';
import { apiRateLimiter } from '@/lib/rate-limit';
import { RegisterSchema } from '@/lib/validators/auth';
import { logUserRegister } from '@/lib/system-log';

// Generate 8-character alphanumeric ID (lowercase)
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: Prevent spam signups
    // Use IP as key
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const isAllowed = await apiRateLimiter.check(`signup:${ip}`, 3); // Stricter limit for signup

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Quá nhiều lần đăng ký. Vui lòng thử lại sau 1 phút.' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate input with centralized schema
    const validationResult = RegisterSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', errors },
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

    // Log user registration
    const clientIp = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    await logUserRegister(user.id, user.email, clientIp);

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
