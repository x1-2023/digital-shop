
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Testing Reviews Query...');
    try {
        const reviews = await prisma.review.findMany({
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
                order: {
                    select: {
                        id: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        console.log('Reviews Query Successful!');
        console.log('Count:', reviews.length);
        if (reviews.length > 0) {
            console.log('Sample:', JSON.stringify(reviews[0], null, 2));
        }
    } catch (error) {
        console.error('Reviews Query FAILED:');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
