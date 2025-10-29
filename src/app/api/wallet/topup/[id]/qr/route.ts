import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const depositRequest = await prisma.manualDepositRequest.findFirst({
      where: {
        id: parseInt(params.id),
        userId: session.user.id,
      },
      select: {
        qrCode: true,
        transferContent: true,
        amountVnd: true,
        status: true,
      },
    });

    if (!depositRequest) {
      return NextResponse.json({ error: 'Deposit request not found' }, { status: 404 });
    }

    return NextResponse.json({
      qrCode: depositRequest.qrCode,
      transferContent: depositRequest.transferContent,
      amount: depositRequest.amountVnd,
      status: depositRequest.status,
    });
  } catch (error) {
    console.error('Get QR code error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



