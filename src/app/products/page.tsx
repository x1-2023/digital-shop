'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CategoryFilter } from '@/components/products/category-filter';
import { SortBar } from '@/components/products/sort-bar';
import { PaginationBar } from '@/components/products/pagination-bar';
import {
  Search,
  ShoppingCart,
  Package,
  FileText,
  Star,
  Eye,
  X,
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
  icon?: string | null;
}

const ITEMS_PER_PAGE = 20;

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToCart, isInCart, getItemQuantity } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort') || 'newest');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('categoryId') || 'all');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
    updateURL();
  }, [search, sortBy, selectedCategory, currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

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
      params.append('page', currentPage.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());

      const response = await fetch(`/api/products?${params}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setTotalProducts(data.pagination?.total || data.products?.length || 0);
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
    if (currentPage > 1) params.set('page', currentPage.toString());

    const queryString = params.toString();
    router.replace(`/products${queryString ? `?${queryString}` : ''}`, { scroll: false });
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1); // Reset to first page when changing category
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    setCurrentPage(1); // Reset to first page when changing sort
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const hasActiveFilters = search || selectedCategory !== 'all' || sortBy !== 'newest';

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSortBy('newest');
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6 animate-pulse">
            <div className="h-12 bg-secondary rounded-lg w-1/3 mx-auto"></div>
            <div className="h-32 bg-secondary rounded-2xl"></div>
            <div className="h-16 bg-secondary rounded-2xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-64 bg-secondary rounded-2xl"></div>
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

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted h-5 w-5" />
            <Input
              placeholder="Tìm kiếm sản phẩm theo tên, mô tả..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-12 h-12 rounded-full border-2 focus:border-brand"
            />
            {search && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />

          {/* Sort Bar */}
          <SortBar
            sortBy={sortBy}
            onSortChange={handleSortChange}
          />

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-text-muted">Đang lọc:</span>
              {search && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  <span>Tìm: &quot;{search}&quot;</span>
                  <span
                    onClick={() => handleSearchChange('')}
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
                    onClick={() => handleCategoryChange('all')}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => {
                const images = product.images ? JSON.parse(product.images) : [];
                return (
                  <Card key={product.id} className="group hover:shadow-2xl hover:shadow-black/40 transition-all duration-300 overflow-hidden">
                    <CardHeader className="p-0">
                      <div className="relative">
                        {images.length > 0 ? (
                          <div className="aspect-square bg-card overflow-hidden">
                            <Image
                              src={images[0]}
                              alt={product.name}
                              width={400}
                              height={225}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              unoptimized
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<div class="flex items-center justify-center h-full"><span class="text-6xl">📄</span></div>';
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="aspect-square bg-card flex items-center justify-center">
                            <FileText className="h-12 w-12 text-text-muted opacity-50" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <Badge variant="secondary" className="bg-brand text-white text-xs">
                            {product.category?.name || 'Product'}
                          </Badge>
                        </div>
                        {product.stock <= 5 && product.stock > 0 && (
                          <div className="absolute top-3 right-3">
                            <Badge variant="outline" className="bg-orange-500/90 text-white border-0 text-xs">
                              Còn {product.stock}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <CardTitle className="text-base line-clamp-2 group-hover:text-brand transition-colors min-h-[2.5rem]">
                            {product.name}
                          </CardTitle>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold text-red-500">
                            {formatCurrency(product.priceVnd)}
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-text-muted">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{((product.id.charCodeAt(0) % 10) / 10 + 4.5).toFixed(1)}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Link
                            href={`/products/${product.slug}`}
                            className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium border border-border bg-transparent hover:bg-secondary h-9 px-3 transition-colors"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Chi tiết
                          </Link>
                          <Button
                            size="sm"
                            className="flex-1 rounded-xl h-9"
                            disabled={product.stock === 0}
                            onClick={() => {
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
                                <Check className="h-4 w-4 mr-1" />
                                ({getItemQuantity(product.id)})
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="h-4 w-4 mr-1" />
                                Mua
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
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalProducts}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </AppShell>
  );
}
