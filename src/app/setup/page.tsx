'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Database, Loader2, Rocket, User, AlertCircle } from 'lucide-react';

export default function SetupPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dbStatus, setDbStatus] = useState<any>(null);

  const [formData, setFormData] = useState({
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',
    websiteName: 'Digital Shop',
  });

  // Check if setup already completed
  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const res = await fetch('/api/setup/status');
      const data = await res.json();

      setDbStatus(data);

      if (data.setupCompleted) {
        // Already setup, redirect to admin
        toast({
          title: 'Setup đã hoàn tất',
          description: 'Đang chuyển đến trang đăng nhập...',
        });
        setTimeout(() => router.push('/auth/signin'), 1500);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
      toast({
        variant: 'destructive',
        title: 'Lỗi kết nối',
        description: 'Không thể kết nối đến database. Kiểm tra lại DATABASE_URL trong .env',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (formData.adminPassword !== formData.adminPasswordConfirm) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Mật khẩu xác nhận không khớp',
      });
      return;
    }

    if (formData.adminPassword.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Mật khẩu phải có ít nhất 8 ký tự',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/setup/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword,
          websiteName: formData.websiteName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Setup thất bại');
      }

      // Success!
      setCurrentStep(3);
      toast({
        title: 'Setup thành công!',
        description: 'Đang chuyển đến trang đăng nhập...',
      });

      setTimeout(() => {
        router.push('/auth/signin');
      }, 2000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Lỗi setup',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-text-muted">Đang kiểm tra trạng thái setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Rocket className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold mb-2">Chào mừng đến với Digital Shop!</h1>
          <p className="text-text-muted">Thiết lập hệ thống trong vài bước đơn giản</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 gap-2">
          <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-primary' : 'text-text-muted'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 1 ? 'border-primary bg-primary text-white' : 'border-text-muted'}`}>
              {currentStep > 1 ? <CheckCircle2 className="h-5 w-5" /> : '1'}
            </div>
            <span className="hidden sm:inline">Database</span>
          </div>

          <div className="w-12 h-0.5 bg-border" />

          <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-primary' : 'text-text-muted'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 2 ? 'border-primary bg-primary text-white' : 'border-text-muted'}`}>
              {currentStep > 2 ? <CheckCircle2 className="h-5 w-5" /> : '2'}
            </div>
            <span className="hidden sm:inline">Admin</span>
          </div>

          <div className="w-12 h-0.5 bg-border" />

          <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-primary' : 'text-text-muted'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 3 ? 'border-primary bg-primary text-white' : 'border-text-muted'}`}>
              {currentStep > 3 ? <CheckCircle2 className="h-5 w-5" /> : '3'}
            </div>
            <span className="hidden sm:inline">Hoàn tất</span>
          </div>
        </div>

        {/* Step 1: Database Check */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Kiểm tra Database
              </CardTitle>
              <CardDescription>
                Kiểm tra kết nối đến PostgreSQL database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dbStatus?.databaseConnected ? (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-700 dark:text-green-400">
                        Kết nối database thành công!
                      </p>
                      <p className="text-sm text-text-muted mt-1">
                        Database đã sẵn sàng. Bạn có thể tiếp tục bước tiếp theo.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-700 dark:text-red-400">
                        Không thể kết nối database
                      </p>
                      <p className="text-sm text-text-muted mt-1">
                        Vui lòng kiểm tra DATABASE_URL trong file .env
                      </p>
                      {dbStatus?.error && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-2 font-mono">
                          {dbStatus.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Button
                  onClick={() => setCurrentStep(2)}
                  disabled={!dbStatus?.databaseConnected}
                  className="w-full"
                >
                  Tiếp theo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Admin Setup */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Tạo Tài Khoản Admin
              </CardTitle>
              <CardDescription>
                Tài khoản admin đầu tiên để quản lý hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="websiteName">Tên Website (Optional)</Label>
                  <Input
                    id="websiteName"
                    type="text"
                    value={formData.websiteName}
                    onChange={(e) => setFormData({ ...formData, websiteName: e.target.value })}
                    placeholder="Digital Shop"
                  />
                </div>

                <div>
                  <Label htmlFor="adminEmail">Email Admin *</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    placeholder="admin@example.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="adminPassword">Mật khẩu *</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                    placeholder="Tối thiểu 8 ký tự"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="adminPasswordConfirm">Xác nhận mật khẩu *</Label>
                  <Input
                    id="adminPasswordConfirm"
                    type="password"
                    value={formData.adminPasswordConfirm}
                    onChange={(e) => setFormData({ ...formData, adminPasswordConfirm: e.target.value })}
                    placeholder="Nhập lại mật khẩu"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1"
                  >
                    Quay lại
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang setup...
                      </>
                    ) : (
                      'Hoàn tất setup'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Success */}
        {currentStep === 3 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Setup thành công!</h2>
                <p className="text-text-muted mb-6">
                  Hệ thống đã được thiết lập hoàn tất. Đang chuyển đến trang đăng nhập...
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Tự động chuyển hướng sau 2 giây</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-sm text-text-muted mt-6">
          Cần trợ giúp? Xem{' '}
          <a href="https://github.com" className="text-primary hover:underline">
            tài liệu hướng dẫn
          </a>
        </p>
      </div>
    </div>
  );
}
