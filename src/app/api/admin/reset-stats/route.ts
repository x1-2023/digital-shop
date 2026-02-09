import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/admin/reset-stats - Reset all transactional data for testing
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.user || session.user.role !== 'OWNER') {
            return NextResponse.json(
                { error: 'Only OWNER can reset stats' },
                { status: 403 }
            );
        }

        const body = await request.json();
        if (body.confirm !== 'RESET_ALL_DATA') {
            return NextResponse.json(
                { error: 'Invalid confirmation code' },
                { status: 400 }
            );
        }

        // Delete in correct order to respect foreign key constraints
        // 1. Delete order-related data
        await prisma.payment.deleteMany({});
        await prisma.orderItem.deleteMany({});
        await prisma.order.deleteMany({});

        // 2. Delete wallet transactions and deposits
        await prisma.walletTransaction.deleteMany({});
        await prisma.manualDepositRequest.deleteMany({});
        await prisma.autoTopupLog.deleteMany({});

        // 3. Delete download logs
        await prisma.downloadLog.deleteMany({});

        // 4. Delete reviews
        await prisma.review.deleteMany({});

        // 5. Delete activity logs
        await prisma.userActivityLog.deleteMany({});
        await prisma.adminActionLog.deleteMany({});
        await prisma.systemLog.deleteMany({});
        await prisma.errorReport.deleteMany({});

        // 6. Reset all wallets to 0
        await prisma.wallet.updateMany({
            data: { balanceVnd: 0 },
        });

        // 7. Reset product sold counts and used lines
        await prisma.product.updateMany({
            data: {
                usedLines: 0,
                fakeSold: 0,
            },
        });

        // 8. Delete product line items (purchased accounts data)
        await prisma.productLineItem.deleteMany({});

        return NextResponse.json({
            success: true,
            message: 'All transactional data has been reset',
        });
    } catch (error) {
        console.error('Error resetting stats:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}
