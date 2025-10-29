'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface FooterSettings {
  copyrightYear: string;
  supportEmail: string;
  contactInfo: string;
}

export function Footer() {
  const [settings, setSettings] = useState<FooterSettings>({
    copyrightYear: new Date().getFullYear().toString(),
    supportEmail: 'support@webmmo.com',
    contactInfo: '',
  });

  useEffect(() => {
    // Fetch settings from public API
    fetch('/api/settings/public')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setSettings({
            copyrightYear: data.settings.copyrightYear || new Date().getFullYear().toString(),
            supportEmail: data.settings.supportEmail || 'support@webmmo.com',
            contactInfo: data.settings.contactInfo || '',
          });
        }
      })
      .catch(err => console.error('Failed to load footer settings:', err));
  }, []);

  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center">
                <span className="text-white font-bold text-sm">WM</span>
              </div>
              <span className="font-bold text-xl text-text-primary">WebMMO</span>
            </div>
            <p className="text-sm text-text-muted">
              Cửa hàng tài nguyên số, app, license với thanh toán ví nội bộ
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-text-primary">Liên kết nhanh</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products" className="text-text-muted hover:text-text-primary transition-colors">
                  Sản phẩm
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-text-muted hover:text-text-primary transition-colors">
                  Giới thiệu
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-text-muted hover:text-text-primary transition-colors">
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-semibold text-text-primary">Hỗ trợ</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help" className="text-text-muted hover:text-text-primary transition-colors">
                  Trung tâm trợ giúp
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-text-muted hover:text-text-primary transition-colors">
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-text-muted hover:text-text-primary transition-colors">
                  Điều khoản sử dụng
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-text-primary">Liên hệ</h3>
            <div className="space-y-2 text-sm text-text-muted">
              <p>Email: {settings.supportEmail}</p>
              {settings.contactInfo && (
                <p className="whitespace-pre-line">{settings.contactInfo}</p>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-text-muted">
          <p>&copy; {settings.copyrightYear} WebMMO. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
