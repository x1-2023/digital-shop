'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  ShoppingCart,
  CreditCard,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';

interface DashboardStats {
  revenue: {
    total: number;
    today: number;
    month: number;
    year: number;
  };
  orders: {
    today: number;
    month: number;
    year: number;
  };
  deposits: {
    total: number;
    today: number;
    month: number;
    year: number;
  };
  spent: {
    total: number;
    today: number;
    month: number;
    year: number;
  };
  pendingDeposits: number;
  totalUsers: number;
  // Backward compatibility
  totalRevenue: number;
  todayOrders: number;
}

interface RecentOrder {
  id: string;
  userEmail: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface PendingDeposit {
  id: string;
  userEmail: string;
  amount: number;
  status: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<PendingDeposit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<'today' | 'month' | 'year' | 'total'>('today');
  const [onlineUsers, setOnlineUsers] = useState<{ total: number; guests: number; authenticated: number } | null>(null);

  // Check if user is admin
  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (!data.user || data.user.role !== 'ADMIN') {
            window.location.href = '/';
            return;
          }
        } else {
          window.location.href = '/auth/signin';
          return;
        }
      } catch (error) {
        console.error('Failed to check admin access:', error);
        window.location.href = '/';
      }
    };
    checkAdminAccess();
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch stats from API
        const statsRes = await fetch('/api/admin/stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        // Fetch online users
        const onlineRes = await fetch('/api/admin/online-users');
        if (onlineRes.ok) {
          const onlineData = await onlineRes.json();
          setOnlineUsers(onlineData);
        }

        // Fetch recent orders
        const ordersRes = await fetch('/api/admin/orders?limit=5');
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setRecentOrders(ordersData.orders || []);
        }

        // Fetch pending deposits
        const depositsRes = await fetch('/api/admin/deposits?status=PENDING&limit=5');
        if (depositsRes.ok) {
          const depositsData = await depositsRes.json();
          setPendingDeposits(depositsData.deposits || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();

    // Refresh online users every 30 seconds
    const interval = setInterval(() => {
      fetch('/api/admin/online-users')
        .then(res => res.json())
        .then(data => setOnlineUsers(data))
        .catch(err => console.error('Error refreshing online users:', err));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Đã thanh toán</Badge>;
      case 'PENDING':
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />Chờ xử lý</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Bị từ chối</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <AppShell isAdmin>
        <div className="flex-1 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-card rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-card rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-card rounded"></div>
          </div>
        </div>
      </AppShell>
    );
  }

  // Helper to get current period stats
  const getCurrentStats = () => {
    if (!stats) return { revenue: 0, orders: 0, deposits: 0, spent: 0 };

    if (timePeriod === 'total') {
      return {
        revenue: stats.revenue.total,
        orders: stats.orders.today + stats.orders.month + stats.orders.year, // Approximation
        deposits: stats.deposits.total,
        spent: stats.spent.total,
      };
    }

    return {
      revenue: stats.revenue[timePeriod],
      orders: stats.orders[timePeriod],
      deposits: stats.deposits[timePeriod],
      spent: stats.spent[timePeriod],
    };
  };

  const currentStats = getCurrentStats();
  const periodLabel = {
    today: 'Hôm nay',
    month: 'Tháng này',
    year: 'Năm nay',
    total: 'Tất cả thời gian'
  }[timePeriod];

  return (
    <AppShell isAdmin>
      <div className="flex-1 p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-muted">Tổng quan hệ thống</p>
        </div>

        {/* Time Period Selector */}
        <Tabs value={timePeriod} onValueChange={(v) => setTimePeriod(v as any)} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="today">Hôm nay</TabsTrigger>
            <TabsTrigger value="month">Tháng</TabsTrigger>
            <TabsTrigger value="year">Năm</TabsTrigger>
            <TabsTrigger value="total">Tổng</TabsTrigger>
          </TabsList>

          <TabsContent value={timePeriod} className="mt-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Doanh Thu</CardTitle>
                  <DollarSign className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">
                    {formatCurrency(currentStats.revenue)}
                  </div>
                  <p className="text-xs text-text-muted">{periodLabel}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Đơn Hàng</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-brand" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-brand">
                    {currentStats.orders}
                  </div>
                  <p className="text-xs text-text-muted">{periodLabel}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">User Đã Nạp</CardTitle>
                  <ArrowUpCircle className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-500">
                    {formatCurrency(currentStats.deposits)}
                  </div>
                  <p className="text-xs text-text-muted">{periodLabel}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">User Đã Chi</CardTitle>
                  <ArrowDownCircle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-500">
                    {formatCurrency(currentStats.spent)}
                  </div>
                  <p className="text-xs text-text-muted">{periodLabel}</p>
                </CardContent>
              </Card>
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Yêu Cầu Nạp Chờ Duyệt</CardTitle>
                  <CreditCard className="h-4 w-4 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning">
                    {stats?.pendingDeposits || 0}
                  </div>
                  <p className="text-xs text-text-muted">Cần xử lý</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Đang Online</CardTitle>
                  <Users className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">
                    {onlineUsers?.total || 0}
                  </div>
                  <p className="text-xs text-text-muted">
                    {onlineUsers?.authenticated || 0} users + {onlineUsers?.guests || 0} guests
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng Người Dùng</CardTitle>
                  <Users className="h-4 w-4 text-text-muted" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-text-primary">
                    {stats?.totalUsers || 0}
                  </div>
                  <p className="text-xs text-text-muted">Đã đăng ký</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Đơn hàng gần đây</CardTitle>
                <Link href="/admin/orders">
                  <Button variant="outline" size="sm">Xem tất cả</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có đơn hàng nào</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">
                          {order.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>{order.userEmail}</TableCell>
                        <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Pending Deposits */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Yêu cầu nạp chờ duyệt</CardTitle>
                <Link href="/admin/topups">
                  <Button variant="outline" size="sm">Xem tất cả</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {pendingDeposits.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Không có yêu cầu nạp nào</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Ngày</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingDeposits.map((deposit) => (
                      <TableRow key={deposit.id}>
                        <TableCell className="font-mono text-xs">
                          #{deposit.id}
                        </TableCell>
                        <TableCell>{deposit.userEmail}</TableCell>
                        <TableCell>{formatCurrency(deposit.amount)}</TableCell>
                        <TableCell>{formatDate(deposit.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}



