'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Package,
  ArrowLeft,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Upload,
  RefreshCw
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface ProductLineItem {
  id: string;
  productLogId: string;
  orderId: string;
  productName: string;
  content: string;
  priceVnd: number;
  status: 'NORMAL' | 'ERROR_REPORTED' | 'REPLACED' | 'WARRANTY_REJECTED';
  errorReported: boolean;
  replacement: string | null;
  adminNote: string | null;
  rejectedAt: string | null;
  replacedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Order {
  id: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'REVIEW_REQUIRED';
  totalAmountVnd: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  orderItems: Array<{
    id: string;
    product: {
      id: string;
      name: string;
      slug: string;
      images: string | null;
    };
    quantity: number;
    priceVnd: number;
  }>;
  payments: Array<{
    id: string;
    provider: string;
    amountVnd: number;
    createdAt: string;
  }>;
}

export default function OrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [productLines, setProductLines] = useState<ProductLineItem[]>([]);
  const [selectedLines, setSelectedLines] = useState<Set<string>>(new Set());
  const [bulkErrorText, setBulkErrorText] = useState('');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (params.id) {
      fetchOrder(params.id as string);
      fetchProductLines(params.id as string);
    }
  }, [params.id]);

  const fetchOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
      } else {
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: 'Không thể tải thông tin đơn hàng',
        });
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Có lỗi xảy ra khi tải đơn hàng',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductLines = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/product-lines`);
      if (response.ok) {
        const data = await response.json();
        setProductLines(data.productLines || []);
      }
    } catch (error) {
      console.error('Error fetching product lines:', error);
    }
  };

  const toggleSelectLine = async (lineId: string) => {
    try {
      // Toggle in UI immediately
      const newSelected = new Set(selectedLines);
      if (newSelected.has(lineId)) {
        newSelected.delete(lineId);
      } else {
        newSelected.add(lineId);
      }
      setSelectedLines(newSelected);

      // Call API to toggle error status
      const response = await fetch(`/api/product-lines/${lineId}/toggle-error`, {
        method: 'PATCH',
      });

      if (response.ok) {
        // Refresh product lines to get updated status
        if (params.id) {
          fetchProductLines(params.id as string);
        }
      } else {
        throw new Error('Failed to toggle error status');
      }
    } catch (error) {
      console.error('Error toggling line:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái báo lỗi',
      });
      // Revert UI change
      const revertSelected = new Set(selectedLines);
      if (revertSelected.has(lineId)) {
        revertSelected.delete(lineId);
      } else {
        revertSelected.add(lineId);
      }
      setSelectedLines(revertSelected);
    }
  };

  const toggleSelectAll = () => {
    if (selectedLines.size === productLines.length) {
      setSelectedLines(new Set());
    } else {
      setSelectedLines(new Set(productLines.map(l => l.id)));
    }
  };

  const bulkUploadErrors = async () => {
    if (!order || !bulkErrorText.trim()) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Vui lòng nhập ít nhất một sản phẩm lỗi',
      });
      return;
    }

    try {
      // Split by lines
      const lines = bulkErrorText.split('\n').filter(l => l.trim());

      const response = await fetch(`/api/orders/${order.id}/bulk-report-error`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errorContents: lines,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Thành công',
          description: data.message,
        });
        setBulkErrorText('');
        setShowBulkUpload(false);
        // Refresh product lines
        fetchProductLines(order.id);
      } else {
        throw new Error(data.error || 'Failed to upload');
      }
    } catch (error) {
      console.error('Error bulk uploading errors:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tải lên sản phẩm lỗi',
      });
    }
  };

  const downloadOrder = async () => {
    if (!order) return;
    try {
      const response = await fetch(`/api/orders/${order.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${order.id.slice(0, 10).toUpperCase()}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: 'Thành công',
          description: 'Đã tải xuống thông tin đơn hàng',
        });
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tải xuống thông tin đơn hàng',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Đã thanh toán</Badge>;
      case 'PENDING':
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />Chờ thanh toán</Badge>;
      case 'EXPIRED':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Hết hạn</Badge>;
      case 'REVIEW_REQUIRED':
        return <Badge variant="warning"><AlertCircle className="w-3 h-3 mr-1" />Cần xem xét</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLineStatusBadge = (line: ProductLineItem) => {
    if (line.status === 'REPLACED' && line.replacement) {
      return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Đã thay thế</Badge>;
    }
    if (line.status === 'WARRANTY_REJECTED') {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Từ chối BH</Badge>;
    }
    if (line.status === 'ERROR_REPORTED') {
      return <Badge variant="warning"><AlertTriangle className="w-3 h-3 mr-1" />Đang xử lý</Badge>;
    }
    return null;
  };

  const getDisplayContent = (line: ProductLineItem) => {
    // If replaced, show replacement content
    if (line.replacement) {
      return line.replacement;
    }
    // Otherwise show original content
    return line.content;
  };

  // Calculate days since order paid
  const getDaysSincePaid = () => {
    if (!order || order.status !== 'PAID') return null;
    const paidDate = new Date(order.updatedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - paidDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysLeft = getDaysSincePaid() ? 30 - getDaysSincePaid()! : null;

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

  if (!order) {
    return (
      <AppShell>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-text-muted opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Không tìm thấy đơn hàng</h3>
              <p className="text-text-muted mb-6">Đơn hàng không tồn tại hoặc bạn không có quyền truy cập</p>
              <Link href="/orders">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại danh sách đơn hàng
                </Button>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">
                Đơn hàng #{order.id.slice(0, 10).toUpperCase()}
              </h1>
              <p className="text-text-muted">
                Đặt lúc {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {getStatusBadge(order.status)}
              <Link href="/orders">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại
                </Button>
              </Link>
            </div>
          </div>

          {/* 30-day warning */}
          {order.status === 'PAID' && daysLeft !== null && daysLeft > 0 && (
            <Card className="border-warning bg-warning/10">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-warning">Thông báo quan trọng</p>
                    <p className="text-sm text-text-muted">
                      Đơn hàng sẽ bị xóa sản phẩm sau <span className="font-bold text-warning">{daysLeft} ngày</span> nữa.
                      Vui lòng lưu về máy để tránh mất hàng!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin đơn hàng</CardTitle>
              <CardDescription>Chi tiết đơn hàng và thanh toán</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-text-muted">Tổng tiền</p>
                    <p className="text-2xl font-bold text-brand">{formatCurrency(order.totalAmountVnd)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-muted">Phương thức thanh toán</p>
                    <p className="text-sm">Ví nội bộ</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-text-muted">Trạng thái</p>
                    {getStatusBadge(order.status)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-muted">Cập nhật lần cuối</p>
                    <p className="text-sm">{formatDate(order.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Old Orders - Simple Download */}
          {order.status === 'PAID' && productLines.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sản phẩm đã mua</CardTitle>
                <CardDescription>Tải xuống thông tin sản phẩm</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Package className="h-16 w-16 mx-auto mb-4 text-brand opacity-50" />
                  <p className="text-text-muted mb-6">
                    Đơn hàng của bạn đã được thanh toán thành công.<br />
                    Nhấn nút bên dưới để tải xuống thông tin sản phẩm.
                  </p>
                  <Button
                    size="lg"
                    onClick={downloadOrder}
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Tải xuống sản phẩm
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Product Lines Table */}
          {order.status === 'PAID' && productLines.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Sản phẩm đã mua</CardTitle>
                    <CardDescription>{productLines.length} items</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBulkUpload(!showBulkUpload)}
                      className="border-2 border-red-500 hover:bg-red-50"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Tải lên sản phẩm lỗi
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadOrder}
                      className="border-2 border-green-500 hover:bg-green-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Tải xuống hàng loạt
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchProductLines(order.id)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Làm mới
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Bulk Upload Section */}
                {showBulkUpload && (
                  <div className="mb-6 p-4 border border-border rounded-lg bg-card-hover">
                    <p className="text-sm font-medium mb-2">Paste sản phẩm lỗi (mỗi dòng 1 sản phẩm)</p>
                    <Textarea
                      value={bulkErrorText}
                      onChange={(e) => setBulkErrorText(e.target.value)}
                      placeholder="account1&#10;account2&#10;account3"
                      rows={5}
                      className="mb-3"
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowBulkUpload(false);
                          setBulkErrorText('');
                        }}
                      >
                        Hủy
                      </Button>
                      <Button
                        size="sm"
                        onClick={bulkUploadErrors}
                      >
                        Gửi báo cáo
                      </Button>
                    </div>
                  </div>
                )}

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Báo lỗi</TableHead>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead className="w-1/2">Nội dung</TableHead>
                      <TableHead className="text-right">Giá trị</TableHead>
                      <TableHead className="text-center">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productLines.map((line) => (
                      <TableRow
                        key={line.id}
                        className={line.replacement ? 'bg-success/10' : ''}
                      >
                        <TableCell>
                          <Checkbox
                            checked={line.errorReported}
                            onCheckedChange={() => toggleSelectLine(line.id)}
                            disabled={line.status === 'WARRANTY_REJECTED'}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{line.productName}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {line.replacement && (
                              <div className="font-mono text-sm text-success line-through">
                                {line.content}
                              </div>
                            )}
                            <div className={`font-mono text-sm ${line.replacement ? 'text-success font-semibold' : ''}`}>
                              {getDisplayContent(line)}
                            </div>
                            {line.adminNote && (
                              <div className="text-xs text-text-muted italic">
                                Ghi chú: {line.adminNote}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(line.priceVnd)}</TableCell>
                        <TableCell className="text-center">
                          {getLineStatusBadge(line)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Order Items (if not paid yet) */}
          {order.status !== 'PAID' && (
            <Card>
              <CardHeader>
                <CardTitle>Sản phẩm trong đơn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.orderItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                      <div className="flex items-center space-x-4">
                        <Package className="h-8 w-8 text-brand" />
                        <div>
                          <h4 className="font-medium">{item.product.name}</h4>
                          <p className="text-sm text-text-muted">
                            Số lượng: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-brand">
                          {formatCurrency(item.priceVnd * item.quantity)}
                        </div>
                        <div className="text-sm text-text-muted">
                          {formatCurrency(item.priceVnd)} x {item.quantity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
