import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateReviewSchema = z.object({
  status: z.enum(['PUBLISHED', 'HIDDEN', 'DELETED']).optional(),
  adminNote: z.string().optional(),
});

// PATCH - Update review status or admin note
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const params = await props.params;
    const reviewId = params.id;

    const body = await request.json();
    const data = updateReviewSchema.parse(body);

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        product: true,
      },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Update review
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.adminNote !== undefined && { adminNote: data.adminNote }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // If status changed to HIDDEN or DELETED, recalculate product stats
    if (data.status && (data.status === 'HIDDEN' || data.status === 'DELETED')) {
      const stats = await prisma.review.aggregate({
        where: {
          productId: review.productId,
          status: 'PUBLISHED',
        },
        _avg: {
          rating: true,
        },
        _count: {
          id: true,
        },
      });

      await prisma.product.update({
        where: { id: review.productId },
        data: {
          // Store stats in product if you have these fields
          // averageRating: stats._avg.rating || 0,
          // reviewCount: stats._count.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      review: updatedReview,
      message: 'Review updated successfully',
    });
  } catch (error) {
    console.error('[Admin Update Review] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid data',
        details: error.issues,
      }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Permanently delete review
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const params = await props.params;
    const reviewId = params.id;

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({
      success: true,
      message: 'Review deleted permanently',
    });
  } catch (error) {
    console.error('[Admin Delete Review] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
