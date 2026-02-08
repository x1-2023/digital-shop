import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { clearWebsiteSettingsCache } from '@/lib/website-settings';
import { z } from 'zod';

const websiteSettingsSchema = z.object({
  websiteName: z.string().optional(),
  websiteTitle: z.string().optional(),
  websiteDescription: z.string().optional(),
  websiteKeywords: z.string().optional(),
  websiteLogo: z.string().nullable().optional(),
  websiteFavicon: z.string().nullable().optional(),
  copyrightYear: z.string().optional(),
  supportEmail: z.string().optional(),
  contactInfo: z.string().optional(),
  paymentMethods: z.object({
    manual: z.boolean().optional(),
    tpbank: z.boolean().optional(),
    momo: z.boolean().optional(),
    crypto: z.boolean().optional(),
  }).optional(),
  bankInfo: z.object({
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    accountHolder: z.string().optional(),
    instructions: z.string().optional(),
  }).optional(),
  topupRules: z.object({
    minVnd: z.number().optional(),
    maxVnd: z.number().optional(),
  }).optional(),
  tpbankConfig: z.object({
    enabled: z.boolean().optional(),
    apiUrl: z.string().optional(),
    token: z.string().optional(),
    amountTolerance: z.number().optional(),
  }).optional(),
  uiTexts: z.object({
    welcomeMessage: z.string().optional(),
    footerText: z.string().optional(),
    contactEmail: z.string().optional(),
    contactPhone: z.string().optional(),
  }).optional(),
  themeSettings: z.object({
    primaryColor: z.string().optional(),
    darkMode: z.boolean().optional(),
    sidebarColor: z.string().optional(),
    headerColor: z.string().optional(),
  }).optional(),
});

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session?.user || ((session.(user.role !== 'ADMIN' && user.role !== 'OWNER') && session.user.role !== 'OWNER') && session.user.role !== 'OWNER')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const settings = await prisma.settings.findUnique({
      where: { id: 'singleton' },
    });

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      settings: {
        paymentMethods: JSON.parse(settings.paymentMethods || '{"manual":true,"tpbank":false,"momo":false,"crypto":false}'),
        bankInfo: JSON.parse(settings.bankInfo || '{"bankName":"","accountNumber":"","accountHolder":"","instructions":""}'),
        topupRules: JSON.parse(settings.topupRules || '{"minVnd":10000,"maxVnd":10000000}'),
        tpbankConfig: JSON.parse(settings.tpbankConfig || '{"enabled":false,"apiUrl":"","token":"","amountTolerance":1000}'),
        uiTexts: JSON.parse(settings.uiTexts || '{"welcomeMessage":"","footerText":"","contactEmail":"","contactPhone":""}'),
        themeSettings: JSON.parse(settings.themeSettings),
        websiteName: settings.websiteName,
        websiteTitle: settings.websiteTitle,
        websiteDescription: settings.websiteDescription,
        websiteKeywords: settings.websiteKeywords,
        websiteLogo: settings.websiteLogo,
        websiteFavicon: settings.websiteFavicon,
        copyrightYear: settings.copyrightYear,
        supportEmail: settings.supportEmail,
        contactInfo: settings.contactInfo,
      },
    });
  } catch (error) {
    console.error('Error fetching website settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user || ((session.(user.role !== 'ADMIN' && user.role !== 'OWNER') && session.user.role !== 'OWNER') && session.user.role !== 'OWNER')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = websiteSettingsSchema.parse(body);

    const updateData: any = {};
    
    if (validatedData.websiteName) updateData.websiteName = validatedData.websiteName;
    if (validatedData.websiteTitle) updateData.websiteTitle = validatedData.websiteTitle;
    if (validatedData.websiteDescription) updateData.websiteDescription = validatedData.websiteDescription;
    if (validatedData.websiteKeywords) updateData.websiteKeywords = validatedData.websiteKeywords;
    if (validatedData.websiteLogo !== undefined) updateData.websiteLogo = validatedData.websiteLogo;
    if (validatedData.websiteFavicon !== undefined) updateData.websiteFavicon = validatedData.websiteFavicon;
    if (validatedData.copyrightYear) updateData.copyrightYear = validatedData.copyrightYear;
    if (validatedData.supportEmail) updateData.supportEmail = validatedData.supportEmail;
    if (validatedData.contactInfo !== undefined) updateData.contactInfo = validatedData.contactInfo;
    if (validatedData.paymentMethods) updateData.paymentMethods = JSON.stringify(validatedData.paymentMethods);
    if (validatedData.bankInfo) updateData.bankInfo = JSON.stringify(validatedData.bankInfo);
    if (validatedData.topupRules) updateData.topupRules = JSON.stringify(validatedData.topupRules);
    if (validatedData.tpbankConfig) updateData.tpbankConfig = JSON.stringify(validatedData.tpbankConfig);
    if (validatedData.uiTexts) updateData.uiTexts = JSON.stringify(validatedData.uiTexts);
    if (validatedData.themeSettings) updateData.themeSettings = JSON.stringify(validatedData.themeSettings);
    
    updateData.updatedAt = new Date();

    const updatedSettings = await prisma.settings.update({
      where: { id: 'singleton' },
      data: updateData,
    });

    // Clear cache so changes are reflected immediately
    clearWebsiteSettingsCache();

    return NextResponse.json({
      success: true,
      settings: {
        paymentMethods: JSON.parse(updatedSettings.paymentMethods || '{}'),
        bankInfo: JSON.parse(updatedSettings.bankInfo || '{}'),
        topupRules: JSON.parse(updatedSettings.topupRules || '{}'),
        tpbankConfig: JSON.parse(updatedSettings.tpbankConfig || '{}'),
        uiTexts: JSON.parse(updatedSettings.uiTexts || '{}'),
        themeSettings: JSON.parse(updatedSettings.themeSettings),
        websiteName: updatedSettings.websiteName,
        websiteTitle: updatedSettings.websiteTitle,
        websiteDescription: updatedSettings.websiteDescription,
        websiteKeywords: updatedSettings.websiteKeywords,
        websiteLogo: updatedSettings.websiteLogo,
        websiteFavicon: updatedSettings.websiteFavicon,
        copyrightYear: updatedSettings.copyrightYear,
        supportEmail: updatedSettings.supportEmail,
        contactInfo: updatedSettings.contactInfo,
      },
    });
  } catch (error) {
    console.error('Error updating website settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user || ((session.(user.role !== 'ADMIN' && user.role !== 'OWNER') && session.user.role !== 'OWNER') && session.user.role !== 'OWNER')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = websiteSettingsSchema.parse(body);

    const updatedSettings = await prisma.settings.update({
      where: { id: 'singleton' },
      data: {
        websiteName: validatedData.websiteName,
        websiteTitle: validatedData.websiteTitle,
        websiteDescription: validatedData.websiteDescription,
        websiteKeywords: validatedData.websiteKeywords,
        websiteLogo: validatedData.websiteLogo,
        websiteFavicon: validatedData.websiteFavicon,
        copyrightYear: validatedData.copyrightYear,
        supportEmail: validatedData.supportEmail,
        contactInfo: validatedData.contactInfo,
        themeSettings: JSON.stringify(validatedData.themeSettings),
        updatedAt: new Date(),
      },
    });

    // Clear cache so changes are reflected immediately
    clearWebsiteSettingsCache();

    return NextResponse.json({
      success: true,
      data: {
        websiteName: updatedSettings.websiteName,
        websiteTitle: updatedSettings.websiteTitle,
        websiteDescription: updatedSettings.websiteDescription,
        websiteKeywords: updatedSettings.websiteKeywords,
        websiteLogo: updatedSettings.websiteLogo,
        websiteFavicon: updatedSettings.websiteFavicon,
        copyrightYear: updatedSettings.copyrightYear,
        supportEmail: updatedSettings.supportEmail,
        contactInfo: updatedSettings.contactInfo,
        themeSettings: JSON.parse(updatedSettings.themeSettings),
      },
    });
  } catch (error) {
    console.error('Error updating website settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
