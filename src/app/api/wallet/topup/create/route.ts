import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiRateLimiter } from '@/lib/rate-limit';
import { logDepositCreate } from '@/lib/system-log';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting: Prevent spam topup requests (5 requests per minute)
    const isAllowed = await apiRateLimiter.check(`topup:${session.user.id}`, 5);

    if (!isAllowed) {
      return NextResponse.json(
        {
          error: 'Quá nhiều yêu cầu nạp tiền. Vui lòng thử lại sau.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
          },
        }
      );
    }

    const body = await request.json();
    const { amountVnd, note, qrCode, transferContent } = body;

    if (!amountVnd || !qrCode || !transferContent) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    // Get topup rules from settings
    const settings = await prisma.settings.findFirst({
      select: { topupRules: true },
    });

    const topupRules = settings?.topupRules
      ? (typeof settings.topupRules === 'string'
        ? JSON.parse(settings.topupRules)
        : settings.topupRules)
      : { minVnd: 10000, maxVnd: 100000000 };

    // Validate amount against dynamic rules
    if (amountVnd < topupRules.minVnd) {
      return NextResponse.json(
        { error: `Số tiền tối thiểu là ${topupRules.minVnd.toLocaleString('vi-VN')} VND` },
        { status: 400 }
      );
    }

    if (amountVnd > topupRules.maxVnd) {
      return NextResponse.json(
        { error: `Số tiền tối đa là ${topupRules.maxVnd.toLocaleString('vi-VN')} VND` },
        { status: 400 }
      );
    }

    // Validate note length
    if (note && note.length > 500) {
      return NextResponse.json(
        { error: 'Ghi chú không được quá 500 ký tự' },
        { status: 400 }
      );
    }

    // Create deposit request
    const depositRequest = await prisma.manualDepositRequest.create({
      data: {
        userId: session.user.id,
        amountVnd: amountVnd,
        note: note || '',
        qrCode,
        transferContent,
        status: 'PENDING',
      },
    });

    // Log deposit creation
    await logDepositCreate(
      session.user.id,
      session.user.email,
      amountVnd,
      depositRequest.id.toString()
    );

    return NextResponse.json({
      success: true,
      data: {
        id: depositRequest.id,
        amount: depositRequest.amountVnd,
        qrCode: depositRequest.qrCode,
        transferContent: depositRequest.transferContent,
        status: depositRequest.status,
        createdAt: depositRequest.createdAt,
      },
    });
  } catch (error) {
    console.error('Create topup request error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
