'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Có lỗi xảy ra');
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      setError('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="h-10 w-10 rounded-lg bg-brand flex items-center justify-center">
              <span className="text-white font-bold text-lg">WM</span>
            </div>
            <span className="font-bold text-2xl text-text-primary">{process.env.NEXT_PUBLIC_SITE_NAME || 'Digital Shop'}</span>
          </Link>
          <p className="text-text-muted mt-2">Khôi phục mật khẩu</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quên mật khẩu?</CardTitle>
            <CardDescription>
              {isSuccess
                ? 'Kiểm tra email của bạn để đặt lại mật khẩu'
                : 'Nhập email để nhận link đặt lại mật khẩu'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-green-500 font-medium">
                        Email đã được gửi!
                      </p>
                      <p className="text-sm text-text-muted mt-1">
                        Kiểm tra hộp thư của bạn và làm theo hướng dẫn để đặt lại mật khẩu.
                        Link sẽ hết hạn sau 1 giờ.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Link href="/auth/signin">
                    <Button className="w-full" variant="outline">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Quay lại đăng nhập
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
                    {error}
                  </div>
                )}

                {/* Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted h-4 w-4" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="your@email.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <p className="text-xs text-text-muted">
                    Nhập địa chỉ email bạn đã dùng để đăng ký tài khoản
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    'Gửi link đặt lại mật khẩu'
                  )}
                </Button>

                {/* Back to Sign In */}
                <div className="pt-2">
                  <Link href="/auth/signin">
                    <Button variant="ghost" className="w-full">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Quay lại đăng nhập
                    </Button>
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-text-muted hover:text-text-primary">
            ← Quay về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
