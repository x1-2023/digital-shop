'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ShoppingCart,
  Package,
  FileText,
  Star,
  Download,
  Shield,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/use-cart';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { ReviewList } from '@/components/reviews/ReviewList';
import { ReviewStats } from '@/components/reviews/ReviewStats';

interface Product {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  priceVnd: number;
  stock: number;
  fileName?: string;
  fileUrl?: string;
  totalLines?: number;
  usedLines?: number;
  images?: string;
  description?: string;
  active: boolean;
  createdAt: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviewRefresh, setReviewRefresh] = useState(0);
  const { toast } = useToast();
  const { addToCart, updateQuantity, isInCart, getItemQuantity } = useCart();

  useEffect(() => {
    if (params.slug) {
      fetchProduct(params.slug as string);
    }
  }, [params.slug]);

  const fetchProduct = async (slug: string) => {
    try {
      const response = await fetch(`/api/products/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data.product);
      } else {
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: 'Không tìm thấy sản phẩm',
        });
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tải thông tin sản phẩm',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    try {
      // Add item with correct quantity
      addToCart({
        id: product.id,
        name: product.name,
        slug: product.slug,
        priceVnd: product.priceVnd,
        images: product.images,
        stock: product.stock,
      });

      // If quantity > 1, update to desired quantity
      if (quantity > 1) {
        // Get current quantity in cart and add the rest
        setTimeout(() => {
          const currentQty = getItemQuantity(product.id);
          if (currentQty < quantity) {
            updateQuantity(product.id, quantity);
          }
        }, 100);
      }

      toast({
        title: 'Đã thêm vào giỏ hàng',
        description: `${product.name} x${quantity} đã được thêm vào giỏ hàng`,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể thêm vào giỏ hàng',
      });
    }
  };

  const handleBuyNow = () => {
    if (!product) return;

    // Add to cart first
    handleAddToCart();

    // Navigate to checkout
    setTimeout(() => {
      router.push('/checkout');
    }, 500);
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-card rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-card rounded-2xl"></div>
              <div className="space-y-4">
                <div className="h-8 bg-card rounded w-3/4"></div>
                <div className="h-4 bg-card rounded w-1/2"></div>
                <div className="h-12 bg-card rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!product) {
    return (
      <AppShell>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-text-muted opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Sản phẩm không tồn tại</h3>
              <p className="text-text-muted mb-4">Sản phẩm bạn tìm kiếm không tồn tại hoặc đã bị xóa</p>
              <Link href="/products">
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

  const images = product.images ? JSON.parse(product.images) : [];
  const availableLines = product.totalLines ? product.totalLines - (product.usedLines || 0) : product.stock;

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Back Button */}
          <Link href="/products">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại danh sách
            </Button>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="aspect-video bg-card rounded-2xl overflow-hidden">
                {images.length > 0 ? (
                  <Image
                    src={images[selectedImage]}
                    alt={product.name}
                    width={600}
                    height={400}
                    className="w-full h-full object-cover"
                    unoptimized
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><span class="text-6xl">📄</span></div>';
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="h-16 w-16 text-text-muted opacity-50" />
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto">
                  {images.map((image: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${selectedImage === index ? 'border-brand' : 'border-border'
                        }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Badge
                    variant="secondary"
                    className="bg-blue-500 text-white"
                  >
                    <FileText className="h-5 w-5" />
                    <span className="ml-1">{product.category?.name || 'Product'}</span>
                  </Badge>
                  <Badge variant="outline">
                    {product.stock > 0 ? `${product.stock} còn lại` : 'Hết hàng'}
                  </Badge>
                </div>

                <CardTitle className="text-3xl mb-2">{product.name}</CardTitle>

                <div className="flex items-center space-x-4 mb-4">
                  <div className="text-3xl font-bold text-brand">
                    {formatCurrency(product.priceVnd)}
                  </div>
                </div>

                {product.description && (
                  <p className="text-text-muted mb-6">{product.description}</p>
                )}
              </div>

              {/* Add to Cart */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <label className="text-sm font-medium">Số lượng:</label>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                        >
                          -
                        </Button>
                        <span className="w-12 text-center">{quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                          disabled={quantity >= product.stock}
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        size="lg"
                        onClick={handleBuyNow}
                        disabled={product.stock === 0}
                      >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Mua ngay
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handleAddToCart}
                        disabled={product.stock === 0}
                      >
                        Thêm vào giỏ hàng
                      </Button>
                    </div>

                    <div className="text-sm text-text-muted">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span>Thanh toán an toàn</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Download className="h-4 w-4 text-brand" />
                        <span>Tải ngay sau khi thanh toán</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-brand" />
                        <span>Bảo hành trọn đời</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Product Details Tabs */}
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="description">Mô tả</TabsTrigger>
              <TabsTrigger value="specifications">Thông số</TabsTrigger>
              <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="prose prose-invert max-w-none">
                    {product.description ? (
                      <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }} />
                    ) : (
                      <p className="text-text-muted">Chưa có mô tả chi tiết</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="specifications" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Thông tin cơ bản</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-text-muted">Danh mục:</span>
                          <span>{product.category?.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Số lượng:</span>
                          <span>{product.stock} sản phẩm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Ngày tạo:</span>
                          <span>{formatDate(product.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <div className="space-y-6">
                {/* Review Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Đánh giá sản phẩm</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ReviewStats
                      productSlug={product.slug}
                      refreshTrigger={reviewRefresh}
                    />
                  </CardContent>
                </Card>

                {/* Review Form */}
                <Card>
                  <CardHeader>
                    <CardTitle>Viết đánh giá</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ReviewForm
                      productSlug={product.slug}
                      onSuccess={() => setReviewRefresh(prev => prev + 1)}
                    />
                  </CardContent>
                </Card>

                {/* Review List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tất cả đánh giá</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ReviewList
                      productSlug={product.slug}
                      refreshTrigger={reviewRefresh}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}



