'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Send, Mail, Clock, MapPin, Shield, Zap, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FooterSettings {
  copyrightYear: string;
  supportEmail: string;
  contactInfo: string;
  telegramUrl: string;
  telegramHandle: string;
  workingHours: string;
  address: string;
}

export function Footer() {
  const [settings, setSettings] = useState<FooterSettings>({
    copyrightYear: new Date().getFullYear().toString(),
    supportEmail: 'support@webmmo.com',
    contactInfo: '',
    telegramUrl: process.env.NEXT_PUBLIC_TELEGRAM_URL || 'https://t.me/webmmo',
    telegramHandle: '@webmmo_support',
    workingHours: '8:00 AM - 12:00 PM',
    address: 'Ha Noi, Viet Nam',
  });

  useEffect(() => {
    fetch('/api/settings/public')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setSettings(prev => ({
            ...prev,
            copyrightYear: data.settings.copyrightYear || new Date().getFullYear().toString(),
            supportEmail: data.settings.supportEmail || 'support@webmmo.com',
            contactInfo: data.settings.contactInfo || '',
          }));
        }
      })
      .catch(err => console.error('Failed to load footer settings:', err));
  }, []);

  return (
    <footer className="bg-background">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="border border-border rounded-2xl overflow-hidden bg-card">
          <div className="px-6 py-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

              {/* Column 1: Brand & Description */}
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center">
                    <span className="text-white font-bold text-sm">W</span>
                  </div>
                  <span className="text-xl">
                    <span className="text-brand font-bold">Web</span>
                    <span className="text-text-primary font-semibold">mmo</span>
                  </span>
                </div>

                <p className="text-sm text-text-muted leading-relaxed">
                  Nền tảng trung gian giao dịch & ủy quyền truy cập số. Kết nối người mua và người bán một cách minh bạch & an toàn.
                </p>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs text-text-muted hover:border-brand hover:text-brand transition-colors cursor-default">
                    <Shield className="w-3.5 h-3.5" />
                    Legit
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs text-text-muted hover:border-brand hover:text-brand transition-colors cursor-default">
                    <Zap className="w-3.5 h-3.5" />
                    Giao dịch tự động
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs text-brand hover:bg-brand/10 transition-colors cursor-default">
                    <Send className="w-3.5 h-3.5" />
                    Hỗ trợ Telegram
                  </span>
                </div>
              </div>

              {/* Column 2: Support Center */}
              <div className="space-y-5">
                <h3 className="font-semibold text-text-primary uppercase tracking-wide text-sm">
                  Trung tâm hỗ trợ
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                      <Send className="w-4 h-4 text-brand" />
                    </div>
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wide">Telegram Support</p>
                      <a href={settings.telegramUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-brand hover:underline">
                        {settings.telegramHandle}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wide">Email</p>
                      <a href={`mailto:${settings.supportEmail}`} className="text-sm text-text-primary hover:text-brand transition-colors">
                        {settings.supportEmail}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wide">Giờ làm việc</p>
                      <p className="text-sm text-text-primary">{settings.workingHours}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wide">Địa chỉ</p>
                      <p className="text-sm text-brand">{settings.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 3: Quick Links */}
              <div className="space-y-5">
                <h3 className="font-semibold text-text-primary uppercase tracking-wide text-sm">
                  Liên kết nhanh
                </h3>

                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <Link href="/policy" className="text-sm text-text-muted hover:text-text-primary transition-colors">
                    Chính sách
                  </Link>
                  <Link href="/terms" className="text-sm text-text-muted hover:text-text-primary transition-colors">
                    Điều khoản
                  </Link>
                  <Link href="/faq" className="text-sm text-text-muted hover:text-text-primary transition-colors">
                    Câu hỏi thường gặp
                  </Link>
                  <Link href="/contact" className="text-sm text-text-muted hover:text-text-primary transition-colors">
                    Liên hệ
                  </Link>
                  <Link href="/api-docs" className="text-sm text-text-muted hover:text-text-primary transition-colors">
                    Tài liệu API
                  </Link>
                  <Link href="/deposit" className="text-sm text-text-muted hover:text-text-primary transition-colors">
                    Nạp tiền
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Telegram Support Banner */}
      <div className="container mx-auto px-4 pb-6">
        <div className="bg-brand rounded-2xl px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h4 className="text-lg font-semibold text-white">
                Cần hỗ trợ trong quá trình sử dụng?
              </h4>
              <p className="text-sm text-white/80">
                Chat Telegram với đội ngũ WebMMO để được hướng dẫn và xử lý các vấn đề liên quan đến nền tảng.
              </p>
            </div>
            <Button asChild variant="secondary" className="bg-white text-brand hover:bg-white/90 font-medium shrink-0">
              <a href={settings.telegramUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat ngay trên Telegram
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <p className="text-text-muted">
              © {settings.copyrightYear} <span className="text-brand font-medium">WebMMO</span>. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-brand hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-brand hover:underline">
                Terms of Service
              </Link>
              <Link href="/contact" className="text-brand hover:underline">
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
