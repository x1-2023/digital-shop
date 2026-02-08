import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { loadReferralSettings, saveReferralSettings } from '@/lib/referral';

// GET /api/admin/referrals - Get referral settings and stats
export async function GET() {
  try {
    const session = await getSession();

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get settings
    const settings = await loadReferralSettings();

    // Get stats
    const [
      totalReferrals,
      activeReferrals,
      pendingReferrals,
      totalRewardsPaidVnd,
    ] = await Promise.all([
      prisma.referral.count(),
      prisma.referral.count({ where: { rewardPaid: true } }),
      prisma.referral.count({ where: { rewardPaid: false } }),
      prisma.referral.aggregate({
        where: { rewardPaid: true },
        _sum: {
          referrerRewardVnd: true,
          refereeRewardVnd: true,
        },
      }),
    ]);

    // Get recent referrals
    const recentReferrals = await prisma.referral.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        referrer: {
          select: { id: true, email: true, referralCode: true },
        },
        referee: {
          select: { id: true, email: true },
        },
      },
    });

    // Get top referrers
    const topReferrers = await prisma.referral.groupBy({
      by: ['referrerId'],
      _count: { referrerId: true },
      _sum: { referrerRewardVnd: true },
      where: { rewardPaid: true },
      orderBy: { _count: { referrerId: 'desc' } },
      take: 10,
    });

    const topReferrersWithInfo = await Promise.all(
      topReferrers.map(async (item) => {
        const user = await prisma.user.findUnique({
          where: { id: item.referrerId },
          select: { email: true, referralCode: true },
        });
        return {
          userId: item.referrerId,
          email: user?.email,
          referralCode: user?.referralCode,
          count: item._count.referrerId,
          totalRewardsVnd: item._sum.referrerRewardVnd || 0,
        };
      })
    );

    return NextResponse.json({
      settings,
      stats: {
        totalReferrals,
        activeReferrals,
        pendingReferrals,
        totalRewardsPaidVnd:
          (totalRewardsPaidVnd._sum.referrerRewardVnd || 0) +
          (totalRewardsPaidVnd._sum.refereeRewardVnd || 0),
      },
      recentReferrals,
      topReferrers: topReferrersWithInfo,
    });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referrals' },
      { status: 500 }
    );
  }
}

// POST /api/admin/referrals - Update referral settings
export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      enabled,
      referrerRewardPercent,
      maxReferrerRewardPerTransactionVnd,
    } = body;

    // Validation
    if (referrerRewardPercent < 0 || referrerRewardPercent > 100) {
      return NextResponse.json(
        { error: 'Reward percent must be between 0 and 100' },
        { status: 400 }
      );
    }

    if (maxReferrerRewardPerTransactionVnd < 0) {
      return NextResponse.json(
        { error: 'Max reward amount must be positive' },
        { status: 400 }
      );
    }

    await saveReferralSettings({
      enabled,
      referrerRewardPercent,
      maxReferrerRewardPerTransactionVnd,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving referral settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
