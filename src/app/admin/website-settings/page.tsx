'use client';

import { useState, useEffect } from 'react';
// import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, RefreshCw, Globe, Palette, Image as ImageIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';

interface WebsiteSettings {
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

export default function WebsiteSettingsPage() {
  const [settings, setSettings] = useState<WebsiteSettings>({
    websiteName: '',
    websiteTitle: '',
    websiteDescription: '',
    websiteKeywords: '',
    websiteLogo: null,
    websiteFavicon: null,
    copyrightYear: new Date().getFullYear().toString(),
    supportEmail: '',
    contactInfo: '',
    themeSettings: {
      primaryColor: '#3b82f6',
      darkMode: true,
      sidebarColor: '#1f2937',
      headerColor: '#111827',
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/website-settings');
      const data = await response.json();

      if (response.ok && data.settings) {
        // Convert from API format to component format
        setSettings({
          websiteName: data.settings.websiteName || '',
          websiteTitle: data.settings.websiteTitle || '',
          websiteDescription: data.settings.websiteDescription || '',
          websiteKeywords: data.settings.websiteKeywords || '',
          websiteLogo: data.settings.websiteLogo,
          websiteFavicon: data.settings.websiteFavicon,
          copyrightYear: data.settings.copyrightYear || new Date().getFullYear().toString(),
          supportEmail: data.settings.supportEmail || '',
          contactInfo: data.settings.contactInfo || '',
          themeSettings: data.settings.themeSettings || {
            primaryColor: '#3b82f6',
            darkMode: true,
            sidebarColor: '#1f2937',
            headerColor: '#111827',
          },
        });
      } else {
        toast({
          title: 'Lỗi',
          description: data.error || 'Không thể tải cài đặt website',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Lỗi',
        description: 'Có lỗi xảy ra khi tải cài đặt',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/website-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Thành công',
          description: 'Cài đặt website đã được lưu',
        });
      } else {
        toast({
          title: 'Lỗi',
          description: data.error || 'Không thể lưu cài đặt',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Lỗi',
        description: 'Có lỗi xảy ra khi lưu cài đặt',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'favicon') => {
    setUploading(type);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setSettings(prev => ({
          ...prev,
          [type === 'logo' ? 'websiteLogo' : 'websiteFavicon']: data.data.url,
        }));
        toast({
          title: 'Thành công',
          description: `${type === 'logo' ? 'Logo' : 'Favicon'} đã được tải lên`,
        });
      } else {
        toast({
          title: 'Lỗi',
          description: data.error || 'Không thể tải lên file',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Lỗi',
        description: 'Có lỗi xảy ra khi tải lên file',
        variant: 'destructive',
      });
    } finally {
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Cài đặt Website</h1>
            <p className="text-muted-foreground">
              Quản lý logo, tiêu đề và giao diện website
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Lưu cài đặt
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">
              <Globe className="h-4 w-4 mr-2" />
              Thông tin chung
            </TabsTrigger>
            <TabsTrigger value="branding">
              <ImageIcon className="h-4 w-4 mr-2" />
              Logo & Favicon
            </TabsTrigger>
            <TabsTrigger value="theme">
              <Palette className="h-4 w-4 mr-2" />
              Giao diện
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin Website</CardTitle>
                <CardDescription>
                  Cài đặt tên, tiêu đề và mô tả website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="websiteName">Tên Website</Label>
                  <Input
                    id="websiteName"
                    value={settings.websiteName}
                    onChange={(e) => setSettings(prev => ({ ...prev, websiteName: e.target.value }))}
                    placeholder="Digital Shop"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="websiteTitle">Tiêu đề Website</Label>
                  <Input
                    id="websiteTitle"
                    value={settings.websiteTitle}
                    onChange={(e) => setSettings(prev => ({ ...prev, websiteTitle: e.target.value }))}
                    placeholder="Digital Shop - Premium Digital Products"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="websiteDescription">Mô tả Website</Label>
                  <Textarea
                    id="websiteDescription"
                    value={settings.websiteDescription}
                    onChange={(e) => setSettings(prev => ({ ...prev, websiteDescription: e.target.value }))}
                    placeholder="Mô tả về website của bạn..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="websiteKeywords">Từ khóa SEO</Label>
                  <Textarea
                    id="websiteKeywords"
                    value={settings.websiteKeywords}
                    onChange={(e) => setSettings(prev => ({ ...prev, websiteKeywords: e.target.value }))}
                    placeholder="digital products, premium, shop"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Thông tin Footer</CardTitle>
                <CardDescription>
                  Cài đặt thông tin liên hệ và copyright hiển thị ở footer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="copyrightYear">Năm Copyright</Label>
                  <Input
                    id="copyrightYear"
                    value={settings.copyrightYear}
                    onChange={(e) => setSettings(prev => ({ ...prev, copyrightYear: e.target.value }))}
                    placeholder="2025"
                  />
                  <p className="text-xs text-muted-foreground">
                    Năm hiển thị trong footer (ví dụ: © 2025 WebMMO)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Email Hỗ Trợ</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                    placeholder="support@webmmo.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email liên hệ hiển thị trong footer
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactInfo">Thông Tin Liên Hệ</Label>
                  <Textarea
                    id="contactInfo"
                    value={settings.contactInfo}
                    onChange={(e) => setSettings(prev => ({ ...prev, contactInfo: e.target.value }))}
                    placeholder="Địa chỉ, số điện thoại, hoặc thông tin khác"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Thông tin liên hệ bổ sung (nếu cần)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Logo Website</CardTitle>
                  <CardDescription>
                    Tải lên logo cho website (PNG, JPG, SVG)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {settings.websiteLogo && (
                    <div className="space-y-2">
                      <Label>Logo hiện tại:</Label>
                      <div className="relative">
                        <Image
                          src={settings.websiteLogo}
                          alt="Current logo"
                          width={80}
                          height={80}
                          unoptimized
                          className="h-20 w-auto object-contain border rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <span className="hidden text-4xl">🖼️</span>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="logo-upload">Tải lên Logo mới</Label>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file, 'logo');
                        }
                      }}
                      disabled={uploading === 'logo'}
                    />
                    {uploading === 'logo' && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Đang tải lên...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Favicon</CardTitle>
                  <CardDescription>
                    Tải lên favicon cho website (ICO, PNG)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {settings.websiteFavicon && (
                    <div className="space-y-2">
                      <Label>Favicon hiện tại:</Label>
                      <div className="relative">
                        <Image
                          src={settings.websiteFavicon}
                          alt="Current favicon"
                          width={32}
                          height={32}
                          unoptimized
                          className="h-8 w-8 object-contain border rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <span className="hidden text-2xl">⭐</span>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="favicon-upload">Tải lên Favicon mới</Label>
                    <Input
                      id="favicon-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/x-icon,image/vnd.microsoft.icon"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file, 'favicon');
                        }
                      }}
                      disabled={uploading === 'favicon'}
                    />
                    {uploading === 'favicon' && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Đang tải lên...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="theme" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt Giao diện</CardTitle>
                <CardDescription>
                  Tùy chỉnh màu sắc và chế độ hiển thị
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Màu chủ đạo</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={settings.themeSettings.primaryColor}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        themeSettings: { ...prev.themeSettings, primaryColor: e.target.value }
                      }))}
                      className="w-20 h-10"
                    />
                    <Input
                      value={settings.themeSettings.primaryColor}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        themeSettings: { ...prev.themeSettings, primaryColor: e.target.value }
                      }))}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sidebarColor">Màu Sidebar</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="sidebarColor"
                      type="color"
                      value={settings.themeSettings.sidebarColor}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        themeSettings: { ...prev.themeSettings, sidebarColor: e.target.value }
                      }))}
                      className="w-20 h-10"
                    />
                    <Input
                      value={settings.themeSettings.sidebarColor}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        themeSettings: { ...prev.themeSettings, sidebarColor: e.target.value }
                      }))}
                      placeholder="#1f2937"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="headerColor">Màu Header</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="headerColor"
                      type="color"
                      value={settings.themeSettings.headerColor}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        themeSettings: { ...prev.themeSettings, headerColor: e.target.value }
                      }))}
                      className="w-20 h-10"
                    />
                    <Input
                      value={settings.themeSettings.headerColor}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        themeSettings: { ...prev.themeSettings, headerColor: e.target.value }
                      }))}
                      placeholder="#111827"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="darkMode"
                    checked={settings.themeSettings.darkMode}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      themeSettings: { ...prev.themeSettings, darkMode: checked }
                    }))}
                  />
                  <Label htmlFor="darkMode">Chế độ tối</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
