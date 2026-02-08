import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { logActivity, getRequestInfo } from '@/lib/user-activity';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();

    const data = await req.json();
    const { name, description, slug, icon } = data;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        icon,
        order: await prisma.category.count()
      }
    });

    // Log admin action
    const { ip, userAgent } = getRequestInfo(req);
    await logActivity(session.user.id, 'ADMIN_CATEGORY_CREATE', {
      targetType: 'CATEGORY',
      targetId: category.id,
      metadata: {
        categoryName: category.name,
        slug: category.slug,
        description: category.description,
      },
      ip,
      userAgent,
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
