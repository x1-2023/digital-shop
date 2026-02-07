'use client';

import { useState, useEffect, useCallback } from 'react';
// import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Filter,
  Package
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ErrorReport {
  id: string;
  userId: string;
  userEmail: string;
  orderId: string;
  productLineId: string | null;
  productName: string | null;
  originalContent: string | null;
  userNote: string | null;
  status: 'PENDING' | 'PROCESSING' | 'RESOLVED' | 'REJECTED';
  reportedProducts: string | null; // Legacy field
  adminNote: string | null;
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminErrorReportsPage() {
  const [reports, setReports] = useState<ErrorReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<ErrorReport | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [resolution, setResolution] = useState('');
  const [replacement, setReplacement] = useState('');
  const [newStatus, setNewStatus] = useState<string>('');
  const { toast } = useToast();

  const fetchReports = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/admin/error-reports?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      } else {
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: 'Không thể tải danh sách báo cáo lỗi',
        });
      }
    } catch (error) {
      console.error('Error fetching error reports:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Có lỗi xảy ra khi tải báo cáo',
      });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Đã xử lý</Badge>;
      case 'PENDING':
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />Chờ xử lý</Badge>;
      case 'PROCESSING':
        return <Badge variant="default"><AlertCircle className="w-3 h-3 mr-1" />Đang xử lý</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Từ chối</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPendingCount = () => {
    return reports.filter(r => r.status === 'PENDING').length;
  };

  const getProcessingCount = () => {
    return reports.filter(r => r.status === 'PROCESSING').length;
  };

  const getResolvedCount = () => {
    return reports.filter(r => r.status === 'RESOLVED').length;
  };

  const openReportDialog = (report: ErrorReport) => {
    setSelectedReport(report);
    setAdminNote(report.adminNote || '');
    setResolution(report.resolution || '');
    setReplacement('');
    setNewStatus(report.status);
    setDialogOpen(true);
  };

  const handleUpdateReport = async () => {
    if (!selectedReport) return;

    // Validate: if status is RESOLVED and productLineId exists, replacement is required
    if (newStatus === 'RESOLVED' && selectedReport.productLineId && !replacement.trim()) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Vui lòng nhập sản phẩm thay thế khi chấp nhận bảo hành',
      });
      return;
    }

    try {
      const response = await fetch(`/api/admin/error-reports/${selectedReport.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          adminNote,
          resolution,
          replacement: replacement.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Thành công',
          description: 'Đã cập nhật báo cáo lỗi',
        });
        setDialogOpen(false);
        fetchReports();
      } else {
        throw new Error(data.error || 'Failed to update');
      }
    } catch (error) {
      console.error('Error updating report:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể cập nhật báo cáo',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-card rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-card rounded"></div>
            <div className="h-24 bg-card rounded"></div>
            <div className="h-24 bg-card rounded"></div>
          </div>
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
          <h1 className="text-3xl font-bold text-text-primary">Quản lý báo cáo lỗi</h1>
          <p className="text-text-muted">
            Xem và xử lý các báo cáo lỗi từ khách hàng
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-muted">Chờ xử lý</p>
                  <p className="text-2xl font-bold text-warning">{getPendingCount()}</p>
                </div>
                <Clock className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-muted">Đang xử lý</p>
                  <p className="text-2xl font-bold text-brand">{getProcessingCount()}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-brand" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-muted">Đã xử lý</p>
                  <p className="text-2xl font-bold text-success">{getResolvedCount()}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Filter className="h-4 w-4 text-text-muted" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                  <SelectItem value="PROCESSING">Đang xử lý</SelectItem>
                  <SelectItem value="RESOLVED">Đã xử lý</SelectItem>
                  <SelectItem value="REJECTED">Từ chối</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reports Table */}
        {reports.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-text-muted opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Chưa có báo cáo lỗi</h3>
              <p className="text-text-muted">Chưa có báo cáo lỗi nào trong hệ thống</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã báo cáo</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Đơn hàng</TableHead>
                  <TableHead>Số sản phẩm</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => {
                  // Support both new schema (productLineId) and legacy schema (reportedProducts)
                  const productCount = report.productLineId
                    ? 1
                    : (report.reportedProducts ? JSON.parse(report.reportedProducts).length : 0);

                  return (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="font-mono text-sm">
                          #{report.id.slice(0, 10)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{report.userEmail}</div>
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/orders/${report.orderId}`}>
                          <div className="font-mono text-sm text-brand hover:underline">
                            #{report.orderId.slice(0, 10)}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{productCount} sản phẩm</div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(report.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-text-muted">
                          {formatDate(report.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openReportDialog(report)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Xem
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>


      {/* Report Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết báo cáo lỗi #{selectedReport?.id.slice(0, 10)}</DialogTitle>
            <DialogDescription>
              Xem và cập nhật trạng thái báo cáo lỗi
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6">
              {/* Report Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-text-muted">Khách hàng</p>
                  <p className="text-sm">{selectedReport.userEmail}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-muted">Đơn hàng</p>
                  <Link href={`/admin/orders/${selectedReport.orderId}`}>
                    <p className="text-sm text-brand hover:underline">
                      #{selectedReport.orderId.slice(0, 10)}
                    </p>
                  </Link>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-muted">Ngày báo cáo</p>
                  <p className="text-sm">{formatDate(selectedReport.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-muted">Trạng thái</p>
                  {getStatusBadge(selectedReport.status)}
                </div>
              </div>

              {/* Reported Products */}
              <div>
                <p className="text-sm font-medium text-text-muted mb-2">Sản phẩm báo lỗi</p>
                <Card>
                  <CardContent className="p-4">
                    {selectedReport.productLineId ? (
                      /* New schema: single product line */
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-text-muted">Sản phẩm</p>
                          <p className="text-sm">{selectedReport.productName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-muted">Nội dung</p>
                          <p className="text-sm font-mono bg-card p-2 rounded border border-border">
                            {selectedReport.originalContent || 'N/A'}
                          </p>
                        </div>
                        {selectedReport.userNote && (
                          <div>
                            <p className="text-sm font-medium text-text-muted">Ghi chú của khách hàng</p>
                            <p className="text-sm">{selectedReport.userNote}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Legacy schema: multiple products in JSON */
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Sản phẩm</TableHead>
                            <TableHead>Nội dung</TableHead>
                            <TableHead className="text-right">Giá trị</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {JSON.parse(selectedReport.reportedProducts || '[]').map((product: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell>{product.productName}</TableCell>
                              <TableCell className="font-mono text-sm">{product.content}</TableCell>
                              <TableCell className="text-right">{formatCurrency(product.priceVnd)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Update Status */}
              <div>
                <p className="text-sm font-medium text-text-muted mb-2">Cập nhật trạng thái</p>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                    <SelectItem value="PROCESSING">Đang xử lý</SelectItem>
                    <SelectItem value="RESOLVED">Đã xử lý</SelectItem>
                    <SelectItem value="REJECTED">Từ chối</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Admin Note */}
              <div>
                <p className="text-sm font-medium text-text-muted mb-2">Ghi chú admin</p>
                <Textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Nhập ghi chú về báo cáo này..."
                  rows={3}
                />
              </div>

              {/* Replacement Product (only if productLineId exists and status is RESOLVED) */}
              {selectedReport.productLineId && newStatus === 'RESOLVED' && (
                <div>
                  <p className="text-sm font-medium text-text-muted mb-2">
                    Sản phẩm thay thế <span className="text-destructive">*</span>
                  </p>
                  <Textarea
                    value={replacement}
                    onChange={(e) => setReplacement(e.target.value)}
                    placeholder="Nhập nội dung sản phẩm thay thế (ví dụ: email:password)"
                    rows={2}
                    className={!replacement.trim() ? 'border-destructive' : ''}
                  />
                  <p className="text-xs text-text-muted mt-1">
                    Sản phẩm thay thế sẽ được hiển thị cho khách hàng khi bảo hành được chấp nhận
                  </p>
                </div>
              )}

              {/* Resolution */}
              <div>
                <p className="text-sm font-medium text-text-muted mb-2">Cách giải quyết</p>
                <Textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Đã hoàn tiền / Đã gửi sản phẩm mới / ..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateReport}>
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

