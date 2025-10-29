import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get deposit requests
    const depositRequests = await prisma.manualDepositRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        amountVnd: true,
        status: true,
        note: true,
        adminNote: true,
        createdAt: true,
        decidedAt: true,
      },
    });

    // Get orders (as spending history)
    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        totalAmountVnd: true,
        status: true,
        createdAt: true,
        itemsJson: true,
      },
    });

    // Combine and sort by date
    const history = [
      ...depositRequests.map(deposit => ({
        type: 'deposit' as const,
        id: deposit.id,
        amount: deposit.amountVnd,
        status: deposit.status,
        note: deposit.note,
        adminNote: deposit.adminNote,
        createdAt: deposit.createdAt,
        decidedAt: deposit.decidedAt,
      })),
      ...orders.map(order => ({
        type: 'order' as const,
        id: order.id,
        amount: -order.totalAmountVnd, // Negative for spending
        status: order.status,
        note: 'Mua hàng',
        adminNote: null,
        createdAt: order.createdAt,
        decidedAt: null,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      history: history.slice(0, limit),
      pagination: {
        page,
        limit,
        hasMore: history.length > limit,
      },
    });
  } catch (error) {
    console.error('Wallet history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



