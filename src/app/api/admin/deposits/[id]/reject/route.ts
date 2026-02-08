import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rejectDepositSchema } from '@/lib/validations';
import { addEmailJob } from '@/lib/queues';
import { logActivity, getRequestInfo } from '@/lib/user-activity';
import { logDepositReject } from '@/lib/system-log';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getSession();
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const depositId = parseInt(params.id, 10);
    
    if (isNaN(depositId)) {
      return NextResponse.json({ error: 'Invalid deposit ID' }, { status: 400 });
    }
    
    const { adminNote } = rejectDepositSchema.parse({ ...body, depositId: params.id });

    // Check if deposit request exists and is pending
    const depositRequest = await prisma.manualDepositRequest.findFirst({
      where: {
        id: depositId,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!depositRequest) {
      return NextResponse.json({ error: 'Deposit request not found or already processed' }, { status: 404 });
    }

    // Update deposit request
    const result = await prisma.$transaction(async (tx) => {
      const updatedDeposit = await tx.manualDepositRequest.update({
        where: { id: depositId },
        data: {
          status: 'REJECTED',
          adminNote,
          decidedAt: new Date(),
        },
      });

      return updatedDeposit;
    });


    // Send email notification
    await addEmailJob({
      type: 'topup-rejected',
      email: depositRequest.user.email,
      amount: depositRequest.amountVnd,
      adminNote,
    });

    // Log admin action
    const { ip, userAgent } = getRequestInfo(request);
    await logActivity(session.user.id, 'ADMIN_DEPOSIT_REJECT', {
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
    await logDepositReject(
      session.user.id,
      session.user.email,
      depositRequest.userId,
      depositRequest.user.email,
      depositRequest.amountVnd,
      depositId.toString(),
      adminNote || 'No reason provided'
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Reject deposit error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



