import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;

  try {
    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const [stats, distribution] = await Promise.all([
      // Overall stats
      prisma.review.aggregate({
        where: {
          productId: product.id,
          status: 'PUBLISHED'
        },
        _avg: { rating: true },
        _count: true,
      }),
      // Rating distribution
      prisma.review.groupBy({
        by: ['rating'],
        where: {
          productId: product.id,
          status: 'PUBLISHED'
        },
        _count: true,
      })
    ]);

    // Format distribution (5 stars -> 1 star)
    const ratingDistribution = [5, 4, 3, 2, 1].map(rating => {
      const item = distribution.find(d => d.rating === rating);
      return {
        rating,
        count: item?._count || 0,
        percentage: stats._count > 0
          ? Math.round(((item?._count || 0) / stats._count) * 100)
          : 0,
      };
    });

    return NextResponse.json({
      average: stats._avg.rating ? Number(stats._avg.rating.toFixed(1)) : 0,
      total: stats._count,
      distribution: ratingDistribution,
    });

  } catch (error) {
    console.error('[Review Stats] Error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
