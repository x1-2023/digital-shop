'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter,
  FileText,
  User,
  Calendar,
  Eye
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

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [targetFilter, setTargetFilter] = useState<string>('all');
  const { toast } = useToast();

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (targetFilter !== 'all') params.append('targetType', targetFilter);

      const response = await fetch(`/api/admin/logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.data?.logs || data.logs || []);
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
  }, [search, actionFilter, targetFilter, toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

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
      <AppShell isAdmin>
        <div className="flex-1 p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-card rounded w-1/4"></div>
            <div className="h-12 bg-card rounded"></div>
            <div className="h-64 bg-card rounded"></div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell isAdmin>
      <div className="flex-1 p-6">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Nhật ký hoạt động</h1>
            <p className="text-text-muted">
              Theo dõi các hoạt động của quản trị viên
            </p>
          </div>

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

          {/* Logs Table */}
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
                        <Button variant="outline" size="sm" onClick={() => {}}>
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

          {/* Pagination */}
          {logs.length > 0 && (
            <div className="flex justify-center">
              <div className="flex items-center space-x-2">
                <Button variant="outline" disabled onClick={() => {}}>
                  Trước
                </Button>
                <Button variant="default" onClick={() => {}}>1</Button>
                <Button variant="outline" onClick={() => {}}>2</Button>
                <Button variant="outline" onClick={() => {}}>3</Button>
                <Button variant="outline" onClick={() => {}}>
                  Sau
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}



