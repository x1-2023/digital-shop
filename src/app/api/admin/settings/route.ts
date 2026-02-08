import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateSettingsSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user || ((session.(user.role !== 'ADMIN' && user.role !== 'OWNER') && session.user.role !== 'OWNER') && session.user.role !== 'OWNER')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const settings = await prisma.settings.findUnique({
      where: { id: 'singleton' },
    });

    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    return NextResponse.json({
      settings: {
        paymentMethods: settings.paymentMethods,
        bankInfo: settings.bankInfo,
        topupRules: settings.topupRules,
        tpbankConfig: settings.tpbankConfig,
        uiTexts: settings.uiTexts,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user || ((session.(user.role !== 'ADMIN' && user.role !== 'OWNER') && session.user.role !== 'OWNER') && session.user.role !== 'OWNER')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateSettingsSchema.parse(body);

    // Convert objects to JSON strings for database storage
    const dataToStore: any = {};
    if (validatedData.paymentMethods) dataToStore.paymentMethods = JSON.stringify(validatedData.paymentMethods);
    if (validatedData.bankInfo) dataToStore.bankInfo = JSON.stringify(validatedData.bankInfo);
    if (validatedData.topupRules) dataToStore.topupRules = JSON.stringify(validatedData.topupRules);
    if (validatedData.tpbankConfig) dataToStore.tpbankConfig = JSON.stringify(validatedData.tpbankConfig);
    if (validatedData.uiTexts) dataToStore.uiTexts = JSON.stringify(validatedData.uiTexts);

    const settings = await prisma.settings.upsert({
      where: { id: 'singleton' },
      update: {
        ...dataToStore,
        updatedAt: new Date(),
      },
      create: {
        id: 'singleton',
        ...dataToStore,
      },
    });

    // Log admin action
    await prisma.adminActionLog.create({
      data: {
        adminId: session.user.id,
        action: 'update_settings',
        targetType: 'Settings',
        targetId: 'singleton',
        diffJson: JSON.stringify(validatedData),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        paymentMethods: settings.paymentMethods,
        bankInfo: settings.bankInfo,
        topupRules: settings.topupRules,
        tpbankConfig: settings.tpbankConfig,
        uiTexts: settings.uiTexts,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update settings error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



