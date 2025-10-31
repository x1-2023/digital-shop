import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const search = searchParams.get('search');
    const action = searchParams.get('action');
    const targetType = searchParams.get('targetType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: { 
      createdAt?: { gte: Date };
      OR?: Array<{ admin: { email: { contains: string } } } | { action: { contains: string } } | { targetType: { contains: string } }>;
      action?: string;
      targetType?: string;
    } = {};

    if (search) {
      where.OR = [
        { admin: { email: { contains: search } } },
        { action: { contains: search } },
        { targetType: { contains: search } },
      ];
    }

    if (action && action !== 'all') {
      where.action = action;
    }

    if (targetType && targetType !== 'all') {
      where.targetType = targetType;
    }

    const [logs, total] = await Promise.all([
      prisma.adminActionLog.findMany({
        where,
        include: {
          admin: {
            select: {
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.adminActionLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching admin logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



