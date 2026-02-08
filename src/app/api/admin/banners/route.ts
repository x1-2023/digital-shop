import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const bannerSchema = z.object({
    title: z.string().min(1),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    buttonText: z.string().default('Khám phá ngay'),
    buttonLink: z.string().default('/products'),
    imageUrl: z.string().optional(),
    gradientFrom: z.string().default('#2563EB'),
    gradientTo: z.string().default('#06B6D4'),
    features: z.array(z.string()).optional(),
    order: z.number().int().default(0),
    active: z.boolean().default(true),
});

// GET - List all banners
export async function GET() {
    try {
        const banners = await prisma.banner.findMany({
            orderBy: { order: 'asc' },
        });

        return NextResponse.json({ banners });
    } catch (error) {
        console.error('Failed to fetch banners:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST - Create a new banner (Admin only)
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = bannerSchema.parse(body);

        const banner = await prisma.banner.create({
            data: {
                ...validatedData,
                features: validatedData.features ? JSON.stringify(validatedData.features) : null,
            },
        });

        return NextResponse.json({ banner }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('Failed to create banner:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
