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

// GET - List all featured users
export async function GET() {
    try {
        const users = await prisma.featuredUser.findMany({
            where: { active: true },
            orderBy: { rank: 'asc' },
        });

        return NextResponse.json({ users });
    } catch (error) {
        console.error('Failed to fetch featured users:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST - Create a new featured user (Admin only)
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user || session.user.role !== 'ADMIN') {
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
