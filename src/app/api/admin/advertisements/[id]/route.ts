import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const advertisementUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['GOOGLE_ADSENSE', 'HTML_EMBED', 'IMAGE_BANNER', 'VIDEO']).optional(),
  placement: z.enum(['SIDEBAR_LEFT', 'SIDEBAR_RIGHT', 'BETWEEN_PRODUCTS', 'HEADER', 'FOOTER']).optional(),
  content: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  clickUrl: z.string().url().nullable().optional(),
  order: z.number().int().optional(),
  enabled: z.boolean().optional(),
});

/**
 * PATCH /api/admin/advertisements/[id]
 * Update advertisement
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const body = await req.json();
    const validated = advertisementUpdateSchema.parse(body);

    const ad = await prisma.advertisement.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json({ success: true, ad });
  } catch (error) {
    console.error('[API] Error updating advertisement:', error);
    return NextResponse.json(
      { error: 'Failed to update advertisement' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/advertisements/[id]
 * Delete advertisement
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.advertisement.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error deleting advertisement:', error);
    return NextResponse.json(
      { error: 'Failed to delete advertisement' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/advertisements/[id]/track
 * Track impression or click
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action } = body; // 'impression' or 'click'

    if (action === 'impression') {
      await prisma.advertisement.update({
        where: { id },
        data: { impressions: { increment: 1 } },
      });
    } else if (action === 'click') {
      await prisma.advertisement.update({
        where: { id },
        data: { clicks: { increment: 1 } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error tracking ad:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
