import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const updateSchema = z.object({
    keyword: z.string().min(1).optional(),
    subtitle: z.string().optional(),
    icon: z.string().optional(),
    order: z.number().int().optional(),
    active: z.boolean().optional(),
});

// PUT: Update keyword
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const validation = updateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const keyword = await prisma.searchKeyword.update({
            where: { id },
            data: validation.data,
        });

        return NextResponse.json(keyword);
    } catch (error) {
        console.error('Error updating keyword:', error);
        return NextResponse.json({ error: 'Failed to update keyword' }, { status: 500 });
    }
}

// DELETE: Remove keyword
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await prisma.searchKeyword.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting keyword:', error);
        return NextResponse.json({ error: 'Failed to delete keyword' }, { status: 500 });
    }
}
