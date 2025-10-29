import { NextResponse } from 'next/server';
import { processAllBanks } from '@/lib/auto-topup';

/**
 * Manual trigger endpoint for auto-topup processing
 * Can be called by external cron services or for testing
 */
export async function GET() {
  try {
    console.log('[API] Manual auto-topup trigger');

    const result = await processAllBanks();

    return NextResponse.json({
      success: result.success,
      message: `Processed ${result.processed} transactions, ${result.failed} failed`,
      details: result.details,
    });
  } catch (error) {
    console.error('[API] Auto-topup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
