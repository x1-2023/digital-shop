import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as OTPAuth from 'otpauth';

const generateCodeSchema = z.object({
  secret: z.string().min(16, 'Secret phải có ít nhất 16 ký tự'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = generateCodeSchema.parse(body);

    // Clean secret (remove spaces and convert to uppercase)
    const cleanSecret = validatedData.secret.replace(/\s/g, '').toUpperCase();

    // Generate TOTP code
    const totp = new OTPAuth.TOTP({
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: cleanSecret,
    });

    const code = totp.generate();
    const now = Math.floor(Date.now() / 1000);
    const timeRemaining = 30 - (now % 30);

    return NextResponse.json({
      success: true,
      code,
      timeRemaining,
      expiresIn: timeRemaining,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    
    console.error('Error generating code:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'Chuỗi 2FA không hợp lệ. Vui lòng kiểm tra lại.' 
      },
      { status: 400 }
    );
  }
}
