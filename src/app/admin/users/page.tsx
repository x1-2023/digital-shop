'use client';

import { useState, useEffect } from 'react';
// import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, RefreshCw, Users, UserPlus, Shield, User, Plus, Minus, Wallet } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  role: string;
  emailVerified: string | null;
  createdAt: string;
  updatedAt: string;
  wallet?: {
    balanceVnd: number;
  };
  _count?: {
    orders: number;
  };
}

interface WalletAdjustment {
  userId: string;
  amount: number;
  type: 'add' | 'subtract';
  reason: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [adjustmentModal, setAdjustmentModal] = useState<{
    isOpen: boolean;
    user: User | null;
  }>({ isOpen: false, user: null });
  const [adjustment, setAdjustment] = useState<WalletAdjustment>({
    userId: '',
    amount: 0,
    type: 'add',
    reason: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();

      if (data.success) {
        setUsers(data.data.users);
      } else {
        toast({
          title: 'Lỗi',
          description: 'Không thể tải danh sách người dùng',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Có lỗi xảy ra khi tải danh sách người dùng',
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
          description: `Đã ${adjustment.type === 'add' ? 'cộng' : 'trừ'} ${adjustment.amount.toLocaleString('vi-VN')} VND cho ${adjustmentModal.user?.email}`,
        });
        setAdjustmentModal({ isOpen: false, user: null });
        setAdjustment({ userId: '', amount: 0, type: 'add', reason: '' });
        fetchUsers();
      } else {
        toast({
          title: 'Lỗi',
          description: data.error || 'Không thể điều chỉnh ví',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Có lỗi xảy ra khi điều chỉnh ví',
        variant: 'destructive',
      });
    }
  };

  const openAdjustmentModal = (user: User) => {
    setAdjustmentModal({ isOpen: true, user });
    setAdjustment({
      userId: user.id,
      amount: 0,
      type: 'add',
      reason: '',
    });
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUsers = users.length;
  const adminUsers = users.filter(user => user.role === 'ADMIN').length;
  const buyerUsers = users.filter(user => user.role === 'BUYER').length;

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
            <h1 className="text-3xl font-bold">Quản lý Người dùng</h1>
            <p className="text-muted-foreground">
              Quản lý tài khoản người dùng và phân quyền
            </p>
          </div>
          <Button onClick={fetchUsers} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Tài khoản đã đăng ký
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admin</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminUsers}</div>
              <p className="text-xs text-muted-foreground">
                Quản trị viên
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Người dùng</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{buyerUsers}</div>
              <p className="text-xs text-muted-foreground">
                Khách hàng
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Tìm kiếm người dùng</CardTitle>
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

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách người dùng</CardTitle>
            <CardDescription>
              {filteredUsers.length} người dùng được tìm thấy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Xác thực</TableHead>
                  <TableHead>Số dư ví</TableHead>
                  <TableHead>Đơn hàng</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {user.role === 'ADMIN' ? 'Admin' : 'Người dùng'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.emailVerified ? 'default' : 'outline'}>
                        {user.emailVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {user.wallet ? `${user.wallet.balanceVnd.toLocaleString('vi-VN')} VND` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {user._count?.orders || 0} đơn
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        Hoạt động
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAdjustmentModal(user)}
                        disabled={!user.wallet}
                      >
                        <Wallet className="h-4 w-4 mr-1" />
                        Điều chỉnh ví
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
                  Điều chỉnh số dư cho {adjustmentModal.user?.email}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Số dư hiện tại</label>
                  <div className="text-lg font-bold text-green-600">
                    {adjustmentModal.user?.wallet?.balanceVnd.toLocaleString('vi-VN')} VND
                  </div>
                </div>

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
                    onClick={() => setAdjustmentModal({ isOpen: false, user: null })}
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
