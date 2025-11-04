'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Table components removed as unused
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package, 
  Eye,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'REVIEW_REQUIRED';
  totalAmountVnd: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    product: {
      id: string;
      name: string;
      slug: string;
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/orders?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: 'Không thể tải danh sách đơn hàng',
        });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Có lỗi xảy ra khi tải đơn hàng',
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

  if (isLoading) {
    return (
      <AppShell>
        <div className="container mx-auto px-4 py-8">
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
    <AppShell>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Đơn hàng của tôi</h1>
              <p className="text-text-muted">
                Quản lý và theo dõi đơn hàng của bạn
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="PENDING">Chờ thanh toán</SelectItem>
                  <SelectItem value="PAID">Đã thanh toán</SelectItem>
                  <SelectItem value="EXPIRED">Hết hạn</SelectItem>
                  <SelectItem value="REVIEW_REQUIRED">Cần xem xét</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Orders List */}
          {orders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-4 text-text-muted opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Chưa có đơn hàng</h3>
                <p className="text-text-muted mb-6">Bạn chưa có đơn hàng nào</p>
                <Link href="/products">
                  <Button>
                    <Package className="h-4 w-4 mr-2" />
                    Khám phá sản phẩm
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-semibold text-lg">
                            Đơn hàng #{order.id.slice(0, 10)}
                          </h3>
                          <p className="text-sm text-text-muted">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-brand">
                          {formatCurrency(order.totalAmountVnd)}
                        </div>
                        <div className="text-sm text-text-muted">
                          {order.items.length} sản phẩm
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2 mb-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5" />
                            <div>
                              <h4 className="font-medium">{item.product.name}</h4>
                              <p className="text-sm text-text-muted">
                                Số lượng: {item.quantity}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm font-medium">
                            {formatCurrency(item.priceVnd * item.quantity)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-text-muted">
                        Cập nhật lần cuối: {formatDate(order.updatedAt)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link href={`/orders/${order.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Xem chi tiết
                          </Button>
                        </Link>
                        {order.status === 'PAID' && (
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Tải xuống
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {orders.length > 0 && (
            <div className="flex justify-center">
              <div className="flex items-center space-x-2">
                <Button variant="outline" disabled>
                  Trước
                </Button>
                <Button variant="default">1</Button>
                <Button variant="outline">2</Button>
                <Button variant="outline">3</Button>
                <Button variant="outline">
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



