
import { prisma } from '@/lib/prisma';

export async function processAutoReviews() {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    console.log('[AutoReview] Starting check for orders before:', fiveDaysAgo.toISOString());

    // 1. Find eligible orders:
    // - Status: PAID
    // - UpdatedAt: < 5 days ago
    // - Not fully reviewed? (Hard to query directly, so we'll fetch and filter)
    const eligibleOrders = await prisma.order.findMany({
        where: {
            status: 'PAID', // Assuming PAID is the completion status
            updatedAt: {
                lt: fiveDaysAgo,
            },
        },
        include: {
            orderItems: true,
            user: true,
        },
        take: 100, // Process in batches to avoid timeouts
    });

    console.log(`[AutoReview] Found ${eligibleOrders.length} potential orders.`);

    let reviewsCreated = 0;
    let errors = 0;

    for (const order of eligibleOrders) {
        for (const item of order.orderItems) {
            try {
                // Check if review already exists for this (user, product)
                const existingReview = await prisma.review.findUnique({
                    where: {
                        userId_productId: {
                            userId: order.userId,
                            productId: item.productId,
                        },
                    },
                });

                if (existingReview) {
                    continue; // Already reviewed
                }

                // Create 5-star review
                await prisma.review.create({
                    data: {
                        userId: order.userId,
                        productId: item.productId,
                        orderId: order.id,
                        rating: 5,
                        comment: 'Đánh giá tự động từ hệ thống (Mặc định 5 sao).',
                        status: 'PUBLISHED',
                        isAnonymous: false,
                    },
                });

                reviewsCreated++;
                console.log(`[AutoReview] Created review for Order #${order.id}, Product ${item.productId}`);
            } catch (error) {
                console.error(`[AutoReview] Failed for Order #${order.id}, Item ${item.productId}:`, error);
                errors++;
            }
        }
    }

    return {
        processed: eligibleOrders.length,
        reviewsCreated,
        errors,
    };
}
