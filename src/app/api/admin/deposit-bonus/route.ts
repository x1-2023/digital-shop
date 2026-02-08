import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const bonusTierSchema = z.object({
  minAmount: z.number().min(0),
  maxAmount: z.number().min(0),
  bonusPercent: z.number().min(0).max(100),
});

const depositBonusSchema = z.object({
  tiers: z.array(bonusTierSchema),
});

/**
 * GET /api/admin/deposit-bonus
 * Get deposit bonus tiers
 */
export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.settings.findUnique({
      where: { id: 'singleton' },
      select: { depositBonusTiers: true },
    });

    const tiers = settings?.depositBonusTiers
      ? JSON.parse(settings.depositBonusTiers)
      : [];

    return NextResponse.json({ tiers });
  } catch (error) {
    console.error('[API] Error fetching deposit bonus:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deposit bonus' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/deposit-bonus
 * Update deposit bonus tiers
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = depositBonusSchema.parse(body);

    // Validate tiers don't overlap
    const sortedTiers = validated.tiers.sort((a, b) => a.minAmount - b.minAmount);
    for (let i = 0; i < sortedTiers.length - 1; i++) {
      if (sortedTiers[i].maxAmount >= sortedTiers[i + 1].minAmount) {
        return NextResponse.json(
          { error: 'Tiers must not overlap' },
          { status: 400 }
        );
      }
    }

    await prisma.settings.update({
      where: { id: 'singleton' },
      data: {
        depositBonusTiers: JSON.stringify(validated.tiers),
      },
    });

    return NextResponse.json({ success: true, tiers: validated.tiers });
  } catch (error) {
    console.error('[API] Error updating deposit bonus:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update deposit bonus' },
      { status: 500 }
    );
  }
}
