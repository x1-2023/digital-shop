import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/admin/users/promote - Promote a user to ADMIN role
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { email, role } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const targetRole = role || 'ADMIN';
        if (!['ADMIN', 'USER'].includes(targetRole)) {
            return NextResponse.json({ error: 'Invalid role. Only ADMIN or USER allowed' }, { status: 400 });
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: email.trim().toLowerCase() },
        });

        if (!user) {
            return NextResponse.json({ error: `Không tìm thấy user với email: ${email}` }, { status: 404 });
        }

        // Cannot change OWNER role
        if (user.role === 'OWNER') {
            return NextResponse.json({ error: 'Không thể thay đổi role của OWNER' }, { status: 403 });
        }

        // Cannot demote yourself
        if (user.email === session.user.email && targetRole === 'USER') {
            return NextResponse.json({ error: 'Không thể hạ quyền chính mình' }, { status: 400 });
        }

        // Update role
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { role: targetRole },
            select: { id: true, email: true, role: true },
        });

        return NextResponse.json({
            success: true,
            message: `Đã ${targetRole === 'ADMIN' ? 'nâng lên Admin' : 'hạ xuống User'}: ${updatedUser.email}`,
            user: updatedUser,
        });
    } catch (error) {
        console.error('Error promoting user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
