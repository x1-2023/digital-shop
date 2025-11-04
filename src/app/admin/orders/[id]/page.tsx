'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ArrowLeft,
  Package,
  User,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Check,
  X as XIcon,
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
  user: {
    id: string;
    email: string;
    role: string;
  };
  items: Array<{
    id: string;
    product: {
      id: string;
      name: string;
      type: 'FILE' | 'LICENSE' | 'APP';
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

export default function AdminOrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [productLines, setProductLines] = useState<ProductLineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingLine, setEditingLine] = useState<string | null>(null);
  const [replacementText, setReplacementText] = useState('');
  const [adminNoteText, setAdminNoteText] = useState('');
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
          description: 'Không tìm thấy đơn hàng',
        });
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tải thông tin đơn hàng',
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

  const startEditing = (line: ProductLineItem) => {
    setEditingLine(line.id);
    setReplacementText(line.replacement || '');
    setAdminNoteText(line.adminNote || '');
  };

  const cancelEditing = () => {
    setEditingLine(null);
    setReplacementText('');
    setAdminNoteText('');
  };

  const handleReplace = async (lineId: string) => {
    if (!replacementText.trim()) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Vui lòng nhập nội dung thay thế',
      });
      return;
    }

    try {
      const response = await fetch(`/api/admin/product-lines/${lineId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'replace',
          replacement: replacementText,
          adminNote: adminNoteText || null,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Thành công',
          description: 'Đã thay thế sản phẩm',
        });
        cancelEditing();
        if (params.id) {
          fetchProductLines(params.id as string);
        }
      } else {
        throw new Error(data.error || 'Failed to replace');
      }
    } catch (error) {
      console.error('Error replacing product line:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể thay thế sản phẩm',
      });
    }
  };

  const handleReject = async (lineId: string) => {
    try {
      const response = await fetch(`/api/admin/product-lines/${lineId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject',
          adminNote: adminNoteText || 'Từ chối bảo hành',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Thành công',
          description: 'Đã từ chối bảo hành',
        });
        cancelEditing();
        if (params.id) {
          fetchProductLines(params.id as string);
        }
      } else {
        throw new Error(data.error || 'Failed to reject');
      }
    } catch (error) {
      console.error('Error rejecting warranty:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể từ chối bảo hành',
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
    if (line.status === 'REPLACED') {
      return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Đã thay thế</Badge>;
    }
    if (line.status === 'WARRANTY_REJECTED') {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Từ chối</Badge>;
    }
    if (line.status === 'ERROR_REPORTED') {
      return <Badge variant="warning"><AlertTriangle className="w-3 h-3 mr-1" />Báo lỗi</Badge>;
    }
    return <Badge variant="outline">Bình thường</Badge>;
  };

  // Calculate days since paid
  const getDaysSincePaid = () => {
    if (!order || order.status !== 'PAID') return null;
    const paidDate = new Date(order.updatedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - paidDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysLeft = getDaysSincePaid() ? 30 - getDaysSincePaid()! : null;

  // Get error count
  const errorCount = productLines.filter(l => l.errorReported).length;

  if (isLoading) {
    return (
      <AppShell isAdmin>
        <div className="flex-1 p-6">
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
      <AppShell isAdmin>
        <div className="flex-1 p-6">
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-text-muted opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Đơn hàng không tồn tại</h3>
              <p className="text-text-muted mb-6">Đơn hàng bạn tìm kiếm không tồn tại hoặc đã bị xóa</p>
              <Link href="/admin/orders">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại danh sách
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell isAdmin>
      <div className="flex-1 p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">
                Đơn hàng #{order.id.slice(0, 10)}
              </h1>
              <p className="text-text-muted">
                Đặt lúc {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {getStatusBadge(order.status)}
              <Link href="/admin/orders">
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
                    <p className="font-semibold text-warning">Cảnh báo tự động xóa</p>
                    <p className="text-sm text-text-muted">
                      Sản phẩm sẽ bị xóa sau <span className="font-bold text-warning">{daysLeft} ngày</span>.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Summary Card */}
          {order.status === 'PAID' && errorCount > 0 && (
            <Card className="border-destructive bg-destructive/10">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-destructive">Có {errorCount} sản phẩm báo lỗi</p>
                    <p className="text-sm text-text-muted">
                      Khách hàng đã báo lỗi {errorCount} sản phẩm. Vui lòng xử lý bảo hành.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Thông tin khách hàng</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-text-muted">Email</label>
                  <p className="text-text-primary">{order.user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-muted">User ID</label>
                  <p className="text-text-primary font-mono text-sm">{order.user.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-muted">Vai trò</label>
                  <Badge variant={order.user.role === 'ADMIN' ? 'destructive' : 'default'}>
                    {order.user.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Tóm tắt đơn hàng</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Tổng cộng:</span>
                    <span className="text-brand font-bold text-lg">{formatCurrency(order.totalAmountVnd)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Trạng thái:</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Ngày tạo:</span>
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Cập nhật cuối:</span>
                    <span>{formatDate(order.updatedAt)}</span>
                  </div>
                </div>

                {order.payments.length > 0 && (
                  <div className="border-t border-border pt-3">
                    <h4 className="font-medium mb-2 text-sm">Thanh toán</h4>
                    {order.payments.map((payment) => (
                      <div key={payment.id} className="flex justify-between text-sm">
                        <span className="text-text-muted">
                          {payment.provider === 'MANUAL' ? 'Ví nội bộ' : payment.provider}
                        </span>
                        <span>{formatCurrency(payment.amountVnd)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Product Lines Management */}
          {order.status === 'PAID' && productLines.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Quản lý sản phẩm ({productLines.length} items)</CardTitle>
                    <CardDescription>
                      {errorCount > 0 ? `${errorCount} sản phẩm báo lỗi cần xử lý` : 'Tất cả sản phẩm bình thường'}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => params.id && fetchProductLines(params.id as string)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Làm mới
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead className="w-1/3">Nội dung gốc</TableHead>
                      <TableHead className="w-1/3">Thay thế / Ghi chú</TableHead>
                      <TableHead className="text-right">Giá trị</TableHead>
                      <TableHead className="text-center">Trạng thái</TableHead>
                      <TableHead className="text-center">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productLines.map((line) => (
                      <TableRow
                        key={line.id}
                        className={line.errorReported ? 'bg-warning/10' : ''}
                      >
                        <TableCell className="font-medium">{line.productName}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {line.replacement && (
                            <div className="line-through text-text-muted mb-1">
                              {line.content}
                            </div>
                          )}
                          {!line.replacement && line.content}
                        </TableCell>
                        <TableCell>
                          {editingLine === line.id ? (
                            <div className="space-y-2">
                              <Input
                                placeholder="Nội dung thay thế..."
                                value={replacementText}
                                onChange={(e) => setReplacementText(e.target.value)}
                                className="text-sm"
                              />
                              <Textarea
                                placeholder="Ghi chú (tùy chọn)..."
                                value={adminNoteText}
                                onChange={(e) => setAdminNoteText(e.target.value)}
                                rows={2}
                                className="text-sm"
                              />
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {line.replacement && (
                                <div className="font-mono text-sm text-success font-semibold">
                                  {line.replacement}
                                </div>
                              )}
                              {line.adminNote && (
                                <div className="text-xs text-text-muted italic">
                                  {line.adminNote}
                                </div>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(line.priceVnd)}</TableCell>
                        <TableCell className="text-center">
                          {getLineStatusBadge(line)}
                        </TableCell>
                        <TableCell>
                          {editingLine === line.id ? (
                            <div className="flex items-center justify-center space-x-1">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleReplace(line.id)}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Thay thế
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(line.id)}
                              >
                                <XIcon className="h-3 w-3 mr-1" />
                                Từ chối
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditing}
                              >
                                Hủy
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              {line.errorReported && line.status === 'ERROR_REPORTED' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEditing(line)}
                                >
                                  Xử lý
                                </Button>
                              )}
                              {line.status === 'REPLACED' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEditing(line)}
                                >
                                  Sửa
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Order Items (if not paid) */}
          {order.status !== 'PAID' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Sản phẩm đã mua</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
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
                        <div className="font-medium">
                          {formatCurrency(item.priceVnd * item.quantity)}
                        </div>
                        <div className="text-sm text-text-muted">
                          {formatCurrency(item.priceVnd)}/sản phẩm
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
