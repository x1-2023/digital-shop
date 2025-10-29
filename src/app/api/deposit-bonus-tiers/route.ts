import { NextResponse } from 'next/server';
import { getDepositBonusTiers } from '@/lib/deposit-bonus';

/**
 * GET /api/deposit-bonus-tiers
 * Public API - Get deposit bonus tiers for display to users
 */
export async function GET() {
  try {
    const tiers = await getDepositBonusTiers();

    return NextResponse.json({
      tiers,
      enabled: tiers.length > 0,
    });
  } catch (error) {
    console.error('[API] Error fetching deposit bonus tiers:', error);
    return NextResponse.json(
      { tiers: [], enabled: false },
      { status: 500 }
    );
  }
}
