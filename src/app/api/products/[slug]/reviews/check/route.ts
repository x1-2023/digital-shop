import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Check if user can review this product
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;

    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ canReview: false, reason: 'not_logged_in' }, { status: 401 });
        }

        const product = await prisma.product.findUnique({
            where: { slug: params.slug },
        });

        if (!product) {
            return NextResponse.json({ canReview: false, reason: 'product_not_found' }, { status: 404 });
        }

        // Check if already reviewed
        const existingReview = await prisma.review.findUnique({
            where: {
                userId_productId: {
                    userId: session.user.id,
                    productId: product.id,
                },
            },
        });

        if (existingReview) {
            return NextResponse.json({ canReview: false, reason: 'already_reviewed' });
        }

        // Check if purchased
        const hasPurchased = await prisma.order.findFirst({
            where: {
                userId: session.user.id,
                status: 'PAID',
                orderItems: {
                    some: { productId: product.id },
                },
            },
        });

        if (!hasPurchased) {
            return NextResponse.json({ canReview: false, reason: 'not_purchased' });
        }

        return NextResponse.json({ canReview: true });
    } catch (error) {
        console.error('[Check Review Eligibility] Error:', error);
        return NextResponse.json({ canReview: false, reason: 'error' }, { status: 500 });
    }
}
