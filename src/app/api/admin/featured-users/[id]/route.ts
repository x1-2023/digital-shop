import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
    name: z.string().min(1).optional(),
    sales: z.number().int().optional(),
    rating: z.number().min(0).max(5).optional(),
    avatarUrl: z.string().optional().nullable(),
    rank: z.number().int().optional(),
    active: z.boolean().optional(),
});

// PUT - Update user (Admin only)
export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session?.user || ((session.(user.role !== 'ADMIN' && user.role !== 'OWNER') && session.user.role !== 'OWNER') && session.user.role !== 'OWNER')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params = await props.params;
        const body = await request.json();
        const validatedData = updateSchema.parse(body);

        const user = await prisma.featuredUser.update({
            where: { id: params.id },
            data: validatedData,
        });

        return NextResponse.json({ user });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('Failed to update featured user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE - Delete user (Admin only)
export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session?.user || ((session.(user.role !== 'ADMIN' && user.role !== 'OWNER') && session.user.role !== 'OWNER') && session.user.role !== 'OWNER')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params = await props.params;
        await prisma.featuredUser.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Failed to delete featured user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
