import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { logActivity, getRequestInfo } from '@/lib/user-activity';

const adjustWalletSchema = z.object({
  userId: z.string().min(1, 'User ID không được để trống'),
  amount: z.number().min(1, 'Số tiền phải lớn hơn 0'),
  type: z.enum(['add', 'subtract']),
  reason: z.string().min(1, 'Lý do không được để trống'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user || ((session.(user.role !== 'ADMIN' && user.role !== 'OWNER') && session.user.role !== 'OWNER') && session.user.role !== 'OWNER')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = adjustWalletSchema.parse(body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId },
      include: { wallet: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Người dùng không tồn tại' },
        { status: 404 }
      );
    }

    if (!user.wallet) {
      return NextResponse.json(
        { error: 'Ví người dùng không tồn tại' },
        { status: 404 }
      );
    }

    // Calculate new balance
    const currentBalance = user.wallet.balanceVnd;
    const adjustmentAmount = validatedData.type === 'add' 
      ? validatedData.amount 
      : -validatedData.amount;
    const newBalance = currentBalance + adjustmentAmount;

    // Check if balance would go negative
    if (newBalance < 0) {
      return NextResponse.json(
        { error: 'Số dư không thể âm' },
        { status: 400 }
      );
    }

    // Use transaction to update wallet and create logs
    const updatedWallet = await prisma.$transaction(async (tx) => {
      // Update wallet balance
      const wallet = await tx.wallet.update({
        where: { userId: validatedData.userId },
        data: {
          balanceVnd: newBalance,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      });

      // Create wallet transaction log
      await tx.walletTransaction.create({
        data: {
          userId: validatedData.userId,
          type: 'ADMIN_ADJUST',
          amountVnd: adjustmentAmount,
          balanceAfterVnd: newBalance,
          description: `Admin adjustment: ${validatedData.reason}`,
          metadata: JSON.stringify({
            adminId: session.user.id,
            adjustmentType: validatedData.type,
            oldBalance: currentBalance,
            newBalance: newBalance,
          }),
        },
      });

      return wallet;
    });

    // Log admin action (outside transaction for non-blocking)
    const { ip, userAgent } = getRequestInfo(request);
    await logActivity(session.user.id, 'ADMIN_USER_BALANCE_ADJUST', {
      targetType: 'USER',
      targetId: validatedData.userId,
      metadata: {
        userEmail: user.email,
        oldBalance: currentBalance,
        newBalance: newBalance,
        amount: validatedData.amount,
        adjustmentType: validatedData.type,
        reason: validatedData.reason,
        walletId: updatedWallet.id,
      },
      ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: {
        wallet: updatedWallet,
        adjustment: {
          type: validatedData.type,
          amount: validatedData.amount,
          oldBalance: currentBalance,
          newBalance: newBalance,
          reason: validatedData.reason,
        },
      },
    });
  } catch (error) {
    console.error('Error adjusting wallet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
