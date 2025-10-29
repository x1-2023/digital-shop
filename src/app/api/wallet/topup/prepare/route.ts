import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateDepositQRCode } from '@/lib/qr-code';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amountVnd } = body;

    if (!amountVnd || amountVnd <= 0) {
      return NextResponse.json(
        { error: 'Số tiền không hợp lệ' },
        { status: 400 }
      );
    }

    // Get settings for validation and bank info
    const settings = await prisma.settings.findUnique({
      where: { id: 'singleton' },
    });

    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 500 });
    }

    const topupRules = JSON.parse(settings.topupRules || '{}') as { minVnd: number; maxVnd: number };
    const bankInfo = JSON.parse(settings.bankInfo || '{}') as { 
      bankName: string; 
      accountNumber: string; 
      accountHolder: string;
      bank?: string;
      account?: string;
      name?: string;
    };

    // Validate amount
    if (amountVnd < (topupRules.minVnd || 10000) || amountVnd > (topupRules.maxVnd || 100000000)) {
      return NextResponse.json(
        { 
          error: `Số tiền phải từ ${(topupRules.minVnd || 10000).toLocaleString('vi-VN')} đến ${(topupRules.maxVnd || 100000000).toLocaleString('vi-VN')} VND`,
          code: 'INVALID_AMOUNT',
        },
        { status: 400 }
      );
    }

    // Generate QR code and transfer content
    const { qrCode, transferContent } = await generateDepositQRCode(
      session.user.id,
      amountVnd,
      {
        bank: bankInfo.bank || bankInfo.bankName || 'BANK',
        account: bankInfo.account || bankInfo.accountNumber || '',
        name: bankInfo.name || bankInfo.accountHolder || '',
      }
    );

    return NextResponse.json({
      success: true,
      qrCode,
      transferContent,
      bankInfo: {
        bankName: bankInfo.bankName || bankInfo.bank || '',
        accountNumber: bankInfo.accountNumber || bankInfo.account || '',
        accountHolder: bankInfo.accountHolder || bankInfo.name || '',
      },
    });
  } catch (error) {
    console.error('Prepare topup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
