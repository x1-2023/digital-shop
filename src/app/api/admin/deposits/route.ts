import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'PENDING' | 'APPROVED' | 'REJECTED' | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [deposits, total] = await Promise.all([
      prisma.manualDepositRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      }),
      prisma.manualDepositRequest.count({ where }),
    ]);

    // Map to frontend format
    const mappedDeposits = deposits.map((deposit) => ({
      id: deposit.id,
      userEmail: deposit.user.email,
      amount: deposit.amountVnd,
      status: deposit.status,
      createdAt: deposit.createdAt,
      note: deposit.note,
      adminNote: deposit.adminNote,
      qrCode: deposit.qrCode,
      transferContent: deposit.transferContent,
      decidedAt: deposit.decidedAt,
    }));

    return NextResponse.json({
      deposits: mappedDeposits,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get deposits error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
