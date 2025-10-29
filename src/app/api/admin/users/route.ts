import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const getUsersSchema = z.object({
  search: z.string().optional(),
  role: z.enum(['ADMIN', 'BUYER']).optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
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
    const params = getUsersSchema.parse({
      search: searchParams.get('search') || undefined,
      role: searchParams.get('role') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    });

    const where: {
      OR?: Array<{ email: { contains: string } } | { id: { contains: string } }>;
      role?: UserRole;
    } = {};

    if (params.search) {
      where.OR = [
        { email: { contains: params.search } },
        { id: { contains: params.search } },
      ];
    }

    if (params.role) {
      where.role = params.role as UserRole;
    }

    const page = parseInt(params.page);
    const limit = parseInt(params.limit);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          wallet: {
            select: {
              balanceVnd: true,
            },
          },
          _count: {
            select: {
              orders: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
