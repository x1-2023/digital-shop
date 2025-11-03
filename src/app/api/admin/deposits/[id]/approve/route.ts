import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { approveDepositSchema } from '@/lib/validations';
import { addEmailJob } from '@/lib/queues';
import { generateIdempotencyKey } from '@/lib/utils';
import { logActivity, getRequestInfo } from '@/lib/user-activity';
import { logDepositApprove } from '@/lib/system-log';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getSession();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const depositId = parseInt(params.id, 10);
    
    if (isNaN(depositId)) {
      return NextResponse.json({ error: 'Invalid deposit ID' }, { status: 400 });
    }
    
    const { adminNote } = approveDepositSchema.parse({ ...body, depositId: params.id });

    // Check if deposit request exists and is pending
    const depositRequest = await prisma.manualDepositRequest.findFirst({
      where: {
        id: depositId,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            wallet: true,
          },
        },
      },
    });

    if (!depositRequest) {
      return NextResponse.json({ error: 'Deposit request not found or already processed' }, { status: 404 });
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Update deposit request
      const updatedDeposit = await tx.manualDepositRequest.update({
        where: { id: depositId },
        data: {
          status: 'APPROVED',
          adminNote,
          decidedAt: new Date(),
        },
      });

      // Update wallet balance
      await tx.wallet.update({
        where: { userId: depositRequest.userId },
        data: {
          balanceVnd: {
            increment: depositRequest.amountVnd,
          },
        },
      });

      // Get updated balance
      const wallet = await tx.wallet.findUnique({
        where: { userId: depositRequest.userId },
      });

      // Create wallet transaction log
      await tx.walletTransaction.create({
        data: {
          userId: depositRequest.userId,
          type: 'DEPOSIT',
          amountVnd: depositRequest.amountVnd,
          balanceAfterVnd: wallet?.balanceVnd || 0,
          description: `Manual deposit approved by admin`,
          metadata: JSON.stringify({
            depositRequestId: depositId,
            adminNote,
            approvedBy: session.user.id,
          }),
        },
      });

      return updatedDeposit;
    });

    // Send email notification
    await addEmailJob({
      type: 'topup-approved',
      email: depositRequest.user.email,
      amount: depositRequest.amountVnd,
      adminNote,
    });

    // Process referral rewards for manual deposit
    try {
      const { processReferralRewards } = await import('@/lib/referral');
      await processReferralRewards(depositRequest.userId, depositRequest.amountVnd);
    } catch (referralError) {
      console.error('[ManualDeposit] Referral reward error:', referralError);
    }

    // Send Discord webhook notification (async, don't wait)
    try {
      const { sendDepositNotification, loadWebhookConfig } = await import('@/lib/discord-webhook');
      const webhookConfig = await loadWebhookConfig();

      if (webhookConfig.enabled && webhookConfig.notifyOnDeposits) {
        sendDepositNotification(webhookConfig, {
          userId: depositRequest.userId,
          userEmail: depositRequest.user.email,
          amount: depositRequest.amountVnd,
          status: 'APPROVED',
          method: 'MANUAL',
        }).catch(err => console.error('Webhook error:', err));
      }
    } catch (webhookError) {
      console.error('Failed to send webhook notification:', webhookError);
    }

    // Log admin action
    const { ip, userAgent } = getRequestInfo(request);
    await logActivity(session.user.id, 'ADMIN_DEPOSIT_APPROVE', {
      targetType: 'DEPOSIT',
      targetId: depositId.toString(),
      metadata: {
        userId: depositRequest.userId,
        userEmail: depositRequest.user.email,
        amount: depositRequest.amountVnd,
        adminNote,
      },
      ip,
      userAgent,
    });

    // Log to system log
    await logDepositApprove(
      session.user.id,
      session.user.email,
      depositRequest.userId,
      depositRequest.user.email,
      depositRequest.amountVnd,
      depositId.toString()
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Approve deposit error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



