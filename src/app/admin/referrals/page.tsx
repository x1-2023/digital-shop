'use client';

import { useState, useEffect } from 'react';
// import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReferralSettings {
  enabled: boolean;
  referrerRewardPercent: number;
  maxReferrerRewardPerTransactionVnd: number;
}

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  pendingReferrals: number;
  totalRewardsPaidVnd: number;
}

interface Referral {
  id: string;
  referrerId: string;
  refereeId: string;
  referralCode: string;
  referrerRewardVnd: number;
  refereeRewardVnd: number;
  rewardPaid: boolean;
  rewardPaidAt: string | null;
  firstDepositVnd: number | null;
  firstDepositAt: string | null;
  createdAt: string;
  referrer: {
    id: string;
    email: string;
    referralCode: string | null;
  };
  referee: {
    id: string;
    email: string;
  };
}

interface TopReferrer {
  userId: string;
  email: string | null;
  referralCode: string | null;
  count: number;
  totalRewardsVnd: number;
}

export default function AdminReferralsPage() {
  const [settings, setSettings] = useState<ReferralSettings>({
    enabled: true,
    referrerRewardPercent: 5,
    maxReferrerRewardPerTransactionVnd: 250000,
  });
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [recentReferrals, setRecentReferrals] = useState<Referral[]>([]);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/referrals');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setStats(data.stats);
        setRecentReferrals(data.recentReferrals);
        setTopReferrers(data.topReferrers);
      }
    } catch (error) {
      console.error('Error fetching referrals:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tải dữ liệu giới thiệu',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);

    try {
      const res = await fetch('/api/admin/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast({
          title: 'Thành công',
          description: 'Đã lưu cấu hình giới thiệu',
        });
        fetchData();
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể lưu cấu hình',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('vi-VN');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8" />
              Hệ Thống Giới Thiệu
            </h1>
            <p className="text-muted-foreground">
              Quản lý và theo dõi chương trình giới thiệu bạn bè
            </p>
          </div>
          <Button onClick={handleSaveSettings} disabled={isSaving}>
            {isSaving ? 'Đang lưu...' : 'Lưu Cấu Hình'}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tổng Giới Thiệu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalReferrals || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Đã Kích Hoạt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {stats?.activeReferrals || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Đang Chờ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {stats?.pendingReferrals || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tổng Thưởng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatVND(stats?.totalRewardsPaidVnd || 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Cấu Hình Thưởng</CardTitle>
            <CardDescription>
              Thiết lập phần thưởng cho người giới thiệu và người được giới thiệu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Kích hoạt hệ thống giới thiệu</Label>
                <p className="text-sm text-muted-foreground">
                  Bật/tắt toàn bộ chương trình giới thiệu
                </p>
              </div>
              <Switch
                checked={settings.enabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enabled: checked })
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="referrerPercent">% Hoa Hồng</Label>
                <Input
                  id="referrerPercent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.referrerRewardPercent}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      referrerRewardPercent: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="5"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Phần trăm hoa hồng từ mỗi lần nạp tiền (VD: 5%)
                </p>
              </div>

              <div>
                <Label htmlFor="maxReferrerReward">Hoa Hồng Tối Đa/Lần</Label>
                <Input
                  id="maxReferrerReward"
                  type="number"
                  value={settings.maxReferrerRewardPerTransactionVnd}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      maxReferrerRewardPerTransactionVnd: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="250000"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Số tiền hoa hồng tối đa mỗi giao dịch (VND)
                </p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">💡 Ví dụ với cấu hình hiện tại:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  • User A giới thiệu User B bằng mã giới thiệu
                </li>
                <li>
                  • User B đăng ký và nạp 5,000,000đ
                </li>
                <li>
                  • User A nhận hoa hồng: {settings.referrerRewardPercent}% × 5,000,000đ = {formatVND(Math.min(5000000 * settings.referrerRewardPercent / 100, settings.maxReferrerRewardPerTransactionVnd))} (tối đa {formatVND(settings.maxReferrerRewardPerTransactionVnd)})
                </li>
                <li className="font-medium mt-2 text-green-600 dark:text-green-400">
                  ✅ Hoa hồng áp dụng cho MỌI lần User B nạp tiền
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Top Referrers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Người Giới Thiệu</CardTitle>
            <CardDescription>
              10 người dùng giới thiệu nhiều nhất
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topReferrers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Chưa có dữ liệu
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Mã Giới Thiệu</TableHead>
                    <TableHead className="text-right">Số Lượng</TableHead>
                    <TableHead className="text-right">Tổng Thưởng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topReferrers.map((referrer, index) => (
                    <TableRow key={referrer.userId}>
                      <TableCell>
                        <Badge variant={index < 3 ? 'default' : 'secondary'}>
                          {index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell>{referrer.email}</TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded">
                          {referrer.referralCode || 'N/A'}
                        </code>
                      </TableCell>
                      <TableCell className="text-right">
                        {referrer.count}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatVND(referrer.totalRewardsVnd)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Referrals */}
        <Card>
          <CardHeader>
            <CardTitle>Giới Thiệu Gần Đây</CardTitle>
            <CardDescription>
              20 lượt giới thiệu mới nhất
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentReferrals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Chưa có giới thiệu nào
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Người Giới Thiệu</TableHead>
                    <TableHead>Người Được Giới Thiệu</TableHead>
                    <TableHead>Mã</TableHead>
                    <TableHead>Trạng Thái</TableHead>
                    <TableHead>Nạp Lần Đầu</TableHead>
                    <TableHead>Thưởng</TableHead>
                    <TableHead>Ngày Tạo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentReferrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell className="text-sm">
                        {referral.referrer.email}
                      </TableCell>
                      <TableCell className="text-sm">
                        {referral.referee.email}
                      </TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-xs">
                          {referral.referralCode}
                        </code>
                      </TableCell>
                      <TableCell>
                        {referral.rewardPaid ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Đã Trả
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="mr-1 h-3 w-3" />
                            Chờ Nạp
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {referral.firstDepositVnd
                          ? formatVND(referral.firstDepositVnd)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {referral.rewardPaid
                          ? `${formatVND(referral.referrerRewardVnd)} + ${formatVND(referral.refereeRewardVnd)}`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(referral.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
