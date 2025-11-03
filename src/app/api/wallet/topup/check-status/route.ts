import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getRateLimitConfig } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting: Prevent spam check requests (more lenient than creating requests)
    const rateLimit = checkRateLimit(
      `check-status-${session.user.id}`,
      { limit: 10, window: 60 * 1000 } // 10 requests per minute
    );

    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: 'Vui lòng chờ một chút trước khi kiểm tra lại.',
          retryAfter,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { depositRequestId } = body;

    if (!depositRequestId) {
      return NextResponse.json(
        { error: 'Thiếu ID yêu cầu nạp' },
        { status: 400 }
      );
    }

    // Get deposit request
    const depositRequest = await prisma.manualDepositRequest.findUnique({
      where: {
        id: depositRequestId,
        userId: session.user.id, // Security: only check own requests
      },
    });

    if (!depositRequest) {
      return NextResponse.json(
        { error: 'Không tìm thấy yêu cầu nạp' },
        { status: 404 }
      );
    }

    // If already processed, return current status
    if (depositRequest.status !== 'PENDING') {
      const wallet = await prisma.wallet.findUnique({
        where: { userId: session.user.id },
        select: { balanceVnd: true },
      });

      return NextResponse.json({
        status: depositRequest.status,
        message:
          depositRequest.status === 'APPROVED'
            ? 'Nạp tiền thành công!'
            : 'Yêu cầu đã được xử lý',
        balance: wallet?.balanceVnd || 0,
        adminNote: depositRequest.adminNote,
      });
    }

    // Trigger auto-topup check (only if auto-topup is enabled)
    const settings = await prisma.websiteSettings.findFirst({
      where: { key: 'bank_configs' },
    });

    if (settings?.value) {
      try {
        const configs = JSON.parse(settings.value);
        const hasEnabledBank = Array.isArray(configs) && configs.some((c: any) => c.enabled);

        if (hasEnabledBank) {
          // Trigger auto-topup check in background
          const { processAllBanks } = await import('@/lib/auto-topup');

          // Don't await - run in background
          processAllBanks().catch((error) => {
            console.error('[Check Status] Auto-topup error:', error);
          });

          // Wait a bit for processing
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Re-check deposit request status
          const updatedRequest = await prisma.manualDepositRequest.findUnique({
            where: { id: depositRequestId },
          });

          if (updatedRequest && updatedRequest.status === 'APPROVED') {
            const wallet = await prisma.wallet.findUnique({
              where: { userId: session.user.id },
              select: { balanceVnd: true },
            });

            return NextResponse.json({
              status: 'APPROVED',
              message: 'Nạp tiền thành công!',
              balance: wallet?.balanceVnd || 0,
              adminNote: updatedRequest.adminNote,
            });
          }
        }
      } catch (error) {
        console.error('[Check Status] Error triggering auto-topup:', error);
      }
    }

    // Still pending
    return NextResponse.json({
      status: 'PENDING',
      message: 'Đang chờ xác nhận từ ngân hàng. Vui lòng đợi trong giây lát...',
    });
  } catch (error) {
    console.error('Check status error:', error);
    return NextResponse.json(
      { error: 'Lỗi khi kiểm tra trạng thái' },
      { status: 500 }
    );
  }
}
