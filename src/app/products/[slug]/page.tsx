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
  ArrowLeft,
  Info,
  Eye,
  Zap,
  Truck,
  Box
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
  fakeSold?: number;
  fakeRating?: number;
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
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const { toast } = useToast();
  const { addToCart, updateQuantity, isInCart, getItemQuantity } = useCart();

  useEffect(() => {
    if (params.slug) {
      fetchProduct(params.slug as string);
    }
  }, [params.slug]);

  const fetchProduct = async (slug: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/products/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data.product);

        // Fetch related products from same category
        if (data.product.categoryId) {
          fetchRelatedProducts(data.product.categoryId, data.product.id);
        }
      } else {
        setProduct(null);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRelatedProducts = async (categoryId: string, currentProductId: string) => {
    try {
      const response = await fetch(`/api/products?categoryId=${categoryId}&limit=3`);
      if (response.ok) {
        const data = await response.json();
        const filtered = (data.products || []).filter((p: Product) => p.id !== currentProductId).slice(0, 3);
        setRelatedProducts(filtered);
      }
    } catch (error) {
      console.error('Error fetching related products:', error);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (isInCart(product.id)) {
      const currentQty = getItemQuantity(product.id);
      updateQuantity(product.id, currentQty + quantity);
      toast({
        title: 'Đã cập nhật giỏ hàng',
        description: `${product.name} (x${currentQty + quantity})`,
      });
    } else {
      addToCart({
        id: product.id,
        name: product.name,
        priceVnd: product.priceVnd,
        images: product.images ? JSON.parse(product.images)[0] : undefined,
        slug: product.slug,
        stock: product.stock,
      });
      toast({
        title: 'Đã thêm vào giỏ hàng',
        description: `${product.name} (x${quantity})`,
      });
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    handleAddToCart();
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
              <div className="aspect-square bg-card rounded-2xl max-w-[493px]"></div>
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
  const soldCount = product.fakeSold || (product.usedLines || 0);
  const rating = product.fakeRating && product.fakeRating > 0
    ? product.fakeRating
    : (4.0 + Math.random() * 1.0); // fallback random 4.0-5.0
  const isOutOfStock = product.stock === 0;

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Back Button */}
          <Link href="/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại danh sách
            </Button>
          </Link>

          {/* Main Product Section */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Product Image */}
              <div className="space-y-4 flex flex-col items-center">
                <div className="relative aspect-square bg-secondary/30 rounded-xl overflow-hidden w-full max-w-[493px]">
                  {/* Status Badges on Image */}
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                    {isOutOfStock ? (
                      <Badge className="bg-red-500 text-white border-0 px-3 py-1 text-xs font-bold uppercase">
                        Hết hàng
                      </Badge>
                    ) : (
                      <>
                        <Badge className="bg-green-500 text-white border-0 px-2 py-1 text-xs font-bold">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          CÒN HÀNG
                        </Badge>
                        <Badge className="bg-yellow-500 text-white border-0 px-2 py-1 text-xs font-bold">
                          <Zap className="w-3 h-3 mr-1" />
                          TỰ ĐỘNG
                        </Badge>
                        <Badge className="bg-blue-500 text-white border-0 px-2 py-1 text-xs font-bold">
                          <Truck className="w-3 h-3 mr-1" />
                          GỬI NGAY
                        </Badge>
                      </>
                    )}
                  </div>

                  {images.length > 0 ? (
                    <Image
                      src={images[selectedImage]}
                      alt={product.name}
                      width={493}
                      height={493}
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

                {/* Image Thumbnails */}
                {images.length > 1 && (
                  <div className="flex space-x-2 overflow-x-auto">
                    {images.map((image: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${selectedImage === index ? 'border-brand' : 'border-border hover:border-brand/50'
                          }`}
                      >
                        <Image
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Check Live Section */}
                <div className="w-full max-w-[493px]">
                  <div className="bg-card-dark border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Info className="w-4 h-4 text-blue-400" />
                      <span className="font-semibold text-sm">Check Live</span>
                    </div>
                    <p className="text-xs text-text-muted">
                      Chức năng Check Live không khả dụng cho sản phẩm này
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Product Info */}
              <div className="space-y-4">
                {/* Product Title */}
                <h1 className="text-2xl lg:text-3xl font-bold text-text-primary leading-tight">
                  {product.name}
                </h1>

                {/* Stock + Sold + Rating Row */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Box className="w-4 h-4 text-green-500" />
                    <span className="text-text-muted">Kho hàng:</span>
                    <span className="font-semibold text-green-500">{product.stock}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <ShoppingCart className="w-4 h-4 text-red-500" />
                    <span className="text-text-muted">Đã bán:</span>
                    <span className="font-semibold text-red-500">{soldCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${s <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`}
                      />
                    ))}
                    <span className="text-sm text-text-muted ml-1">(0 Review)</span>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-brand">
                    {formatCurrency(product.priceVnd)}
                  </span>
                </div>

                {/* Buy Buttons */}
                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold"
                    size="lg"
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {isOutOfStock ? 'Hết hàng' : 'Mua Ngay'}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                  >
                    Thêm vào giỏ hàng
                  </Button>
                </div>

                {/* Info Box (blue border) */}
                {product.description && (
                  <div className="border border-blue-500/30 bg-blue-500/5 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
                        {product.description.replace(/<[^>]*>/g, '').substring(0, 200)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                  <div className="pt-2">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Sản phẩm liên quan
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {relatedProducts.map((rp) => {
                        const rpImages = rp.images ? JSON.parse(rp.images) : [];
                        return (
                          <Link key={rp.id} href={`/products/${rp.slug}`}>
                            <div className="border border-border rounded-lg overflow-hidden hover:border-brand/50 transition group">
                              <div className="aspect-square bg-secondary/30 overflow-hidden">
                                {rpImages[0] ? (
                                  <Image
                                    src={rpImages[0]}
                                    alt={rp.name}
                                    width={150}
                                    height={150}
                                    className="w-full h-full object-cover group-hover:scale-105 transition"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-text-muted opacity-50" />
                                  </div>
                                )}
                              </div>
                              <div className="p-2">
                                <p className="text-xs font-medium line-clamp-2 leading-tight mb-1">{rp.name}</p>
                                <span className="text-xs font-bold text-brand">{formatCurrency(rp.priceVnd)}</span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-card border border-border rounded-xl">
              <TabsTrigger
                value="description"
                className="data-[state=active]:bg-brand data-[state=active]:text-white rounded-lg py-2.5 text-sm font-medium"
              >
                <Info className="w-4 h-4 mr-2" />
                Chi tiết
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="data-[state=active]:bg-brand data-[state=active]:text-white rounded-lg py-2.5 text-sm font-medium"
              >
                <Star className="w-4 h-4 mr-2" />
                Đánh giá
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-4">
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

            <TabsContent value="reviews" className="mt-4">
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
