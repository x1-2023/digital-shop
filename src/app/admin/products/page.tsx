'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Package,
  FileText
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

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
  updatedAt: string;
  category?: {
    name: string;
  };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();
  const router = useRouter();

  const fetchProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('active', statusFilter);

      const response = await fetch(`/api/products?${params}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: 'Không thể tải danh sách sản phẩm',
        });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Có lỗi xảy ra khi tải sản phẩm',
      });
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          variant: 'success',
          title: 'Đã xóa sản phẩm',
          description: 'Sản phẩm đã được xóa thành công',
        });
        fetchProducts();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Không thể xóa sản phẩm');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa sản phẩm',
      });
    }
  };

  if (isLoading) {
    return (
      <AppShell isAdmin>
        <div className="flex-1 p-6">
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
    <AppShell isAdmin>
      <div className="flex-1 p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Quản lý sản phẩm</h1>
              <p className="text-text-muted">
                Tạo và quản lý các sản phẩm trong cửa hàng
              </p>
            </div>
            <Link href="/admin/products/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tạo sản phẩm mới
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted h-4 w-4" />
                    <Input
                      placeholder="Tìm kiếm sản phẩm..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="true">Hoạt động</SelectItem>
                      <SelectItem value="false">Tạm dừng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          {products.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-4 text-text-muted opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Chưa có sản phẩm</h3>
                <p className="text-text-muted mb-6">Tạo sản phẩm đầu tiên để bắt đầu bán hàng</p>
                <Link href="/admin/products/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo sản phẩm mới
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Danh mục</TableHead>
                    <TableHead>Giá</TableHead>
                    <TableHead>Kho</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const images = product.images ? JSON.parse(product.images) : [];
                    return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-card rounded-lg overflow-hidden flex-shrink-0">
                            {images.length > 0 ? (
                              <Image
                                src={images[0]}
                                alt={product.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FileText className="h-4 w-4 text-text-muted" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium">{product.name}</h4>
                            <p className="text-sm text-text-muted">
                              {product.fileName || product.slug}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {product.category?.name || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(product.priceVnd)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{product.stock} sản phẩm</div>
                          {product.totalLines && (
                            <div className="text-text-muted">
                              {product.totalLines.toLocaleString()} lines
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.active ? 'success' : 'destructive'}>
                          {product.active ? 'Hoạt động' : 'Tạm dừng'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-text-muted">
                          {formatDate(product.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/products/${product.slug}`)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-danger hover:text-danger"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                  })}
                </TableBody>
              </Table>
            </Card>
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



