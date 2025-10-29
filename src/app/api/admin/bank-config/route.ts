import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { loadBankConfigs, saveBankConfigs, type BankAPIConfig } from '@/lib/generic-bank-api';

/**
 * GET /api/admin/bank-config
 * Load all bank API configurations
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const configs = await loadBankConfigs();

    return NextResponse.json({ configs });
  } catch (error) {
    console.error('[API] Error loading bank configs:', error);
    return NextResponse.json(
      { error: 'Failed to load bank configs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/bank-config
 * Save bank API configurations
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { configs } = body as { configs: BankAPIConfig[] };

    if (!Array.isArray(configs)) {
      return NextResponse.json(
        { error: 'Invalid configs format' },
        { status: 400 }
      );
    }

    // Validate each config
    for (const config of configs) {
      if (!config.id || !config.name || !config.apiUrl) {
        return NextResponse.json(
          { error: 'Missing required fields in config' },
          { status: 400 }
        );
      }

      if (!config.fieldMapping?.transactionsPath || !config.fieldMapping?.fields) {
        return NextResponse.json(
          { error: 'Missing field mapping configuration' },
          { status: 400 }
        );
      }
    }

    await saveBankConfigs(configs);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error saving bank configs:', error);
    return NextResponse.json(
      { error: 'Failed to save bank configs' },
      { status: 500 }
    );
  }
}
