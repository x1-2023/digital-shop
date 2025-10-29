import { NextResponse } from 'next/server';
import { getWebsiteSettings } from '@/lib/website-settings';

// Public endpoint to fetch website settings (no auth required)
export async function GET() {
  try {
    const settings = await getWebsiteSettings();

    return NextResponse.json({
      success: true,
      settings: {
        websiteName: settings.websiteName,
        websiteLogo: settings.websiteLogo,
        websiteFavicon: settings.websiteFavicon,
        themeSettings: settings.themeSettings,
        copyrightYear: settings.copyrightYear,
        supportEmail: settings.supportEmail,
        contactInfo: settings.contactInfo,
      },
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return NextResponse.json(
      { error: 'Failed to load settings' },
      { status: 500 }
    );
  }
}
