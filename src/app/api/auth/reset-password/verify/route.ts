import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token không hợp lệ', valid: false },
        { status: 400 }
      );
    }

    // Find the reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      select: {
        id: true,
        expiresAt: true,
        used: true,
      },
    });

    // Check if token exists
    if (!resetToken) {
      return NextResponse.json(
        { error: 'Token không tồn tại', valid: false },
        { status: 404 }
      );
    }

    // Check if already used
    if (resetToken.used) {
      return NextResponse.json(
        { error: 'Token đã được sử dụng', valid: false },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { error: 'Token đã hết hạn', valid: false },
        { status: 400 }
      );
    }

    // Token is valid
    return NextResponse.json({
      valid: true,
      message: 'Token hợp lệ',
    });
  } catch (error) {
    console.error('[Reset Password Verify] Error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra', valid: false },
      { status: 500 }
    );
  }
}
