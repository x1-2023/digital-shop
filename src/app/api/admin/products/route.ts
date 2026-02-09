import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { logActivity, getRequestInfo } from '@/lib/user-activity';

const createProductSchema = z.object({
  name: z.string().min(1, 'Tên sản phẩm không được để trống'),
  slug: z.string().min(1, 'Slug không được để trống'),
  categoryId: z.string().min(1, 'Danh mục không được để trống'),
  priceVnd: z.number().min(0, 'Giá không được âm'),
  stock: z.number().min(0, 'Số lượng không được âm'),
  description: z.string().optional(),
  fileName: z.string().optional(),
  fileUrl: z.string().optional(),
  totalLines: z.number().default(0),
  usedLines: z.number().default(0),
  images: z.string().optional(),
  active: z.boolean().default(true),
  isSale: z.boolean().default(false),
  salePercent: z.number().min(1).max(99).default(10),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');
    const active = searchParams.get('active');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: {
      OR?: Array<{ name: { contains: string } } | { slug: { contains: string } } | { description: { contains: string } }>;
      categoryId?: string;
      active?: boolean;
    } = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId;
    }

    if (active && active !== 'all') {
      where.active = active === 'true';
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Received product data:', body);

    const validatedData = createProductSchema.parse(body);
    console.log('Validated data:', validatedData);

    // Check if slug already exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Slug đã tồn tại' },
        { status: 400 }
      );
    }

    // Verify category exists
    // const category = await prisma.category.findUnique({
    //   where: { id: validatedData.categoryId },
    // });

    // if (!category) {
    //   return NextResponse.json(
    //     { error: 'Danh mục không tồn tại' },
    //     { status: 400 }
    //   );
    // }

    const product = await prisma.product.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        categoryId: validatedData.categoryId,
        priceVnd: validatedData.priceVnd,
        stock: validatedData.stock,
        description: validatedData.description,
        fileName: validatedData.fileName,
        fileUrl: validatedData.fileUrl,
        totalLines: validatedData.totalLines,
        usedLines: validatedData.usedLines,
        images: validatedData.images,
        active: validatedData.active,
        isSale: validatedData.isSale,
        salePercent: validatedData.salePercent,
      } as unknown as Parameters<typeof prisma.product.create>[0]['data'],
    });

    // Log admin action
    const { ip, userAgent } = getRequestInfo(request);
    await logActivity(session.user.id, 'ADMIN_PRODUCT_CREATE', {
      targetType: 'PRODUCT',
      targetId: product.id,
      metadata: {
        productName: product.name,
        slug: product.slug,
        priceVnd: product.priceVnd,
        stock: product.stock,
        categoryId: product.categoryId,
      },
      ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { product },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

