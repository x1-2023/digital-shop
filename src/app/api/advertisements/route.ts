import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/advertisements?placement=SIDEBAR_LEFT
 * Public API - Get ads for specific placement
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const placement = searchParams.get('placement');

    if (!placement) {
      return NextResponse.json(
        { error: 'Placement parameter required' },
        { status: 400 }
      );
    }

    const ads = await prisma.advertisement.findMany({
      where: {
        placement: placement as any,
        enabled: true,
      },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        type: true,
        placement: true,
        content: true,
        imageUrl: true,
        clickUrl: true,
        order: true,
      },
    });

    return NextResponse.json({ ads });
  } catch (error) {
    console.error('[API] Error fetching advertisements:', error);
    return NextResponse.json({ ads: [] }, { status: 500 });
  }
}
