import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Check mode setting
        const modeSetting = await prisma.websiteSettings.findUnique({
            where: { key: 'top_sellers_mode' },
        });

        const mode = modeSetting?.value || 'manual';

        if (mode === 'auto') {
            // Auto mode: Calculate from real orders (PAID only)
            const topSpenders = await prisma.order.groupBy({
                by: ['userId'],
                where: { status: 'PAID' },
                _sum: { totalAmountVnd: true },
                orderBy: { _sum: { totalAmountVnd: 'desc' } },
                take: 5,
            });

            if (topSpenders.length === 0) {
                return NextResponse.json({ mode: 'auto', spenders: [] });
            }

            // Get user emails
            const userIds = topSpenders.map((s) => s.userId);
            const users = await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, email: true },
            });

            const userMap = new Map(users.map((u) => [u.id, u]));

            const spenders = topSpenders.map((s, index) => {
                const user = userMap.get(s.userId);
                const emailPrefix = user?.email?.split('@')[0] || 'User';
                // Mask name for privacy: show first 3 chars + ***
                const maskedName =
                    emailPrefix.length > 3
                        ? emailPrefix.substring(0, 3) + '***'
                        : emailPrefix + '***';

                return {
                    id: s.userId,
                    name: maskedName,
                    totalSpent: s._sum.totalAmountVnd || 0,
                    avatarUrl: null,
                    rank: index + 1,
                };
            });

            return NextResponse.json({ mode: 'auto', spenders });
        } else {
            // Manual mode: Get from FeaturedUser table
            const featuredUsers = await prisma.featuredUser.findMany({
                where: { active: true },
                orderBy: { rank: 'asc' },
                take: 5,
            });

            const spenders = featuredUsers.map((u) => ({
                id: u.id,
                name: u.name,
                totalSpent: u.sales,
                avatarUrl: u.avatarUrl,
                rank: u.rank,
            }));

            return NextResponse.json({ mode: 'manual', spenders });
        }
    } catch (error) {
        console.error('Top sellers API error:', error);
        return NextResponse.json({ mode: 'manual', spenders: [] });
    }
}
