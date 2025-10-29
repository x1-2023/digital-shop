import { getSession, requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { logActivity, getRequestInfo } from '@/lib/user-activity';

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await requireAdmin();

    const data = await req.json();
    const { name, description, slug, icon } = data;

    const category = await prisma.category.update({
      where: { id: params.id },
      data: {
        name,
        description,
        slug,
        icon,
      }
    });

    // Log admin action
    const { ip, userAgent } = getRequestInfo(req);
    await logActivity(session.user.id, 'ADMIN_CATEGORY_UPDATE', {
      targetType: 'CATEGORY',
      targetId: category.id,
      metadata: {
        categoryName: category.name,
        slug: category.slug,
        changes: data,
      },
      ip,
      userAgent,
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await requireAdmin();

    // Get category details before deletion
    const category = await prisma.category.findUnique({
      where: { id: params.id },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category has products
    const productCount = await prisma.product.count({
      where: { categoryId: params.id }
    });

    if (productCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with products' },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id: params.id }
    });

    // Log admin action
    const { ip, userAgent } = getRequestInfo(req);
    await logActivity(session.user.id, 'ADMIN_CATEGORY_DELETE', {
      targetType: 'CATEGORY',
      targetId: params.id,
      metadata: {
        categoryName: category.name,
        slug: category.slug,
      },
      ip,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
