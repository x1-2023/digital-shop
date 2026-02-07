import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateBannerSchema = z.object({
    title: z.string().min(1).optional(),
    subtitle: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    buttonText: z.string().optional(),
    buttonLink: z.string().optional(),
    imageUrl: z.string().optional().nullable(),
    gradientFrom: z.string().optional(),
    gradientTo: z.string().optional(),
    features: z.array(z.string()).optional().nullable(),
    order: z.number().int().optional(),
    active: z.boolean().optional(),
});

// GET - Get single banner
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const banner = await prisma.banner.findUnique({
            where: { id: params.id },
        });

        if (!banner) {
            return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
        }

        return NextResponse.json({ banner });
    } catch (error) {
        console.error('Failed to fetch banner:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT - Update banner (Admin only)
export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params = await props.params;
        const body = await request.json();
        const validatedData = updateBannerSchema.parse(body);

        const banner = await prisma.banner.update({
            where: { id: params.id },
            data: {
                ...validatedData,
                features: validatedData.features ? JSON.stringify(validatedData.features) : undefined,
            },
        });

        return NextResponse.json({ banner });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('Failed to update banner:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE - Delete banner (Admin only)
export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params = await props.params;
        await prisma.banner.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: 'Banner deleted successfully' });
    } catch (error) {
        console.error('Failed to delete banner:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
