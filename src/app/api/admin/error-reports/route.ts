import { NextRequest, NextResponse } from 'next/server';
// Auth using custom JWT session
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get filter parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    // Fetch error reports
    const errorReports = await prisma.errorReport.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit to 100 most recent
    });

    return NextResponse.json({
      success: true,
      reports: errorReports,
    });
  } catch (error) {
    console.error('Error fetching error reports:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
