'use client';

import { useState, useEffect } from 'react';
// import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, RefreshCw, Wallet, Plus, Minus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface UserWallet {
  id: string;
  userId: string;
  balanceVnd: number;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    role: string;
    createdAt: string;
  };
}

interface WalletAdjustment {
  userId: string;
  amount: number;
  type: 'add' | 'subtract';
  reason: string;
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<UserWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [adjustmentModal, setAdjustmentModal] = useState<{
    isOpen: boolean;
    wallet: UserWallet | null;
  }>({ isOpen: false, wallet: null });
  const [adjustment, setAdjustment] = useState<WalletAdjustment>({
    userId: '',
    amount: 0,
    type: 'add',
    reason: '',
  });

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      const response = await fetch('/api/admin/wallets');
      const data = await response.json();

      if (data.success) {
        setWallets(data.data.wallets);
      } else {
        toast({
          title: 'Lỗi',
          description: 'Không thể tải danh sách ví',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Lỗi',
        description: 'Có lỗi xảy ra khi tải danh sách ví',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustWallet = async () => {
    if (!adjustment.userId || adjustment.amount <= 0 || !adjustment.reason) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ thông tin',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/wallets/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adjustment),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Thành công',
          description: `Đã ${adjustment.type === 'add' ? 'cộng' : 'trừ'} ${adjustment.amount.toLocaleString('vi-VN')} VND`,
        });
        setAdjustmentModal({ isOpen: false, wallet: null });
        setAdjustment({ userId: '', amount: 0, type: 'add', reason: '' });
        fetchWallets();
      } else {
        toast({
          title: 'Lỗi',
          description: data.error || 'Không thể điều chỉnh ví',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Lỗi',
        description: 'Có lỗi xảy ra khi điều chỉnh ví',
        variant: 'destructive',
      });
    }
  };

  const openAdjustmentModal = (wallet: UserWallet) => {
    setAdjustmentModal({ isOpen: true, wallet });
    setAdjustment({
      userId: wallet.userId,
      amount: 0,
      type: 'add',
      reason: '',
    });
  };

  const filteredWallets = wallets.filter(wallet =>
    wallet.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wallet.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balanceVnd, 0);

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
            <h1 className="text-3xl font-bold">Quản lý Ví</h1>
            <p className="text-muted-foreground">
              Quản lý ví người dùng và điều chỉnh số dư
            </p>
          </div>
          <Button onClick={fetchWallets} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng số ví</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{wallets.length}</div>
              <p className="text-xs text-muted-foreground">
                Ví đang hoạt động
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng số dư</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalBalance.toLocaleString('vi-VN')} VND
              </div>
              <p className="text-xs text-muted-foreground">
                Tổng số dư hệ thống
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Số dư trung bình</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {wallets.length > 0 ? (totalBalance / wallets.length).toLocaleString('vi-VN') : 0} VND
              </div>
              <p className="text-xs text-muted-foreground">
                Trung bình mỗi ví
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Tìm kiếm ví</CardTitle>
            <CardDescription>
              Tìm kiếm theo email hoặc ID người dùng
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm theo email hoặc ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách ví</CardTitle>
            <CardDescription>
              {filteredWallets.length} ví được tìm thấy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Số dư</TableHead>
                  <TableHead>Cập nhật</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWallets.map((wallet) => (
                  <TableRow key={wallet.id}>
                    <TableCell className="font-medium">
                      {wallet.userId.slice(0, 8)}...
                    </TableCell>
                    <TableCell>{wallet.user.email}</TableCell>
                    <TableCell>
                      <Badge variant={wallet.user.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {wallet.user.role === 'ADMIN' ? 'Admin' : 'Người dùng'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {wallet.balanceVnd.toLocaleString('vi-VN')} VND
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(wallet.updatedAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAdjustmentModal(wallet)}
                      >
                        <Wallet className="h-4 w-4 mr-1" />
                        Điều chỉnh
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Adjustment Modal */}
        {adjustmentModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Điều chỉnh ví</CardTitle>
                <CardDescription>
                  Điều chỉnh số dư cho {adjustmentModal.wallet?.user.email}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Loại điều chỉnh</label>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant={adjustment.type === 'add' ? 'default' : 'outline'}
                      onClick={() => setAdjustment(prev => ({ ...prev, type: 'add' }))}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Cộng tiền
                    </Button>
                    <Button
                      size="sm"
                      variant={adjustment.type === 'subtract' ? 'default' : 'outline'}
                      onClick={() => setAdjustment(prev => ({ ...prev, type: 'subtract' }))}
                    >
                      <Minus className="h-4 w-4 mr-1" />
                      Trừ tiền
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Số tiền (VND)</label>
                  <Input
                    type="number"
                    value={adjustment.amount}
                    onChange={(e) => setAdjustment(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    placeholder="Nhập số tiền..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Lý do</label>
                  <Input
                    value={adjustment.reason}
                    onChange={(e) => setAdjustment(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Nhập lý do điều chỉnh..."
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={handleAdjustWallet}
                    className="flex-1"
                  >
                    Xác nhận
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setAdjustmentModal({ isOpen: false, wallet: null })}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
