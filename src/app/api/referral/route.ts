import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { ensureReferralCode, getReferralStats, loadReferralSettings } from '@/lib/referral';
import { prisma } from '@/lib/prisma';

// GET /api/referral - Get user's referral info and stats
export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user has referral code
    const referralCode = await ensureReferralCode(session.user.id);

    // Get referral stats
    const stats = await getReferralStats(session.user.id);

    // Get referral settings
    const settings = await loadReferralSettings();

    // Get referrals list
    const referrals = await prisma.referral.findMany({
      where: { referrerId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        referee: {
          select: { email: true, createdAt: true },
        },
      },
    });

    return NextResponse.json({
      referralCode,
      stats,
      settings,
      referrals,
    });
  } catch (error) {
    console.error('Error fetching referral info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral info' },
      { status: 500 }
    );
  }
}
