import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const getProductsSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  sort: z.enum(['newest', 'oldest', 'price-low', 'price-high', 'name', 'bestseller', 'discount']).optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  active: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = getProductsSchema.parse({
      search: searchParams.get('search') ?? undefined,
      categoryId: searchParams.get('categoryId') ?? undefined,
      sort: searchParams.get('sort') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      active: searchParams.get('active') ?? undefined,
    });

    const where: Record<string, unknown> = {};

    // Only filter by active if not specified (defaults to all for admin)
    if (params.active !== undefined) {
      where.active = params.active === 'true';
    } else {
      where.active = true; // Default for public: only active products
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { description: { contains: params.search } },
      ];
    }

    if (params.categoryId) {
      where.categoryId = params.categoryId;
    }

    const orderBy: Record<string, string> = {};
    switch (params.sort) {
      case 'oldest':
        orderBy.createdAt = 'asc';
        break;
      case 'price-low':
        orderBy.priceVnd = 'asc';
        break;
      case 'price-high':
        orderBy.priceVnd = 'desc';
        break;
      case 'name':
        orderBy.name = 'asc';
        break;
      default:
        orderBy.createdAt = 'desc';
    }

    const page = parseInt(params.page);
    const limit = parseInt(params.limit);
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          priceVnd: true,
          stock: true,
          images: true,
          active: true,
          description: true, // Needed for listing snippets
          createdAt: true,
          updatedAt: true,
          category: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
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
