'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  ShoppingCart, 
  Package,
  FileText,
  Star,
  Eye,
  X,
  Filter,
  Check
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/hooks/use-cart';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  priceVnd: number;
  stock: number;
  fileName?: string;
  images?: string;
  description?: string;
  active: boolean;
  createdAt: string;
  category?: {
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToCart, isInCart, getItemQuantity } = useCart();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort') || 'newest');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('categoryId') || 'all');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
    updateURL();
  }, [search, sortBy, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (sortBy) params.append('sort', sortBy);
      if (selectedCategory && selectedCategory !== 'all') {
        params.append('categoryId', selectedCategory);
      }

      const response = await fetch(`/api/products?${params}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateURL = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (sortBy && sortBy !== 'newest') params.set('sort', sortBy);
    if (selectedCategory && selectedCategory !== 'all') params.set('categoryId', selectedCategory);
    
    const newURL = params.toString() ? `?${params.toString()}` : '/products';
    router.replace(newURL, { scroll: false });
  };

  const clearFilters = () => {
    setSearch('');
    setSortBy('newest');
    setSelectedCategory('all');
  };

  const hasActiveFilters = search || sortBy !== 'newest' || selectedCategory !== 'all';

  if (isLoading) {
    return (
      <AppShell>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-card rounded w-1/4"></div>
            <div className="h-12 bg-card rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-card rounded-2xl"></div>
              ))}
            </div>
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
          <div className="text-center">
            <h1 className="text-3xl font-bold text-text-primary mb-2">Sản phẩm</h1>
            <p className="text-text-muted">Khám phá các tài nguyên số chất lượng cao</p>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Search and Category */}
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted h-4 w-4" />
                      <Input
                        placeholder="Tìm kiếm sản phẩm theo tên, mô tả..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                      />
                      {search && (
                        <button
                          onClick={() => setSearch('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-primary"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category Filter */}
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full md:w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả danh mục</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Sort */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Sắp xếp" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Mới nhất</SelectItem>
                      <SelectItem value="oldest">Cũ nhất</SelectItem>
                      <SelectItem value="price-low">Giá thấp</SelectItem>
                      <SelectItem value="price-high">Giá cao</SelectItem>
                      <SelectItem value="name">Tên A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Active Filters */}
                {hasActiveFilters && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-text-muted">Đang lọc:</span>
                    {search && (
                      <Badge variant="secondary" className="gap-1 pr-1">
                        <span>Tìm: &quot;{search}&quot;</span>
                        <span 
                          onClick={() => setSearch('')} 
                          className="ml-1 hover:bg-background rounded-full cursor-pointer inline-flex items-center justify-center w-4 h-4"
                        >
                          <X className="h-3 w-3" />
                        </span>
                      </Badge>
                    )}
                    {selectedCategory !== 'all' && (
                      <Badge variant="secondary" className="gap-1 pr-1">
                        <span>{categories.find(c => c.id === selectedCategory)?.name}</span>
                        <span 
                          onClick={() => setSelectedCategory('all')} 
                          className="ml-1 hover:bg-background rounded-full cursor-pointer inline-flex items-center justify-center w-4 h-4"
                        >
                          <X className="h-3 w-3" />
                        </span>
                      </Badge>
                    )}
                    {sortBy !== 'newest' && (
                      <Badge variant="secondary" className="gap-1 pr-1">
                        <span>Sắp xếp: {
                          sortBy === 'oldest' ? 'Cũ nhất' :
                          sortBy === 'price-low' ? 'Giá thấp' :
                          sortBy === 'price-high' ? 'Giá cao' :
                          sortBy === 'name' ? 'Tên A-Z' : ''
                        }</span>
                        <span 
                          onClick={() => setSortBy('newest')} 
                          className="ml-1 hover:bg-background rounded-full cursor-pointer inline-flex items-center justify-center w-4 h-4"
                        >
                          <X className="h-3 w-3" />
                        </span>
                      </Badge>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearFilters}
                      className="h-7 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Xóa tất cả
                    </Button>
                  </div>
                )}

                {/* Results Count */}
                <div className="text-sm text-text-muted">
                  Tìm thấy <span className="font-semibold text-text-primary">{products.length}</span> sản phẩm
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          {products.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-4 text-text-muted opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-text-muted">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const images = product.images ? JSON.parse(product.images) : [];
                return (
                <Card key={product.id} className="group hover:shadow-2xl hover:shadow-black/40 transition-all duration-300">
                  <CardHeader className="p-0">
                    <div className="relative">
                      {images.length > 0 ? (
                        <div className="aspect-video bg-card rounded-t-2xl overflow-hidden">
                          <Image
                            src={images[0]}
                            alt={product.name}
                            width={400}
                            height={225}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-card rounded-t-2xl flex items-center justify-center">
                          <FileText className="h-12 w-12 text-text-muted opacity-50" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <Badge 
                          variant="secondary" 
                          className="bg-blue-500 text-white"
                        >
                          <FileText className="h-4 w-4" />
                          <span className="ml-1">{product.category?.name || 'Product'}</span>
                        </Badge>
                      </div>
                      <div className="absolute top-3 right-3">
                        <Badge variant="outline" className="bg-background/80">
                          {product.stock > 0 ? `${product.stock} còn lại` : 'Hết hàng'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div>
                        <CardTitle className="text-lg line-clamp-2 group-hover:text-brand transition-colors">
                          {product.name}
                        </CardTitle>
                        {product.description && (
                          <CardDescription className="line-clamp-2 mt-1">
                            {product.description}
                          </CardDescription>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-brand">
                          {formatCurrency(product.priceVnd)}
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-text-muted">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>4.8</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/products/${product.slug}`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            <Eye className="h-4 w-4 mr-2" />
                            Xem chi tiết
                          </Button>
                        </Link>
                        <Button 
                          className="flex-1"
                          disabled={product.stock === 0}
                          onClick={() => {
                            const images = product.images ? JSON.parse(product.images) : [];
                            addToCart({
                              id: product.id,
                              name: product.name,
                              slug: product.slug,
                              priceVnd: product.priceVnd,
                              images: product.images,
                              stock: product.stock,
                            });
                          }}
                        >
                          {isInCart(product.id) ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Trong giỏ ({getItemQuantity(product.id)})
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Thêm vào giỏ
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
              })}
            </div>
          )}

          {/* Pagination */}
          {products.length > 0 && (
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



