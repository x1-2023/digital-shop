import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const keywordSchema = z.object({
    keyword: z.string().min(1, 'Từ khóa không được để trống'),
    subtitle: z.string().optional(),
    icon: z.string().default('🔥'),
    order: z.number().int().default(0),
    active: z.boolean().default(true),
});

// GET: List all keywords (public for search dropdown)
export async function GET() {
    try {
        const keywords = await prisma.searchKeyword.findMany({
            where: { active: true },
            orderBy: { order: 'asc' },
        });
        return NextResponse.json(keywords);
    } catch (error) {
        console.error('Error fetching keywords:', error);
        return NextResponse.json({ error: 'Failed to fetch keywords' }, { status: 500 });
    }
}

// POST: Create new keyword (admin only)
export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session?.user || ((session.(user.role !== 'ADMIN' && user.role !== 'OWNER') && session.user.role !== 'OWNER') && session.user.role !== 'OWNER')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validation = keywordSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const keyword = await prisma.searchKeyword.create({
            data: validation.data,
        });

        return NextResponse.json(keyword);
    } catch (error) {
        console.error('Error creating keyword:', error);
        return NextResponse.json({ error: 'Failed to create keyword' }, { status: 500 });
    }
}
