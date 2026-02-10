'use client';

import { useState, useEffect, useCallback } from 'react';
// import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Filter,
  FileText,
  User,
  Calendar,
  Eye,
  DollarSign
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface AdminLog {
  id: string;
  adminId: string;
  admin: {
    email: string;
  };
  action: string;
  targetType: string;
  targetId: string;
  diffJson: Record<string, unknown>;
  createdAt: string;
}

interface SystemLog {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  amount: number | null;
  description: string;
  metadata: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export default function AdminLogsPage() {
  const [activeTab, setActiveTab] = useState('system');
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [targetFilter, setTargetFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const { toast } = useToast();

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (targetFilter !== 'all') params.append('targetType', targetFilter);
      params.append('page', currentPage.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());

      const response = await fetch(`/api/admin/logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.data?.logs || data.logs || []);
        if (data.data?.pagination) {
          setTotalPages(data.data.pagination.pages || 1);
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: 'Không thể tải nhật ký hoạt động',
        });
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Có lỗi xảy ra khi tải nhật ký',
      });
    } finally {
      setIsLoading(false);
    }
  }, [search, actionFilter, targetFilter, currentPage, toast]);

  const fetchSystemLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (targetFilter !== 'all') params.append('targetType', targetFilter);
      params.append('page', currentPage.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());

      const response = await fetch(`/api/admin/system-logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSystemLogs(data.data?.logs || data.logs || []);
        if (data.data?.pagination) {
          setTotalPages(data.data.pagination.pages || 1);
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: 'Không thể tải nhật ký hệ thống',
        });
      }
    } catch (error) {
      console.error('Error fetching system logs:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Có lỗi xảy ra khi tải nhật ký hệ thống',
      });
    } finally {
      setIsLoading(false);
    }
  }, [search, actionFilter, targetFilter, currentPage, toast]);

  useEffect(() => {
    if (activeTab === 'admin') {
      fetchLogs();
    } else {
      fetchSystemLogs();
    }
  }, [activeTab, fetchLogs, fetchSystemLogs]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <Badge variant="success">Tạo mới</Badge>;
      case 'UPDATE':
        return <Badge variant="warning">Cập nhật</Badge>;
      case 'DELETE':
        return <Badge variant="destructive">Xóa</Badge>;
      case 'APPROVE':
        return <Badge variant="success">Duyệt</Badge>;
      case 'REJECT':
        return <Badge variant="destructive">Từ chối</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getSystemActionBadge = (action: string) => {
    switch (action) {
      case 'USER_REGISTER':
        return <Badge variant="success">Đăng ký</Badge>;
      case 'USER_LOGIN':
      case 'ADMIN_LOGIN':
        return <Badge className="bg-blue-500">Đăng nhập</Badge>;
      case 'DEPOSIT_CREATE':
        return <Badge className="bg-yellow-500">Tạo nạp</Badge>;
      case 'DEPOSIT_APPROVE':
        return <Badge variant="success">Duyệt nạp</Badge>;
      case 'DEPOSIT_REJECT':
        return <Badge variant="destructive">Từ chối nạp</Badge>;
      case 'DEPOSIT_AUTO':
        return <Badge className="bg-green-600">Nạp tự động</Badge>;
      case 'ORDER_CREATE':
        return <Badge className="bg-purple-500">Tạo đơn</Badge>;
      case 'ORDER_PAID':
        return <Badge className="bg-green-500">Thanh toán</Badge>;
      case 'WALLET_CREDIT':
        return <Badge className="bg-emerald-500">Cộng tiền</Badge>;
      case 'WALLET_DEBIT':
        return <Badge className="bg-red-500">Trừ tiền</Badge>;
      default:
        return <Badge variant="outline">{action.replace('_', ' ')}</Badge>;
    }
  };

  const getTargetTypeLabel = (targetType: string) => {
    switch (targetType) {
      case 'PRODUCT':
        return 'Sản phẩm';
      case 'ORDER':
        return 'Đơn hàng';
      case 'DEPOSIT':
        return 'Nạp tiền';
      case 'SETTINGS':
        return 'Cài đặt';
      default:
        return targetType;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-card rounded w-1/4"></div>
          <div className="h-12 bg-card rounded"></div>
          <div className="h-64 bg-card rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Nhật ký hệ thống</h1>
          <p className="text-text-muted">
            Theo dõi các hoạt động của người dùng và quản trị viên
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(1); setTotalPages(1); }}>
          <TabsList>
            <TabsTrigger value="system">Nhật ký hệ thống</TabsTrigger>
            <TabsTrigger value="admin">Nhật ký Admin</TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted h-4 w-4" />
                      <Input
                        placeholder="Tìm kiếm theo user, mô tả..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Select value={actionFilter} onValueChange={setActionFilter}>
                      <SelectTrigger className="w-48">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Hành động" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="USER_REGISTER">Đăng ký</SelectItem>
                        <SelectItem value="USER_LOGIN">Đăng nhập</SelectItem>
                        <SelectItem value="DEPOSIT_CREATE">Tạo nạp</SelectItem>
                        <SelectItem value="DEPOSIT_AUTO">Nạp tự động</SelectItem>
                        <SelectItem value="ORDER_CREATE">Tạo đơn</SelectItem>
                        <SelectItem value="ORDER_PAID">Thanh toán</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={targetFilter} onValueChange={setTargetFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Đối tượng" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="ORDER">Đơn hàng</SelectItem>
                        <SelectItem value="DEPOSIT">Nạp tiền</SelectItem>
                        <SelectItem value="WALLET">Ví</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Logs Table */}
            {systemLogs.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-text-muted opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Chưa có nhật ký</h3>
                  <p className="text-text-muted">Chưa có hoạt động nào được ghi lại</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Người dùng</TableHead>
                      <TableHead>Hành động</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Mô tả</TableHead>
                      <TableHead>Thời gian</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {systemLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-text-muted" />
                            <span className="font-medium text-sm">{log.userEmail || 'System'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getSystemActionBadge(log.action)}
                        </TableCell>
                        <TableCell>
                          {log.amount ? (
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-3 w-3 text-green-500" />
                              <span className="font-medium text-sm">
                                {log.amount.toLocaleString('vi-VN')} đ
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-text-muted">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md truncate text-sm">
                            {log.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2 text-sm text-text-muted">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(log.createdAt)}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="admin" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted h-4 w-4" />
                      <Input
                        placeholder="Tìm kiếm theo admin, action..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Select value={actionFilter} onValueChange={setActionFilter}>
                      <SelectTrigger className="w-40">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Hành động" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="CREATE">Tạo mới</SelectItem>
                        <SelectItem value="UPDATE">Cập nhật</SelectItem>
                        <SelectItem value="DELETE">Xóa</SelectItem>
                        <SelectItem value="APPROVE">Duyệt</SelectItem>
                        <SelectItem value="REJECT">Từ chối</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={targetFilter} onValueChange={setTargetFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Đối tượng" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="PRODUCT">Sản phẩm</SelectItem>
                        <SelectItem value="ORDER">Đơn hàng</SelectItem>
                        <SelectItem value="DEPOSIT">Nạp tiền</SelectItem>
                        <SelectItem value="SETTINGS">Cài đặt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admin Logs Table */}
            {logs.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-text-muted opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Chưa có nhật ký</h3>
                  <p className="text-text-muted">Chưa có hoạt động nào được ghi lại</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin</TableHead>
                      <TableHead>Hành động</TableHead>
                      <TableHead>Đối tượng</TableHead>
                      <TableHead>Chi tiết</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-text-muted" />
                            <span className="font-medium">{log.admin.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getActionBadge(log.action)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{getTargetTypeLabel(log.targetType)}</div>
                            <div className="text-sm text-text-muted">
                              ID: {log.targetId.slice(0, 8)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {log.diffJson ? (
                              <span className="text-sm text-text-muted">
                                {JSON.stringify(log.diffJson).slice(0, 50)}...
                              </span>
                            ) : (
                              <span className="text-sm text-text-muted">Không có</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2 text-sm text-text-muted">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(log.createdAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => { }}>
                            <Eye className="h-3 w-3 mr-1" />
                            Xem
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                Trước
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce((acc: (number | string)[], p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === '...' ? (
                    <span key={`e-${idx}`} className="px-2 text-muted-foreground">...</span>
                  ) : (
                    <Button
                      key={p}
                      variant={currentPage === p ? 'default' : 'outline'}
                      onClick={() => setCurrentPage(p as number)}
                    >
                      {p}
                    </Button>
                  )
                )}
              <Button
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



