import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';
import { checkRateLimit, getClientIdentifier, getRateLimitConfig } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email không hợp lệ' },
        { status: 400 }
      );
    }

    // Rate limiting: Prevent spam password reset requests
    const identifier = getClientIdentifier(request);
    const rateLimit = checkRateLimit(identifier, getRateLimitConfig('FORGOT_PASSWORD'));

    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.',
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

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
      },
    });

    // Always return success to prevent email enumeration
    // Even if user doesn't exist, we pretend the email was sent
    if (!user) {
      console.log(`[Forgot Password] User not found for email: ${email}`);
      return NextResponse.json({
        success: true,
        message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu.',
      });
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Delete any existing unused reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        used: false,
      },
    });

    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
        used: false,
      },
    });

    // Send email with reset link
    const emailSent = await sendPasswordResetEmail(user.email, resetToken);

    if (!emailSent) {
      console.error('[Forgot Password] Failed to send email to:', user.email);
      // In production, you might want to return an error here
      // For now, we'll still return success
    }

    console.log(`[Forgot Password] Reset token generated for user: ${user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu.',
    });
  } catch (error) {
    console.error('[Forgot Password] Error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra, vui lòng thử lại sau' },
      { status: 500 }
    );
  }
}
