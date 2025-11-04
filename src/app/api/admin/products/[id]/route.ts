import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { logActivity, getRequestInfo } from '@/lib/user-activity';

const updateProductSchema = z.object({
  name: z.string().min(1, 'Tên sản phẩm không được để trống').optional(),
  slug: z.string().min(1, 'Slug không được để trống').optional(),
  categoryId: z.string().optional(),
  priceVnd: z.number().min(0, 'Giá không được âm').optional(),
  stock: z.number().min(0, 'Số lượng không được âm').optional(),
  description: z.string().optional(),
  fileName: z.string().optional(),
  fileUrl: z.string().optional(),
  totalLines: z.number().optional(),
  usedLines: z.number().optional(),
  images: z.string().optional(),
  active: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getSession();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getSession();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if slug already exists (if updating slug)
    if (validatedData.slug && validatedData.slug !== existingProduct.slug) {
      const slugExists = await prisma.product.findUnique({
        where: { slug: validatedData.slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'Slug đã tồn tại' },
          { status: 400 }
        );
      }
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: validatedData as any,
    });

    // Log admin action
    const { ip, userAgent } = getRequestInfo(request);
    await logActivity(session.user.id, 'ADMIN_PRODUCT_UPDATE', {
      targetType: 'PRODUCT',
      targetId: product.id,
      metadata: {
        productName: product.name,
        changes: validatedData,
      },
      ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getSession();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Soft delete: Set active = false instead of hard delete
    // This preserves order history while hiding product from shop
    await prisma.product.update({
      where: { id: params.id },
      data: { active: false },
    });

    // Log admin action
    const { ip, userAgent } = getRequestInfo(request);
    await logActivity(session.user.id, 'ADMIN_PRODUCT_DELETE', {
      targetType: 'PRODUCT',
      targetId: params.id,
      metadata: {
        productName: existingProduct.name,
        slug: existingProduct.slug,
        priceVnd: existingProduct.priceVnd,
      },
      ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}