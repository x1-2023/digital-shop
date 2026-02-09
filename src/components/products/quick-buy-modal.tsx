'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ShoppingCart, Minus, Plus, Shield, Zap, Headphones, Loader2, Tag, CheckCircle, AlertCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, safeParseImages } from '@/lib/utils';

interface Product {
    id: string;
    name: string;
    slug: string;
    priceVnd: number;
    stock: number;
    images?: string;
    category?: {
        name: string;
    };
}

interface QuickBuyModalProps {
    product: Product;
    isOpen: boolean;
    onClose: () => void;
}

interface CouponResult {
    valid: boolean;
    discountAmount: number;
    finalTotal: number;
    coupon?: {
        code: string;
        description?: string;
        discountType: string;
        discountValue: number;
    };
    error?: string;
}

export function QuickBuyModal({ product, isOpen, onClose }: QuickBuyModalProps) {
    const router = useRouter();
    const images = safeParseImages(product.images as string);

    const [quantity, setQuantity] = useState(1);
    const [couponCode, setCouponCode] = useState('');
    const [couponResult, setCouponResult] = useState<CouponResult | null>(null);
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [userBalance, setUserBalance] = useState<number | null>(null);

    const subtotal = product.priceVnd * quantity;
    const discount = couponResult?.valid ? couponResult.discountAmount : 0;
    const total = subtotal - discount;

    // Fetch user balance
    useEffect(() => {
        if (isOpen) {
            fetchBalance();
        }
    }, [isOpen]);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setQuantity(1);
            setCouponCode('');
            setCouponResult(null);
        }
    }, [isOpen]);

    const fetchBalance = async () => {
        try {
            const response = await fetch('/api/wallet/balance');
            if (response.ok) {
                const data = await response.json();
                setUserBalance(data.balance || 0);
            }
        } catch (error) {
            console.error('Error fetching balance:', error);
        }
    };

    const handleQuantityChange = (delta: number) => {
        const newQty = quantity + delta;
        if (newQty >= 1 && newQty <= product.stock) {
            setQuantity(newQty);
            // Recalculate coupon if applied
            if (couponResult?.valid) {
                validateCoupon(product.priceVnd * newQty);
            }
        }
    };

    const validateCoupon = async (orderTotal?: number) => {
        if (!couponCode.trim()) {
            setCouponResult(null);
            return;
        }

        setIsValidatingCoupon(true);
        try {
            const response = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: couponCode.trim(),
                    orderTotal: orderTotal || subtotal,
                }),
            });

            const data = await response.json();

            if (response.ok && data.valid) {
                setCouponResult({
                    valid: true,
                    discountAmount: data.discountAmount,
                    finalTotal: data.finalTotal,
                    coupon: data.coupon,
                });
            } else {
                setCouponResult({
                    valid: false,
                    discountAmount: 0,
                    finalTotal: subtotal,
                    error: data.error || 'Mã giảm giá không hợp lệ',
                });
            }
        } catch (error) {
            setCouponResult({
                valid: false,
                discountAmount: 0,
                finalTotal: subtotal,
                error: 'Lỗi khi kiểm tra mã giảm giá',
            });
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    const handleCheckout = async () => {
        if (userBalance !== null && userBalance < total) {
            router.push('/wallet');
            onClose();
            return;
        }

        setIsCheckingOut(true);
        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: [
                        {
                            productId: product.id,
                            quantity: quantity,
                        },
                    ],
                    couponCode: couponResult?.valid ? couponCode.trim() : undefined,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                onClose();
                router.push(`/orders/${data.order.id}`);
            } else {
                alert(data.error || 'Có lỗi xảy ra khi đặt hàng');
            }
        } catch (error) {
            alert('Có lỗi xảy ra khi đặt hàng');
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden">
                <DialogHeader className="p-4 pb-0">
                    <DialogTitle className="text-base font-bold line-clamp-2 pr-8">
                        {product.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="p-4 pt-2">
                    {/* Main Content - 2 columns */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Left Column - Product Info & Quantity */}
                        <div className="flex-1 space-y-4">
                            {/* Price */}
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-red-500">
                                    {formatCurrency(product.priceVnd)}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    / {product.category?.name || 'Sản phẩm'}
                                </span>
                            </div>

                            {/* Quantity Selector */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <ShoppingCart className="w-4 h-4" />
                                    <span>Số lượng mua</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleQuantityChange(-1)}
                                        disabled={quantity <= 1}
                                        className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={product.stock}
                                        value={quantity}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 1;
                                            if (val >= 1 && val <= product.stock) {
                                                setQuantity(val);
                                            }
                                        }}
                                        className="w-24 text-center text-lg font-semibold"
                                    />
                                    <button
                                        onClick={() => handleQuantityChange(1)}
                                        disabled={quantity >= product.stock}
                                        className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Tối đa có thể mua: <span className="font-semibold text-brand">{product.stock}</span>
                                </p>
                            </div>

                            {/* Coupon Input */}
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Nhập mã giảm giá (nếu có)"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            className="pl-10"
                                        />
                                    </div>
                                    <Button
                                        onClick={() => validateCoupon()}
                                        disabled={!couponCode.trim() || isValidatingCoupon}
                                        variant="secondary"
                                        className="shrink-0"
                                    >
                                        {isValidatingCoupon ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            'Áp dụng'
                                        )}
                                    </Button>
                                </div>
                                {couponResult && (
                                    <div className={`flex items-center gap-2 text-sm ${couponResult.valid ? 'text-green-500' : 'text-red-500'}`}>
                                        {couponResult.valid ? (
                                            <>
                                                <CheckCircle className="w-4 h-4" />
                                                <span>Đã áp dụng: -{formatCurrency(couponResult.discountAmount)}</span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle className="w-4 h-4" />
                                                <span>{couponResult.error}</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Order Summary */}
                        <div className="sm:w-56 bg-secondary/50 rounded-xl p-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Số dư hiện tại:</span>
                                <span className="font-semibold text-brand">
                                    {userBalance !== null ? formatCurrency(userBalance) : '...'}
                                </span>
                            </div>

                            <div className="border-t border-border pt-3 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Tạm tính:</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Giảm giá:</span>
                                    <span className={discount > 0 ? 'text-green-500' : ''}>
                                        {discount > 0 ? `-${formatCurrency(discount)}` : '0 đ'}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-border pt-3">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Thanh toán:</span>
                                    <span className="text-xl font-bold text-red-500">
                                        {formatCurrency(total)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Checkout Button */}
                    <Button
                        onClick={handleCheckout}
                        disabled={isCheckingOut || quantity < 1}
                        className="w-full mt-4 h-12 bg-blue-500 hover:bg-blue-600 text-white font-bold text-base rounded-xl shadow-lg shadow-blue-500/30"
                    >
                        {isCheckingOut ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Đang xử lý...
                            </>
                        ) : userBalance !== null && userBalance < total ? (
                            <>
                                <ShoppingCart className="w-5 h-5 mr-2" />
                                Nạp thêm tiền
                            </>
                        ) : (
                            <>
                                <ShoppingCart className="w-5 h-5 mr-2" />
                                Thanh toán {formatCurrency(total)}
                            </>
                        )}
                    </Button>

                    {/* Trust Badges */}
                    <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5 text-green-500" />
                            <span>An toàn</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5 text-yellow-500" />
                            <span>Tự động</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Headphones className="w-3.5 h-3.5 text-blue-500" />
                            <span>Hỗ trợ 24/7</span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
