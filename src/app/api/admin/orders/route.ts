import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user || ((session.(user.role !== 'ADMIN' && user.role !== 'OWNER') && session.user.role !== 'OWNER') && session.user.role !== 'OWNER')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: { 
      createdAt?: { gte: Date };
      OR?: Array<{ user: { email: { contains: string } } } | { id: { contains: string } }>;
      status?: OrderStatus;
    } = {};

    if (search) {
      where.OR = [
        { id: { contains: search } },
        { user: { email: { contains: search } } },
      ];
    }

    if (status && status !== 'all') {
      where.status = status as OrderStatus;
    }

    if (date && date !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (date) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }

      where.createdAt = {
        gte: startDate,
      };
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          payments: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
