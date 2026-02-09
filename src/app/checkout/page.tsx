'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  CreditCard,
  Wallet,
  ArrowLeft,
  Package,
  CheckCircle,
  AlertCircle,
  Loader2,
  Tag,
  X
} from 'lucide-react';
import { formatCurrency, safeParseImages } from '@/lib/utils';
import { useCart } from '@/hooks/use-cart';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  image?: string;
  type: 'FILE' | 'LICENSE' | 'APP';
}

interface WalletData {
  balance: number;
  currency: string;
}

interface AppliedCoupon {
  code: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  discount: number;
}

export default function CheckoutPage() {
  const { cart, clearCart, getTotal, getItemCount } = useCart();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    loadCheckoutData();
  }, []);

  const loadCheckoutData = async () => {
    try {
      // Load wallet balance
      const walletRes = await fetch('/api/wallet/balance');
      if (walletRes.ok) {
        const walletData = await walletRes.json();
        setWallet(walletData);
      }
    } catch (error) {
      console.error('Error loading checkout data:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tải dữ liệu thanh toán',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Vui lòng nhập mã coupon',
      });
      return;
    }

    setIsValidatingCoupon(true);

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode,
          orderTotal: getTotal(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        setAppliedCoupon({
          code: data.coupon.code,
          description: data.coupon.description,
          discountType: data.coupon.discountType,
          discountValue: data.coupon.discountValue,
          discount: data.discount,
        });
        toast({
          variant: 'success',
          title: 'Áp dụng thành công!',
          description: `Bạn được giảm ${formatCurrency(data.discount)}`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Mã không hợp lệ',
          description: data.error || 'Mã coupon không hợp lệ',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể kiểm tra mã coupon',
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast({
      title: 'Đã xóa mã giảm giá',
    });
  };

  const getSubtotal = () => {
    return getTotal();
  };

  const getDiscount = () => {
    return appliedCoupon?.discount || 0;
  };

  const getFinalTotal = () => {
    return getSubtotal() - getDiscount();
  };

  const handlePayWithWallet = async () => {
    if (!wallet) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tải thông tin ví',
      });
      return;
    }

    const finalTotal = getFinalTotal();

    if (wallet.balance < finalTotal) {
      toast({
        variant: 'destructive',
        title: 'Số dư không đủ',
        description: 'Vui lòng nạp thêm tiền vào ví để thanh toán',
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create order with coupon
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.id,
            quantity: item.quantity,
          })),
          couponCode: appliedCoupon?.code, // Include coupon code
        }),
      });

      if (!orderRes.ok) {
        const errorData = await orderRes.json();
        throw new Error(errorData.error || 'Không thể tạo đơn hàng');
      }

      const orderData = await orderRes.json();
      const orderId = orderData.data.id;

      // Pay with wallet
      const paymentRes = await fetch(`/api/orders/${orderId}/pay-with-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!paymentRes.ok) {
        const errorData = await paymentRes.json();
        throw new Error(errorData.error || 'Thanh toán thất bại');
      }

      // Clear cart
      clearCart();

      toast({
        variant: 'success',
        title: 'Thanh toán thành công!',
        description: 'Đơn hàng đã được thanh toán và sẽ được xử lý ngay',
      });

      // Redirect to order detail
      router.push(`/orders/${orderId}`);
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi thanh toán',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra khi thanh toán',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-card rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 bg-card rounded"></div>
              <div className="h-64 bg-card rounded"></div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (cart.length === 0) {
    return (
      <AppShell>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-text-muted opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Giỏ hàng trống</h3>
              <p className="text-text-muted mb-6">Bạn cần có sản phẩm trong giỏ hàng để thanh toán</p>
              <Link href="/products">
                <Button>
                  <Package className="h-4 w-4 mr-2" />
                  Khám phá sản phẩm
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const finalTotal = getFinalTotal();
  const hasEnoughBalance = wallet && wallet.balance >= finalTotal;

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Thanh toán</h1>
              <p className="text-text-muted">
                Hoàn tất đơn hàng của bạn
              </p>
            </div>
            <Link href="/cart">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại giỏ hàng
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Đơn hàng của bạn</CardTitle>
                  <CardDescription>
                    {getItemCount()} sản phẩm
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead>Số lượng</TableHead>
                        <TableHead>Giá</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item) => {
                        const images = safeParseImages(item.images);
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-card rounded-lg overflow-hidden flex-shrink-0">
                                  {images[0] ? (
                                    <Image
                                      src={images[0]}
                                      alt={item.name}
                                      width={48}
                                      height={48}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="h-4 w-4 text-text-muted" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm">{item.name}</h4>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{item.quantity}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-medium">
                                {formatCurrency(item.priceVnd * item.quantity)}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  <div className="border-t border-border pt-4 mt-4">
                    {/* Coupon Section */}
                    <div className="mb-4 p-3 bg-card-dark rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="h-4 w-4 text-brand" />
                        <span className="text-sm font-medium">Mã giảm giá</span>
                      </div>

                      {appliedCoupon ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 bg-success/10 border border-success/20 rounded">
                            <div className="flex items-center gap-2">
                              <Badge variant="success" className="font-mono">
                                {appliedCoupon.code}
                              </Badge>
                              <span className="text-sm text-text-muted">
                                {appliedCoupon.discountType === 'PERCENTAGE'
                                  ? `-${appliedCoupon.discountValue}%`
                                  : `-${formatCurrency(appliedCoupon.discountValue)}`}
                              </span>
                            </div>
                            <button
                              onClick={removeCoupon}
                              className="text-text-muted hover:text-text-primary"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          {appliedCoupon.description && (
                            <p className="text-xs text-text-muted">{appliedCoupon.description}</p>
                          )}
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Nhập mã giảm giá"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            onKeyPress={(e) => e.key === 'Enter' && validateCoupon()}
                            disabled={isValidatingCoupon}
                            className="flex-1"
                          />
                          <Button
                            onClick={validateCoupon}
                            disabled={isValidatingCoupon || !couponCode.trim()}
                            variant="outline"
                          >
                            {isValidatingCoupon ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Áp dụng'
                            )}
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">Tạm tính:</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>

                      {discount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-text-muted">Giảm giá:</span>
                          <span className="text-success">-{formatCurrency(discount)}</span>
                        </div>
                      )}

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
                          <span className="text-brand">{formatCurrency(finalTotal)}</span>
                        </div>
                        {discount > 0 && (
                          <div className="text-xs text-success mt-1 text-right">
                            Tiết kiệm {formatCurrency(discount)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Method */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Phương thức thanh toán</CardTitle>
                  <CardDescription>
                    Chọn cách thanh toán phù hợp
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Wallet Balance */}
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Wallet className="h-5 w-5 text-brand" />
                        <span className="font-medium">Ví nội bộ</span>
                      </div>
                      <Badge variant={hasEnoughBalance ? "success" : "warning"}>
                        {hasEnoughBalance ? "Đủ tiền" : "Thiếu tiền"}
                      </Badge>
                    </div>
                    <div className="text-sm text-text-muted">
                      Số dư: <span className="font-medium text-text-primary">
                        {wallet ? formatCurrency(wallet.balance) : '...'}
                      </span>
                    </div>
                    {!hasEnoughBalance && (
                      <div className="mt-2 text-sm text-warning flex items-center space-x-1">
                        <AlertCircle className="h-4 w-4" />
                        <span>Cần thêm {formatCurrency(finalTotal - (wallet?.balance || 0))}</span>
                      </div>
                    )}
                  </div>

                  {/* Payment Button */}
                  <div className="space-y-3">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handlePayWithWallet}
                      disabled={!hasEnoughBalance || isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5 mr-2" />
                          Thanh toán bằng ví
                        </>
                      )}
                    </Button>

                    {!hasEnoughBalance && (
                      <div className="text-center">
                        <Link href="/wallet">
                          <Button variant="outline" className="w-full">
                            <Wallet className="h-4 w-4 mr-2" />
                            Nạp tiền vào ví
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Payment Info */}
                  <div className="text-xs text-text-muted space-y-1">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 text-success" />
                      <span>Thanh toán an toàn và nhanh chóng</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 text-success" />
                      <span>Nhận sản phẩm ngay sau khi thanh toán</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 text-success" />
                      <span>Hỗ trợ 24/7</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}



