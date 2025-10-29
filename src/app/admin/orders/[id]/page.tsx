'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Table components removed as they are not used
import { 
  ArrowLeft,
  Package,
  User,
  CreditCard,
  Download,
  Copy,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  FileText
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

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
      images: string[];
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
  licenses: Array<{
    id: string;
    codeOrJwt: string;
    status: string;
    issuedAt: string;
    product: {
      id: string;
      name: string;
      type: string;
    };
  }>;
  downloadUrls: Array<{
    id: string;
    name: string;
    size: number;
    downloadUrl: string;
  }>;
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (params.id) {
      fetchOrder(params.id as string);
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      variant: 'success',
      title: 'Đã sao chép',
      description: `${label} đã được sao chép vào clipboard`,
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
                Đơn hàng #{order.id.slice(0, 8)}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Info */}
            <div className="space-y-6">
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

              {/* Order Items */}
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
                      <div key={item.id} className="flex items-center space-x-4 p-4 border border-border rounded-lg">
                        <div className="w-16 h-16 bg-card rounded-lg overflow-hidden flex-shrink-0">
                          {item.product.images.length > 0 ? (
                            <Image
                              src={item.product.images[0]}
                              alt={item.product.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-text-muted" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <FileText className="h-4 w-4" />
                            <h4 className="font-medium">{item.product.name}</h4>
                          </div>
                          <p className="text-sm text-text-muted">
                            Số lượng: {item.quantity}
                          </p>
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
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Tóm tắt đơn hàng</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Tạm tính:</span>
                      <span>{formatCurrency(order.totalAmountVnd)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Phí vận chuyển:</span>
                      <span className="text-success">Miễn phí</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Thuế:</span>
                      <span>0 VND</span>
                    </div>
                    <div className="border-t border-border pt-2">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Tổng cộng:</span>
                        <span className="text-brand">{formatCurrency(order.totalAmountVnd)}</span>
                      </div>
                    </div>
                  </div>

                  {order.payments.length > 0 && (
                    <div className="border-t border-border pt-4">
                      <h4 className="font-medium mb-2">Thanh toán</h4>
                      <div className="space-y-2">
                        {order.payments.map((payment) => (
                          <div key={payment.id} className="flex justify-between text-sm">
                            <span className="text-text-muted">
                              {payment.provider === 'MANUAL' ? 'Ví nội bộ' : payment.provider}
                            </span>
                            <span>{formatCurrency(payment.amountVnd)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Trạng thái đơn hàng</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Trạng thái hiện tại:</span>
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
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Licenses */}
          {order.status === 'PAID' && order.licenses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Licenses đã cấp</CardTitle>
                <CardDescription>
                  Các license đã được cấp cho đơn hàng này
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.licenses.map((license) => (
                    <div key={license.id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-brand" />
                          <span className="font-medium">{license.product.name}</span>
                        </div>
                        <Badge variant="success">Đã cấp</Badge>
                      </div>
                      <div className="bg-card p-3 rounded-lg font-mono text-sm break-all">
                        {license.codeOrJwt}
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-text-muted">
                          Cấp lúc: {formatDate(license.issuedAt)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(license.codeOrJwt, 'License')}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Sao chép
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Downloads */}
          {order.status === 'PAID' && order.downloadUrls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Files tải xuống</CardTitle>
                <CardDescription>
                  Các file có thể tải xuống cho đơn hàng này
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.downloadUrls.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-brand" />
                        <div>
                          <h4 className="font-medium">{file.name}</h4>
                          <p className="text-sm text-text-muted">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(file.downloadUrl, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Tải xuống
                      </Button>
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



