import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { maskEmail } from '@/lib/utils';
import { z } from 'zod';

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  isAnonymous: z.boolean().default(false),
});

// POST - Create a review
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;

  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const body = await request.json();
    const data = createReviewSchema.parse(body);

    // Check: User đã mua product chưa?
    const hasPurchased = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        status: 'PAID',
        orderItems: {
          some: { productId: product.id }
        }
      }
    });

    if (!hasPurchased) {
      return NextResponse.json({
        error: 'Bạn cần mua sản phẩm trước khi đánh giá'
      }, { status: 403 });
    }

    // Check: Đã review chưa?
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: product.id
        }
      }
    });

    if (existingReview) {
      return NextResponse.json({
        error: 'Bạn đã đánh giá sản phẩm này rồi'
      }, { status: 400 });
    }

    // Create review in transaction (update product stats too)
    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          userId: session.user.id,
          productId: product.id,
          orderId: hasPurchased.id,
          rating: data.rating,
          comment: data.comment,
          isAnonymous: data.isAnonymous,
        },
      });

      // Recalculate product review stats
      const stats = await tx.review.aggregate({
        where: {
          productId: product.id,
          status: 'PUBLISHED'
        },
        _avg: { rating: true },
        _count: true,
      });

      // Update product with new stats (if you add these fields to Product)
      // await tx.product.update({
      //   where: { id: product.id },
      //   data: {
      //     reviewCount: stats._count,
      //     reviewAverage: stats._avg.rating || 0,
      //   }
      // });

      return newReview;
    });

    return NextResponse.json({
      success: true,
      data: review,
      message: 'Đánh giá đã được gửi thành công'
    });

  } catch (error) {
    console.error('[Create Review] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dữ liệu không hợp lệ',
        details: error.issues
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// GET - List reviews
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const rating = searchParams.get('rating'); // Filter by rating

    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const where: any = {
      productId: product.id,
      status: 'PUBLISHED',
    };

    if (rating) {
      where.rating = parseInt(rating);
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    // Map to safe format (mask emails for privacy)
    const safeReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      isAnonymous: review.isAnonymous,
      // Safe display name
      displayName: review.isAnonymous
        ? "Người dùng ẩn danh"
        : maskEmail(review.user.email),
      avatar: review.isAnonymous
        ? "?"
        : review.user.email[0].toUpperCase(),
      createdAt: review.createdAt,
    }));

    return NextResponse.json({
      reviews: safeReviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    });

  } catch (error) {
    console.error('[Get Reviews] Error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
