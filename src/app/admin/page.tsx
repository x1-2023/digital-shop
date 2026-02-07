'use client';

import { useState, useEffect } from 'react';
// import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardCharts } from '@/components/admin/dashboard-charts';
import {
  DollarSign,
  ShoppingCart,
  CreditCard,
  Users,
  Clock,
  CheckCircle,
  XCircle,
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
    chart: any[]; // New field for chart data
  };
  orders: {
    today: number;
    month: number;
    year: number;
    chart: any[]; // New field for chart data
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
  // Check if user is admin
  // Handled by AdminLayout

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
        return <Badge variant="success" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"><CheckCircle className="w-3 h-3 mr-1" />Đã thanh toán</Badge>;
      case 'PENDING':
        return <Badge variant="warning" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"><Clock className="w-3 h-3 mr-1" />Chờ xử lý</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20"><XCircle className="w-3 h-3 mr-1" />Bị từ chối</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-card rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-card rounded-xl"></div>
            ))}
          </div>
          <div className="h-[400px] bg-card rounded-xl"></div>
        </div>
      </div>
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

  // Dummy chart data if API doesn't provide it yet
  const revenueChartData = stats?.revenue?.chart || [
    { date: 'T2', amount: stats?.revenue.today ? stats.revenue.today * 0.8 : 0 },
    { date: 'T3', amount: stats?.revenue.today ? stats.revenue.today * 1.2 : 0 },
    { date: 'T4', amount: stats?.revenue.today || 0 },
    // more dummy data points...
  ];

  const orderChartData = stats?.orders?.chart || [
    { date: 'T2', count: stats?.orders.today ? 2 : 0 },
    { date: 'T3', count: stats?.orders.today ? 5 : 0 },
    { date: 'T4', count: stats?.orders.today || 0 },
  ];

  return (
    <div className="flex-1 p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-1">Tổng quan</h1>
          <p className="text-text-muted">Chào mừng trở lại, Administrator</p>
        </div>

        <Tabs value={timePeriod} onValueChange={(v) => setTimePeriod(v as any)} className="w-full md:w-auto">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
            <TabsTrigger value="total">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats Cards - Modern Look */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border hover:shadow-lg hover:shadow-success/5 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">Doanh Thu</CardTitle>
            <div className="p-2 bg-success/10 rounded-lg">
              <DollarSign className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary">
              {formatCurrency(currentStats.revenue)}
            </div>
            <p className="text-xs text-text-muted mt-1 font-medium">{periodLabel}</p>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-lg hover:shadow-brand/5 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">Đơn Hàng</CardTitle>
            <div className="p-2 bg-brand/10 rounded-lg">
              <ShoppingCart className="h-4 w-4 text-brand" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary">
              {currentStats.orders}
            </div>
            <p className="text-xs text-text-muted mt-1 font-medium">{periodLabel}</p>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-lg hover:shadow-blue-500/5 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">User Đã Nạp</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <ArrowUpCircle className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary">
              {formatCurrency(currentStats.deposits)}
            </div>
            <p className="text-xs text-text-muted mt-1 font-medium">{periodLabel}</p>
          </CardContent>
        </Card>

        <Card className="border-border hover:shadow-lg hover:shadow-orange-500/5 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">Đang Online</CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Users className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-primary flex items-center gap-2">
              {onlineUsers?.total || 0}
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            </div>
            <p className="text-xs text-text-muted mt-1 font-medium">
              {onlineUsers?.authenticated || 0} users • {onlineUsers?.guests || 0} guests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <DashboardCharts revenueData={revenueChartData} orderData={orderChartData} />

      {/* Recent Data Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Đơn hàng gần đây</CardTitle>
                <p className="text-sm text-text-muted mt-1">5 đơn hàng mới nhất</p>
              </div>
              <Link href="/admin/orders">
                <Button variant="outline" size="sm" className="hover:bg-card-dark">Xem tất cả</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-12 text-text-muted bg-card-dark/50 rounded-lg border border-dashed border-border/50">
                <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>Chưa có đơn hàng nào</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <TableHeader className="bg-card-dark">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead className="text-right">Số tiền</TableHead>
                      <TableHead className="text-center w-[120px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-card-dark/50">
                        <TableCell className="font-mono text-xs text-text-muted">
                          {order.id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="font-medium text-text-primary">{order.userEmail}</TableCell>
                        <TableCell className="text-right font-bold text-text-primary">
                          {formatCurrency(order.totalAmount)}
                        </TableCell>
                        <TableCell className="text-center">{getStatusBadge(order.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Deposits */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Yêu cầu nạp tiền</CardTitle>
                <p className="text-sm text-text-muted mt-1">Các giao dịch đang chờ duyệt</p>
              </div>
              <Link href="/admin/topups">
                <Button variant="outline" size="sm" className="hover:bg-card-dark">Xem tất cả</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {pendingDeposits.length === 0 ? (
              <div className="text-center py-12 text-text-muted bg-card-dark/50 rounded-lg border border-dashed border-border/50">
                <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-30 text-success" />
                <p>Hết việc rồi! Đã xử lý hết yêu cầu.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <TableHeader className="bg-card-dark">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead className="text-right">Nạp</TableHead>
                      <TableHead className="text-right">Ngày</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingDeposits.map((deposit) => (
                      <TableRow key={deposit.id} className="hover:bg-card-dark/50">
                        <TableCell className="font-mono text-xs text-text-muted">
                          #{deposit.id}
                        </TableCell>
                        <TableCell className="font-medium">{deposit.userEmail}</TableCell>
                        <TableCell className="text-right font-bold text-success">
                          +{formatCurrency(deposit.amount)}
                        </TableCell>
                        <TableCell className="text-right text-xs text-text-muted">
                          {formatDate(deposit.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



