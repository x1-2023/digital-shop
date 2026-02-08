import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get total orders count
    const totalOrders = await prisma.order.count({
      where: { userId: session.user.id },
    });

    // Get total spent (sum of all PAID orders)
    const paidOrders = await prisma.order.aggregate({
      where: {
        userId: session.user.id,
        status: 'PAID',
      },
      _sum: {
        totalAmountVnd: true,
      },
    });

    // Get total products purchased (sum of quantities from all PAID order items)
    const orderItems = await prisma.orderItem.aggregate({
      where: {
        order: {
          userId: session.user.id,
          status: 'PAID',
        },
      },
      _sum: {
        quantity: true,
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalOrders,
        totalSpentVnd: paidOrders._sum.totalAmountVnd || 0,
        totalProducts: orderItems._sum.quantity || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching account stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
