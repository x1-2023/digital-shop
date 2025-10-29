'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft,
  Save,
  Upload,
  Package,
  Loader2,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
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
    id: string;
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    categoryId: '',
    priceVnd: 0,
    stock: 0,
    fileName: '',
    totalLines: 0,
    usedLines: 0,
    description: '',
    active: true,
    images: [] as string[],
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    if (params.id) {
      fetchProduct(params.id as string);
    }
  }, [params.id]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data.product);
        const productImages = data.product.images ? JSON.parse(data.product.images) : [];
        setFormData({
          name: data.product.name,
          slug: data.product.slug,
          categoryId: data.product.categoryId,
          priceVnd: data.product.priceVnd,
          stock: data.product.stock,
          fileName: data.product.fileName || '',
          totalLines: data.product.totalLines || 0,
          usedLines: data.product.usedLines || 0,
          description: data.product.description || '',
          active: data.product.active,
          images: productImages,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: 'Không tìm thấy sản phẩm',
        });
        router.push('/admin/products');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/products/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          images: JSON.stringify(formData.images),
        }),
      });

      if (response.ok) {
        toast({
          variant: 'success',
          title: 'Đã cập nhật sản phẩm',
          description: 'Sản phẩm đã được cập nhật thành công',
        });
        router.push('/admin/products');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Không thể cập nhật sản phẩm');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật sản phẩm',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadedImages: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        formDataUpload.append('type', 'image');

        const res = await fetch('/api/admin/products/upload', {
          method: 'POST',
          body: formDataUpload
        });

        if (!res.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const result = await res.json();
        uploadedImages.push(result.data.imageUrl);
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedImages]
      }));

      toast({
        title: 'Thành công',
        description: `Đã upload ${uploadedImages.length} ảnh`
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể upload ảnh'
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/products/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          variant: 'success',
          title: 'Đã xóa sản phẩm',
          description: 'Sản phẩm đã được xóa thành công',
        });
        router.push('/admin/products');
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
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isLoading) {
    return (
      <AppShell isAdmin>
        <div className="flex-1 p-6">
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

  if (!product) {
    return (
      <AppShell isAdmin>
        <div className="flex-1 p-6">
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-text-muted opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Sản phẩm không tồn tại</h3>
              <p className="text-text-muted mb-6">Sản phẩm bạn tìm kiếm không tồn tại hoặc đã bị xóa</p>
              <Link href="/admin/products">
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
              <h1 className="text-3xl font-bold text-text-primary">Chỉnh sửa sản phẩm</h1>
              <p className="text-text-muted">
                Cập nhật thông tin sản phẩm
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa sản phẩm
                  </>
                )}
              </Button>
              <Link href="/admin/products">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại
                </Button>
              </Link>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin cơ bản</CardTitle>
                  <CardDescription>
                    Thông tin chính của sản phẩm
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Tên sản phẩm *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Nhập tên sản phẩm"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value)}
                      placeholder="ten-san-pham"
                      required
                    />
                    <p className="text-xs text-text-muted mt-1">
                      URL: /products/{formData.slug}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="categoryId">Danh mục *</Label>
                    <Select
                      value={formData.categoryId}
                      onValueChange={(value) => handleInputChange('categoryId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Mô tả</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Mô tả chi tiết về sản phẩm"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Pricing & Stock */}
              <Card>
                <CardHeader>
                  <CardTitle>Giá và kho</CardTitle>
                  <CardDescription>
                    Cấu hình giá bán và số lượng
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="price">Giá bán (VND) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.priceVnd}
                      onChange={(e) => handleInputChange('priceVnd', parseInt(e.target.value))}
                      placeholder="100000"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="stock">Số lượng *</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock}
                      onChange={(e) => handleInputChange('stock', parseInt(e.target.value))}
                      placeholder="100"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="fileName">Tên file</Label>
                    <Input
                      id="fileName"
                      value={formData.fileName}
                      onChange={(e) => handleInputChange('fileName', e.target.value)}
                      placeholder="example.txt"
                    />
                  </div>

                  <div>
                    <Label htmlFor="totalLines">Tổng số dòng</Label>
                    <Input
                      id="totalLines"
                      type="number"
                      value={formData.totalLines}
                      onChange={(e) => handleInputChange('totalLines', parseInt(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="usedLines">Số dòng đã dùng</Label>
                    <Input
                      id="usedLines"
                      type="number"
                      value={formData.usedLines}
                      onChange={(e) => handleInputChange('usedLines', parseInt(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                      disabled
                    />
                    <p className="text-xs text-text-muted mt-1">
                      Tự động cập nhật khi có đơn hàng
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="active">Trạng thái</Label>
                      <p className="text-sm text-text-muted">
                        Sản phẩm có hiển thị trên website không
                      </p>
                    </div>
                    <Switch
                      id="active"
                      checked={formData.active}
                      onCheckedChange={(checked) => handleInputChange('active', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>Hình ảnh sản phẩm</CardTitle>
                <CardDescription>
                  Upload hình ảnh cho sản phẩm
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-6">
                    <div className="flex flex-col items-center space-y-4">
                      <Upload className="h-8 w-8 text-text-muted" />
                      <div className="text-center">
                        <p className="font-medium">Upload ảnh sản phẩm</p>
                        <p className="text-sm text-text-muted">JPG, PNG, WebP (Có thể chọn nhiều ảnh)</p>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="imageUpload"
                        multiple
                        disabled={uploadingImages}
                      />
                      <label htmlFor="imageUpload">
                        <Button type="button" variant="outline" disabled={uploadingImages} asChild>
                          <span>{uploadingImages ? 'Đang upload...' : 'Chọn ảnh'}</span>
                        </Button>
                      </label>
                    </div>
                  </div>

                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-4">
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img 
                            src={img} 
                            alt={`Product ${idx + 1}`}
                            className="w-full h-24 object-cover rounded border border-border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 bg-destructive text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <Link href="/admin/products">
                <Button type="button" variant="outline">
                  Hủy
                </Button>
              </Link>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Lưu thay đổi
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}



