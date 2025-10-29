'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Mail, Lock, Eye, EyeOff, CheckCircle2, XCircle, Loader2, Gift } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
    agreeToTerms: false,
  });

  // Auto-fill referral code from URL
  useEffect(() => {
    const refParam = searchParams.get('ref');
    if (refParam) {
      setFormData(prev => ({ ...prev, referralCode: refParam }));
    }
  }, [searchParams]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthLabels = ['Rất yếu', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          // Field-specific errors
          const errorMap: Record<string, string> = {};
          data.errors.forEach((err: { field: string; message: string }) => {
            errorMap[err.field] = err.message;
          });
          setErrors(errorMap);
        } else {
          setErrors({ general: data.error || 'Đăng ký thất bại' });
        }
        return;
      }

      // Success - auto login with the new account
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (loginResponse.ok) {
        // Redirect to home with success message
        router.push('/?signup=success');
        router.refresh();
      } else {
        // Registration success but login failed, redirect to signin
        router.push('/auth/signin?registered=true');
      }
    } catch (error) {
      setErrors({ general: 'Đã xảy ra lỗi kết nối' });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordRequirements = [
    { met: formData.password.length >= 8, label: 'Ít nhất 8 ký tự' },
    { met: /[A-Z]/.test(formData.password), label: 'Có chữ hoa (A-Z)' },
    { met: /[a-z]/.test(formData.password), label: 'Có chữ thường (a-z)' },
    { met: /[0-9]/.test(formData.password), label: 'Có số (0-9)' },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="h-10 w-10 rounded-lg bg-brand flex items-center justify-center">
              <span className="text-white font-bold text-lg">WM</span>
            </div>
            <span className="font-bold text-2xl text-text-primary">WebMMO</span>
          </Link>
          <p className="text-text-muted mt-2">Tạo tài khoản mới</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Đăng ký
            </CardTitle>
            <CardDescription>
              Điền thông tin để tạo tài khoản của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* General Error */}
              {errors.general && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500 flex items-start gap-2">
                  <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{errors.general}</span>
                </div>
              )}

              {/* Email */}
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
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted h-4 w-4" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-primary"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}

                {/* Password Strength */}
                {formData.password && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full ${
                            i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-card-dark'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-text-muted">
                      Độ mạnh: <span className={`font-semibold ${passwordStrength >= 4 ? 'text-green-500' : 'text-orange-500'}`}>
                        {strengthLabels[passwordStrength - 1] || 'Rất yếu'}
                      </span>
                    </p>
                  </div>
                )}

                {/* Password Requirements */}
                {formData.password && (
                  <div className="space-y-1">
                    {passwordRequirements.map((req, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        {req.met ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-text-muted" />
                        )}
                        <span className={req.met ? 'text-green-500' : 'text-text-muted'}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Referral Code */}
              <div className="space-y-2">
                <Label htmlFor="referralCode">
                  Mã giới thiệu (tùy chọn)
                  {formData.referralCode && (
                    <Gift className="inline-block ml-1 h-3 w-3 text-green-500" />
                  )}
                </Label>
                <Input
                  id="referralCode"
                  name="referralCode"
                  type="text"
                  placeholder="Nhập ID người dùng (VD: cm123456)"
                  value={formData.referralCode}
                  onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toLowerCase() })}
                  maxLength={8}
                />
                {formData.referralCode && (
                  <p className="text-xs text-green-500 flex items-center gap-1">
                    <Gift className="h-3 w-3" />
                    Bạn và người giới thiệu sẽ nhận được phần thưởng khi bạn nạp tiền lần đầu!
                  </p>
                )}
                {errors.referralCode && (
                  <p className="text-sm text-red-500">{errors.referralCode}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted h-4 w-4" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-primary"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                )}
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-sm text-orange-500 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Mật khẩu không khớp
                  </p>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className="text-sm text-green-500 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Mật khẩu khớp
                  </p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2">
                <input
                  id="terms"
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-border text-brand focus:ring-brand"
                  required
                />
                <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
                  Tôi đồng ý với{' '}
                  <Link href="/terms" className="text-brand hover:underline">
                    Điều khoản sử dụng
                  </Link>{' '}
                  và{' '}
                  <Link href="/privacy" className="text-brand hover:underline">
                    Chính sách bảo mật
                  </Link>
                </Label>
              </div>
              {errors.agreeToTerms && (
                <p className="text-sm text-red-500">{errors.agreeToTerms}</p>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !formData.agreeToTerms}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Đăng ký
                  </>
                )}
              </Button>
            </form>

            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-text-muted">
                Đã có tài khoản?{' '}
                <Link href="/auth/signin" className="text-brand hover:underline font-medium">
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
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
