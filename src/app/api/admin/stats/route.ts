import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);

    // Parallel fetch all stats
    const [
      totalRevenueResult,
      todayRevenueResult,
      monthRevenueResult,
      yearRevenueResult,
      todayOrders,
      monthOrders,
      yearOrders,
      pendingDeposits,
      totalUsers,
      totalDepositsResult,
      todayDepositsResult,
      monthDepositsResult,
      yearDepositsResult,
      totalSpentResult,
      todaySpentResult,
      monthSpentResult,
      yearSpentResult,
    ] = await Promise.all([
      // Revenue stats (PAID orders)
      prisma.order.aggregate({
        where: { status: 'PAID' },
        _sum: { totalAmountVnd: true },
      }),
      prisma.order.aggregate({
        where: { status: 'PAID', createdAt: { gte: today } },
        _sum: { totalAmountVnd: true },
      }),
      prisma.order.aggregate({
        where: { status: 'PAID', createdAt: { gte: thisMonth } },
        _sum: { totalAmountVnd: true },
      }),
      prisma.order.aggregate({
        where: { status: 'PAID', createdAt: { gte: thisYear } },
        _sum: { totalAmountVnd: true },
      }),

      // Order counts
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.count({ where: { createdAt: { gte: thisMonth } } }),
      prisma.order.count({ where: { createdAt: { gte: thisYear } } }),

      // Pending deposits
      prisma.manualDepositRequest.count({ where: { status: 'PENDING' } }),

      // Total users
      prisma.user.count(),

      // Total deposits (approved manual + wallet transactions)
      prisma.walletTransaction.aggregate({
        where: { type: 'DEPOSIT' },
        _sum: { amountVnd: true },
      }),
      prisma.walletTransaction.aggregate({
        where: { type: 'DEPOSIT', createdAt: { gte: today } },
        _sum: { amountVnd: true },
      }),
      prisma.walletTransaction.aggregate({
        where: { type: 'DEPOSIT', createdAt: { gte: thisMonth } },
        _sum: { amountVnd: true },
      }),
      prisma.walletTransaction.aggregate({
        where: { type: 'DEPOSIT', createdAt: { gte: thisYear } },
        _sum: { amountVnd: true },
      }),

      // Total spent (PAID orders = money users spent)
      prisma.order.aggregate({
        where: { status: 'PAID' },
        _sum: { totalAmountVnd: true },
      }),
      prisma.order.aggregate({
        where: { status: 'PAID', createdAt: { gte: today } },
        _sum: { totalAmountVnd: true },
      }),
      prisma.order.aggregate({
        where: { status: 'PAID', createdAt: { gte: thisMonth } },
        _sum: { totalAmountVnd: true },
      }),
      prisma.order.aggregate({
        where: { status: 'PAID', createdAt: { gte: thisYear } },
        _sum: { totalAmountVnd: true },
      }),
    ]);

    return NextResponse.json({
      // Revenue (doanh thu)
      revenue: {
        total: totalRevenueResult._sum.totalAmountVnd || 0,
        today: todayRevenueResult._sum.totalAmountVnd || 0,
        month: monthRevenueResult._sum.totalAmountVnd || 0,
        year: yearRevenueResult._sum.totalAmountVnd || 0,
      },

      // Orders
      orders: {
        today: todayOrders,
        month: monthOrders,
        year: yearOrders,
      },

      // Deposits (số tiền user đã nạp)
      deposits: {
        total: totalDepositsResult._sum.amountVnd || 0,
        today: todayDepositsResult._sum.amountVnd || 0,
        month: monthDepositsResult._sum.amountVnd || 0,
        year: yearDepositsResult._sum.amountVnd || 0,
      },

      // Spent (số tiền user đã chi tiêu)
      spent: {
        total: totalSpentResult._sum.totalAmountVnd || 0,
        today: todaySpentResult._sum.totalAmountVnd || 0,
        month: monthSpentResult._sum.totalAmountVnd || 0,
        year: yearSpentResult._sum.totalAmountVnd || 0,
      },

      // Other stats
      pendingDeposits,
      totalUsers,

      // For backward compatibility
      totalRevenue: totalRevenueResult._sum.totalAmountVnd || 0,
      todayOrders,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
