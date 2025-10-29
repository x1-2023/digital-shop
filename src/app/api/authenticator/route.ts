import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const twoFactorAccountSchema = z.object({
  name: z.string().min(1, 'Tên không được để trống'),
  issuer: z.string().min(1, 'Issuer không được để trống'),
  secret: z.string().min(16, 'Secret phải có ít nhất 16 ký tự'),
});

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accounts = await prisma.twoFactorAccount.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        issuer: true,
        secret: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Error fetching 2FA accounts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = twoFactorAccountSchema.parse(body);

    const account = await prisma.twoFactorAccount.create({
      data: {
        userId: session.user.id,
        name: validatedData.name,
        issuer: validatedData.issuer,
        secret: validatedData.secret,
      },
    });

    return NextResponse.json({ 
      success: true,
      account: {
        id: account.id,
        name: account.name,
        issuer: account.issuer,
        secret: account.secret,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error('Error creating 2FA account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Check if account belongs to user
    const account = await prisma.twoFactorAccount.findUnique({
      where: { id },
    });

    if (!account || account.userId !== session.user.id) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    await prisma.twoFactorAccount.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting 2FA account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
