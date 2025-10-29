import { NextRequest, NextResponse } from 'next/server';
import { loadBankConfigs, GenericBankAPI } from '@/lib/generic-bank-api';
import { processAutoTopup, updateLastChecked } from '@/lib/auto-topup';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'change-this-secret';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron] Starting bank transaction check...');

    // Load all bank configurations
    const configs = await loadBankConfigs();
    const enabledConfigs = configs.filter(c => c.enabled);

    if (enabledConfigs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No enabled bank configurations',
        processed: 0,
      });
    }

    console.log(`[Cron] Found ${enabledConfigs.length} enabled bank(s)`);

    // Process each bank
    let totalProcessed = 0;
    let totalFailed = 0;
    let totalTransactions = 0;
    const allDetails: any[] = [];

    for (const config of enabledConfigs) {
      try {
        console.log(`[Cron] Checking ${config.name}...`);

        const bankAPI = new GenericBankAPI(config);
        const transactions = await bankAPI.fetchTransactions();

        console.log(`[Cron] ${config.name}: Found ${transactions.length} transactions`);

        if (transactions.length > 0) {
          const result = await processAutoTopup(transactions, config.name);

          totalProcessed += result.processed;
          totalFailed += result.failed;
          totalTransactions += transactions.length;

          allDetails.push({
            bank: config.name,
            transactions: transactions.length,
            processed: result.processed,
            failed: result.failed,
            details: result.details,
          });

          console.log(
            `[Cron] ${config.name}: Processed ${result.processed}, Failed ${result.failed}`
          );
        }
      } catch (bankError) {
        console.error(`[Cron] Error processing ${config.name}:`, bankError);
        allDetails.push({
          bank: config.name,
          error: bankError instanceof Error ? bankError.message : 'Unknown error',
        });
      }
    }

    await updateLastChecked();

    return NextResponse.json({
      success: true,
      banksChecked: enabledConfigs.length,
      totalTransactions,
      processed: totalProcessed,
      failed: totalFailed,
      details: allDetails,
    });

  } catch (error) {
    console.error('[Cron] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check bank transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
