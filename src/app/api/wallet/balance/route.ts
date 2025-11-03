import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
      select: { balanceVnd: true },
    });

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    return NextResponse.json({
      balance: wallet.balanceVnd,
      currency: 'VND',
    });
  } catch (error) {
    console.error('Wallet balance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
