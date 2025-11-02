'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Mail,
  Shield,
  LogOut,
  Wallet,
  ShoppingBag,
  Settings,
  Gift,
  Copy,
  Check
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface UserSession {
  id: string;
  email: string;
  role: 'ADMIN' | 'BUYER';
  createdAt?: string;
}

interface ReferralInfo {
  referralCode: string;
  stats: {
    totalReferrals: number;
    activeReferrals: number;
    totalRewardsEarnedVnd: number;
    pendingRewards: number;
  };
}

interface AccountStats {
  totalOrders: number;
  totalSpentVnd: number;
  totalProducts: number;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [accountStats, setAccountStats] = useState<AccountStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSession();
    fetchReferralInfo();
    fetchAccountStats();
  }, []);

  const fetchSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReferralInfo = async () => {
    try {
      const response = await fetch('/api/referral');
      if (response.ok) {
        const data = await response.json();
        setReferralInfo(data);
      }
    } catch (error) {
      console.error('Error fetching referral info:', error);
    }
  };

  const fetchAccountStats = async () => {
    try {
      const response = await fetch('/api/account/stats');
      if (response.ok) {
        const data = await response.json();
        setAccountStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching account stats:', error);
    }
  };

  const copyReferralLink = () => {
    if (!referralInfo) return;

    const url = `${window.location.origin}/auth/signup?ref=${referralInfo.referralCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast({
      title: 'Đã sao chép',
      description: 'Link giới thiệu đã được sao chép',
    });

    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast({
        title: 'Đã đăng xuất',
        description: 'Bạn đã đăng xuất thành công',
      });
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể đăng xuất',
      });
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-card rounded w-1/4"></div>
            <div className="h-64 bg-card rounded"></div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <User className="h-12 w-12 mx-auto mb-4 text-text-muted opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Chưa đăng nhập</h3>
              <p className="text-text-muted mb-6">Vui lòng đăng nhập để xem thông tin tài khoản</p>
              <Link href="/auth/signin">
                <Button>Đăng nhập</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Tài khoản của tôi</h1>
            <p className="text-text-muted">Quản lý thông tin và cài đặt tài khoản</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Info */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin cá nhân</CardTitle>
                  <CardDescription>
                    Thông tin cơ bản về tài khoản của bạn
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-brand rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{user.email}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'default'}>
                          {user.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div>
                      <label className="text-sm font-medium text-text-muted">Email</label>
                      <p className="text-text-primary">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text-muted">Vai trò</label>
                      <p className="text-text-primary">
                        {user.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text-muted">Trạng thái</label>
                      <p className="text-success">Đã xác thực</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text-muted">Tham gia</label>
                      <p className="text-text-primary">
                        {user.createdAt ? formatDate(user.createdAt) : 'Không xác định'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Hành động nhanh</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/wallet" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Wallet className="h-4 w-4 mr-2" />
                      Ví của tôi
                    </Button>
                  </Link>
                  
                  <Link href="/orders" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Đơn hàng
                    </Button>
                  </Link>

                  {user.role === 'ADMIN' && (
                    <Link href="/admin" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        <Settings className="h-4 w-4 mr-2" />
                        Admin Panel
                      </Button>
                    </Link>
                  )}

                  <Button
                    variant="outline"
                    className="w-full justify-start text-danger hover:text-danger"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Đăng xuất
                  </Button>
                </CardContent>
              </Card>

              {/* Account Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Thống kê</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Tổng đơn hàng:</span>
                    <span className="font-medium">{accountStats?.totalOrders || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Đã chi tiêu:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('vi-VN').format(accountStats?.totalSpentVnd || 0)} VND
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Sản phẩm đã mua:</span>
                    <span className="font-medium">{accountStats?.totalProducts || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Referral Section */}
          {referralInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Gift className="h-5 w-5" />
                  <span>Giới thiệu bạn bè</span>
                </CardTitle>
                <CardDescription>
                  Chia sẻ link giới thiệu và nhận thưởng khi bạn bè đăng ký
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Referral Link */}
                <div>
                  <label className="text-sm font-medium text-text-muted mb-2 block">
                    Link giới thiệu của bạn
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/signup?ref=${referralInfo.referralCode}`}
                      className="flex-1 px-3 py-2 bg-card-dark border border-border rounded-lg text-sm"
                    />
                    <Button
                      variant="outline"
                      onClick={copyReferralLink}
                      className="flex items-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Đã copy
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Referral Code */}
                <div>
                  <label className="text-sm font-medium text-text-muted mb-2 block">
                    Mã giới thiệu
                  </label>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand/10 border border-brand/20 rounded-lg">
                    <span className="text-2xl font-mono font-bold text-brand">
                      {referralInfo.referralCode}
                    </span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-sm text-text-muted">Tổng giới thiệu</p>
                    <p className="text-2xl font-bold">{referralInfo.stats.totalReferrals}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-muted">Đã kích hoạt</p>
                    <p className="text-2xl font-bold text-green-500">
                      {referralInfo.stats.activeReferrals}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-text-muted">Đang chờ</p>
                    <p className="text-2xl font-bold text-orange-500">
                      {referralInfo.stats.pendingRewards}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-text-muted">Tổng thưởng</p>
                    <p className="text-xl font-bold text-brand">
                      {new Intl.NumberFormat('vi-VN').format(
                        referralInfo.stats.totalRewardsEarnedVnd
                      )} ₫
                    </p>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-sm text-blue-400">
                    💡 Chia sẻ link giới thiệu với bạn bè. Khi họ đăng ký và nạp tiền lần đầu, cả
                    bạn và bạn bè đều sẽ nhận được phần thưởng!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Bảo mật</span>
              </CardTitle>
              <CardDescription>
                Thông tin bảo mật tài khoản
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-success" />
                  <div>
                    <h4 className="font-medium">Email đã xác thực</h4>
                    <p className="text-sm text-text-muted">
                      Tài khoản đã được xác thực qua email
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-brand" />
                  <div>
                    <h4 className="font-medium">Bảo mật cao</h4>
                    <p className="text-sm text-text-muted">
                      Sử dụng xác thực email an toàn
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}



