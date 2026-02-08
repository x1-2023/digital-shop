import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    // Validate inputs
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token không hợp lệ' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Mật khẩu phải có ít nhất 8 ký tự' },
        { status: 400 }
      );
    }

    // Find the reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    // Check if token exists
    if (!resetToken) {
      return NextResponse.json(
        { error: 'Token không tồn tại hoặc đã hết hạn' },
        { status: 404 }
      );
    }

    // Check if already used
    if (resetToken.used) {
      return NextResponse.json(
        { error: 'Token đã được sử dụng' },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { error: 'Token đã hết hạn. Vui lòng yêu cầu link mới.' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password and mark token as used
    // SSO: Also increment tokenVersion to revoke all existing tokens
    await prisma.$transaction([
      // Update password + revoke tokens
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash: hashedPassword,
          tokenVersion: { increment: 1 },
        },
      }),
      // Mark token as used
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    console.log(`[Reset Password] Password reset successful for user: ${resetToken.user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Mật khẩu đã được đặt lại thành công',
    });
  } catch (error) {
    console.error('[Reset Password] Error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra, vui lòng thử lại sau' },
      { status: 500 }
    );
  }
}
