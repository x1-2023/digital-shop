'use client';

import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus,
  Package,
  ArrowLeft,
  CreditCard
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/hooks/use-cart';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

export default function CartPage() {
  const { 
    cart, 
    isLoaded,
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getTotal, 
    getItemCount 
  } = useCart();
  const { toast } = useToast();

  const handleRemoveItem = (productId: string) => {
    removeFromCart(productId);
    toast({
      variant: 'success',
      title: 'Đã xóa khỏi giỏ hàng',
      description: 'Sản phẩm đã được xóa khỏi giỏ hàng',
    });
  };

  const handleClearCart = () => {
    clearCart();
    toast({
      variant: 'success',
      title: 'Đã xóa giỏ hàng',
      description: 'Tất cả sản phẩm đã được xóa khỏi giỏ hàng',
    });
  };

  if (!isLoaded) {
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

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Giỏ hàng</h1>
              <p className="text-text-muted">
                {getItemCount()} sản phẩm trong giỏ hàng
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/products">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tiếp tục mua sắm
              </Link>
            </Button>
          </div>

          {cart.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-text-muted opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Giỏ hàng trống</h3>
                <p className="text-text-muted mb-6">Bạn chưa có sản phẩm nào trong giỏ hàng</p>
                <Button asChild>
                  <Link href="/products">
                    <Package className="h-4 w-4 mr-2" />
                    Khám phá sản phẩm
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Sản phẩm trong giỏ</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearCart}
                        className="text-danger hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa tất cả
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sản phẩm</TableHead>
                          <TableHead>Giá</TableHead>
                          <TableHead>Số lượng</TableHead>
                          <TableHead>Tổng</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cart.map((item) => {
                          const images = item.images ? JSON.parse(item.images) : [];
                          return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="w-16 h-16 bg-card rounded-lg overflow-hidden flex-shrink-0">
                                  {images[0] ? (
                                    <Image
                                      src={images[0]}
                                      alt={item.name}
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
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-medium truncate">{item.name}</h4>
                                  <p className="text-sm text-text-muted">
                                    Còn lại: {item.stock} sản phẩm
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {formatCurrency(item.priceVnd)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  disabled={item.quantity >= item.stock}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-brand">
                                {formatCurrency(item.priceVnd * item.quantity)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-danger hover:text-danger"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="sticky top-6">
                  <CardHeader>
                    <CardTitle>Tóm tắt đơn hàng</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">Tạm tính:</span>
                        <span>{formatCurrency(getTotal())}</span>
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
                          <span className="text-brand">{formatCurrency(getTotal())}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button className="w-full" size="lg" asChild>
                        <Link href="/checkout">
                          <CreditCard className="h-5 w-5 mr-2" />
                          Thanh toán
                        </Link>
                      </Button>
                      
                      <div className="text-xs text-text-muted text-center">
                        <p>Bạn có thể thanh toán bằng ví nội bộ</p>
                        <p>hoặc nạp tiền qua QR code</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}



