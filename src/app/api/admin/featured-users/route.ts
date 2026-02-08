import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const featuredUserSchema = z.object({
    name: z.string().min(1),
    sales: z.number().int().default(0),
    rating: z.number().min(0).max(5).default(5.0),
    avatarUrl: z.string().optional(),
    rank: z.number().int().default(0),
    active: z.boolean().default(true),
});

// GET - List all featured users + mode setting
export async function GET() {
    try {
        const session = await getSession();
        if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const [users, modeSetting] = await Promise.all([
            prisma.featuredUser.findMany({
                orderBy: { rank: 'asc' },
            }),
            prisma.websiteSettings.findUnique({
                where: { key: 'top_sellers_mode' },
            }),
        ]);

        // If auto mode, also get auto-calculated top spenders for preview
        const mode = modeSetting?.value || 'manual';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let autoSpenders: any[] = [];

        if (mode === 'auto') {
            const topSpenders = await prisma.order.groupBy({
                by: ['userId'],
                where: { status: 'PAID' },
                _sum: { totalAmountVnd: true },
                orderBy: { _sum: { totalAmountVnd: 'desc' } },
                take: 5,
            });

            if (topSpenders.length > 0) {
                const userIds = topSpenders.map((s) => s.userId);
                const usersData = await prisma.user.findMany({
                    where: { id: { in: userIds } },
                    select: { id: true, email: true },
                });
                const userMap = new Map(usersData.map((u) => [u.id, u]));

                autoSpenders = topSpenders.map((s, index) => {
                    const user = userMap.get(s.userId);
                    const emailPrefix = user?.email?.split('@')[0] || 'User';
                    const maskedName = emailPrefix.length > 3
                        ? emailPrefix.substring(0, 3) + '***'
                        : emailPrefix + '***';
                    return {
                        id: s.userId,
                        name: maskedName,
                        fullName: emailPrefix,
                        totalSpent: s._sum.totalAmountVnd || 0,
                        avatarUrl: null,
                        rank: index + 1,
                    };
                });
            }
        }

        return NextResponse.json({ users, mode, autoSpenders });
    } catch (error) {
        console.error('Failed to fetch featured users:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST - Create a new featured user (Admin only)
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = featuredUserSchema.parse(body);

        const user = await prisma.featuredUser.create({
            data: validatedData,
        });

        return NextResponse.json({ user }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('Failed to create featured user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PATCH - Update mode setting (Admin only)
export async function PATCH(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { mode } = await request.json();

        if (mode !== 'manual' && mode !== 'auto') {
            return NextResponse.json({ error: 'Mode phải là "manual" hoặc "auto"' }, { status: 400 });
        }

        await prisma.websiteSettings.upsert({
            where: { key: 'top_sellers_mode' },
            update: { value: mode },
            create: { key: 'top_sellers_mode', value: mode },
        });

        return NextResponse.json({ success: true, mode });
    } catch (error) {
        console.error('Failed to update mode:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

