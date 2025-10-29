import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/session-provider";
import { getWebsiteSettings } from "@/lib/website-settings";

// Force dynamic rendering to prevent static generation errors with client components
export const dynamic = 'force-dynamic';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getWebsiteSettings();

  return {
    title: settings.websiteTitle,
    description: settings.websiteDescription,
    keywords: settings.websiteKeywords.split(',').map(k => k.trim()),
    authors: [{ name: settings.websiteName }],
    icons: settings.websiteFavicon ? {
      icon: settings.websiteFavicon,
      shortcut: settings.websiteFavicon,
      apple: settings.websiteFavicon,
    } : undefined,
    openGraph: {
      title: settings.websiteName,
      description: settings.websiteDescription,
      type: "website",
      locale: "vi_VN",
      images: settings.websiteLogo ? [settings.websiteLogo] : undefined,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
