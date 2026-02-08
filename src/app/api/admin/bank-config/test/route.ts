import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { GenericBankAPI, type BankAPIConfig } from '@/lib/generic-bank-api';

/**
 * POST /api/admin/bank-config/test
 * Test bank API connection with provided configuration
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { config } = body as { config: Partial<BankAPIConfig> };

    // Validate required fields
    if (!config.apiUrl) {
      return NextResponse.json(
        { success: false, error: 'API URL is required' },
        { status: 400 }
      );
    }

    if (!config.fieldMapping?.transactionsPath) {
      return NextResponse.json(
        { success: false, error: 'Transactions path is required' },
        { status: 400 }
      );
    }

    // Create a temporary config for testing
    const testConfig: BankAPIConfig = {
      id: 'test',
      name: config.name || 'Test',
      enabled: true,
      apiUrl: config.apiUrl,
      method: config.method || 'GET',
      headers: config.headers,
      fieldMapping: config.fieldMapping as BankAPIConfig['fieldMapping'],
      filters: config.filters || {
        onlyCredit: true,
        creditIndicator: {
          field: 'debitAmount',
          value: '0',
          condition: 'equals',
        },
      },
      credentials: config.credentials,
    };

    // Test the API connection
    const bankAPI = new GenericBankAPI(testConfig);

    try {
      const transactions = await bankAPI.fetchTransactions();

      return NextResponse.json({
        success: true,
        count: transactions.length,
        message: `Successfully connected! Found ${transactions.length} transactions.`,
        sample: transactions.slice(0, 3), // Return first 3 transactions as sample
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (apiError: any) {
      console.error('[API] Bank API test error:', apiError);

      return NextResponse.json({
        success: false,
        error: apiError.message || 'Failed to connect to bank API',
        details: {
          url: testConfig.apiUrl,
          method: testConfig.method,
          message: apiError.message,
        },
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('[API] Error testing bank config:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
