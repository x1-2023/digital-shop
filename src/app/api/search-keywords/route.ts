import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public endpoint for search dropdown suggestions
export async function GET() {
    try {
        const keywords = await prisma.searchKeyword.findMany({
            where: { active: true },
            orderBy: { order: 'asc' },
            select: {
                id: true,
                keyword: true,
                subtitle: true,
                icon: true,
            }
        });
        return NextResponse.json(keywords);
    } catch (error) {
        console.error('Error fetching search keywords:', error);
        return NextResponse.json([], { status: 200 }); // Return empty array on error
    }
}
