import { prisma } from './prisma';

export interface WebsiteSettings {
  websiteName: string;
  websiteTitle: string;
  websiteDescription: string;
  websiteKeywords: string;
  websiteLogo: string | null;
  websiteFavicon: string | null;
  copyrightYear: string;
  supportEmail: string;
  contactInfo: string;
  themeSettings: {
    primaryColor: string;
    darkMode: boolean;
    sidebarColor: string;
    headerColor: string;
  };
}

// Cache settings for 5 minutes
let cachedSettings: WebsiteSettings | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getWebsiteSettings(): Promise<WebsiteSettings> {
  // Return cached settings if still valid
  if (cachedSettings && Date.now() - cacheTime < CACHE_DURATION) {
    return cachedSettings;
  }

  try {
    const settings = await prisma.settings.findUnique({
      where: { id: 'singleton' },
    });

    if (!settings) {
      // Return defaults if no settings found
      return getDefaultSettings();
    }

    const websiteSettings: WebsiteSettings = {
      websiteName: settings.websiteName || process.env.NEXT_PUBLIC_SITE_NAME || 'Digital Shop',
      websiteTitle: settings.websiteTitle || 'Digital Shop - Premium Digital Products',
      websiteDescription: settings.websiteDescription || 'Premium digital products and services',
      websiteKeywords: settings.websiteKeywords || 'digital products, premium, shop',
      websiteLogo: settings.websiteLogo,
      websiteFavicon: settings.websiteFavicon,
      copyrightYear: settings.copyrightYear || new Date().getFullYear().toString(),
      supportEmail: settings.supportEmail || process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@example.com',
      contactInfo: settings.contactInfo || '',
      themeSettings: JSON.parse(settings.themeSettings || '{"primaryColor":"#3b82f6","darkMode":true,"sidebarColor":"#1f2937","headerColor":"#111827"}'),
    };

    // Update cache
    cachedSettings = websiteSettings;
    cacheTime = Date.now();

    return websiteSettings;
  } catch (error) {
    console.error('Error loading website settings:', error);
    return getDefaultSettings();
  }
}

function getDefaultSettings(): WebsiteSettings {
  return {
    websiteName: process.env.NEXT_PUBLIC_SITE_NAME || 'Digital Shop',
    websiteTitle: 'Digital Shop - Premium Digital Products',
    websiteDescription: 'Premium digital products and services',
    websiteKeywords: 'digital products, premium, shop',
    websiteLogo: null,
    websiteFavicon: null,
    copyrightYear: new Date().getFullYear().toString(),
    supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@example.com',
    contactInfo: '',
    themeSettings: {
      primaryColor: '#3b82f6',
      darkMode: true,
      sidebarColor: '#1f2937',
      headerColor: '#111827',
    },
  };
}

// Clear cache (call this after updating settings)
export function clearWebsiteSettingsCache() {
  cachedSettings = null;
  cacheTime = 0;
}
