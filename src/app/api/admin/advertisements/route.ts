import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const advertisementSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['GOOGLE_ADSENSE', 'HTML_EMBED', 'IMAGE_BANNER', 'VIDEO']),
  placement: z.enum(['SIDEBAR_LEFT', 'SIDEBAR_RIGHT', 'BETWEEN_PRODUCTS', 'HEADER', 'FOOTER']),
  content: z.string(),
  imageUrl: z.string().nullable().optional(),
  clickUrl: z.string().url().nullable().optional(),
  order: z.number().int().default(0),
  enabled: z.boolean().default(true),
});

/**
 * GET /api/admin/advertisements
 * Get all advertisements
 */
export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ads = await prisma.advertisement.findMany({
      orderBy: [{ placement: 'asc' }, { order: 'asc' }],
    });

    return NextResponse.json({ ads });
  } catch (error) {
    console.error('[API] Error fetching advertisements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advertisements' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/advertisements
 * Create new advertisement
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = advertisementSchema.parse(body);

    const ad = await prisma.advertisement.create({
      data: validated,
    });

    return NextResponse.json({ success: true, ad });
  } catch (error) {
    console.error('[API] Error creating advertisement:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create advertisement' },
      { status: 500 }
    );
  }
}
