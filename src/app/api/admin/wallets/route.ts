import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const getWalletsSchema = z.object({
  search: z.string().optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
});

const adjustWalletSchema = z.object({
  userId: z.string().min(1, 'User ID không được để trống'),
  amount: z.number().min(1, 'Số tiền phải lớn hơn 0'),
  type: z.enum(['add', 'subtract']),
  reason: z.string().min(1, 'Lý do không được để trống'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const params = getWalletsSchema.parse({
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    });

    const where: {
      OR?: Array<{ user: { email: { contains: string } } } | { userId: { contains: string } }>;
    } = {};

    if (params.search) {
      where.OR = [
        { user: { email: { contains: params.search } } },
        { userId: { contains: params.search } },
      ];
    }

    const page = parseInt(params.page);
    const limit = parseInt(params.limit);
    const skip = (page - 1) * limit;

    const [wallets, total] = await Promise.all([
      prisma.wallet.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.wallet.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        wallets,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching wallets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
