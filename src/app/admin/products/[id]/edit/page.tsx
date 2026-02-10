'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
// import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const RichTextEditor = dynamic(() => import('@/components/admin/rich-text-editor'), { ssr: false });
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  Save,
  Upload,
  Package,
  Loader2,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Plus
} from 'lucide-react';

import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { safeParseImages, formatCurrency } from '@/lib/utils';

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
  isSale?: boolean;
  salePercent?: number;
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
    fakeSold: 0,
    description: '',
    active: true,
    isSale: false,
    salePercent: 10,
    images: [] as string[],
  });
  const [soldMode, setSoldMode] = useState<'real' | 'manual'>('real');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isRestocking, setIsRestocking] = useState(false);
  const [restockMode, setRestockMode] = useState<'append' | 'replace'>('append');
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    if (params.id) {
      fetchProduct(params.id as string);
    }
  }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
        const productImages = safeParseImages(data.product.images);
        setFormData({
          name: data.product.name,
          slug: data.product.slug,
          categoryId: data.product.categoryId,
          priceVnd: data.product.priceVnd,
          stock: data.product.stock,
          fileName: data.product.fileName || '',
          totalLines: data.product.totalLines || 0,
          usedLines: data.product.usedLines || 0,
          fakeSold: data.product.fakeSold || 0,
          description: data.product.description || '',
          active: data.product.active,
          isSale: data.product.isSale || false,
          salePercent: data.product.salePercent || 10,
          images: productImages,
        });
        setSoldMode(data.product.fakeSold > 0 ? 'manual' : 'real');
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

  // === RESTOCK HANDLER ===
  const handleRestock = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.txt')) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Vui lòng chọn file .txt',
      });
      return;
    }

    setIsRestocking(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('type', 'product');
      uploadFormData.append('restockMode', restockMode);
      uploadFormData.append('productId', params.id as string);

      const res = await fetch('/api/admin/products/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      const result = await res.json();
      const data = result.data;

      // Update local form state
      setFormData((prev) => ({
        ...prev,
        totalLines: data.totalLines,
        usedLines: data.usedLines,
        stock: data.stock,
        ...(data.fileName ? { fileName: data.fileName } : {}),
      }));

      // Update product state too
      if (product) {
        setProduct({
          ...product,
          totalLines: data.totalLines,
          usedLines: data.usedLines,
          stock: data.stock,
        });
      }

      toast({
        variant: 'success',
        title: restockMode === 'append' ? 'Đã bổ sung hàng' : 'Đã thay thế file',
        description:
          restockMode === 'append'
            ? `Thêm ${data.addedLines} dòng mới. Tổng: ${data.totalLines} dòng`
            : `File mới: ${data.totalLines} dòng. Stock đã reset.`,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể upload file';
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: errorMessage,
      });
    } finally {
      setIsRestocking(false);
      // Reset file input
      e.target.value = '';
    }
  };

  // Resize image to optimal size (493x493px - 1:1 square)
  const resizeImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const targetWidth = 493;
          const targetHeight = 493;
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Cannot get canvas context'));
            return;
          }
          const imgAspect = img.width / img.height;
          const targetAspect = targetWidth / targetHeight;
          let drawWidth, drawHeight, offsetX, offsetY;
          if (imgAspect > targetAspect) {
            drawHeight = targetHeight;
            drawWidth = img.width * (targetHeight / img.height);
            offsetX = (targetWidth - drawWidth) / 2;
            offsetY = 0;
          } else {
            drawWidth = targetWidth;
            drawHeight = img.height * (targetWidth / img.width);
            offsetX = 0;
            offsetY = (targetHeight - drawHeight) / 2;
          }
          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob'));
                return;
              }
              const resizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(resizedFile);
            },
            'image/jpeg',
            0.85
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadedImages: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const resizedFile = await resizeImage(file);
        const formDataUpload = new FormData();
        formDataUpload.append('file', resizedFile);
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
        description: `Đã upload và tối ưu ${uploadedImages.length} ảnh (493x493px)`
      });
    } catch {
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
      <div className="flex-1 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-card rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-card rounded"></div>
            <div className="h-64 bg-card rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
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
    );
  }

  return (
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
                  <Label>Mô tả</Label>
                  <RichTextEditor
                    value={formData.description}
                    onChange={(html) => handleInputChange('description', html)}
                    placeholder="Mô tả chi tiết về sản phẩm"
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

                {/* Sold Mode Toggle */}
                <div className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Số lượng đã bán (hiển thị)</Label>
                      <p className="text-xs text-text-muted mt-0.5">
                        Chế độ hiển thị số &quot;Đã bán&quot; trên frontend
                      </p>
                    </div>
                    <div className="flex bg-secondary rounded-lg p-0.5">
                      <button
                        type="button"
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${soldMode === 'real'
                            ? 'bg-brand text-white shadow-sm'
                            : 'text-text-muted hover:text-text-primary'
                          }`}
                        onClick={() => {
                          setSoldMode('real');
                          handleInputChange('fakeSold', 0);
                        }}
                      >
                        📊 Thật
                      </button>
                      <button
                        type="button"
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${soldMode === 'manual'
                            ? 'bg-brand text-white shadow-sm'
                            : 'text-text-muted hover:text-text-primary'
                          }`}
                        onClick={() => setSoldMode('manual')}
                      >
                        ✏️ Thủ công
                      </button>
                    </div>
                  </div>

                  {soldMode === 'real' ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                      <p className="text-sm text-emerald-400">
                        Đang hiển thị <strong>{formData.usedLines}</strong> (số thật từ đơn hàng)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        type="number"
                        value={formData.fakeSold}
                        onChange={(e) => handleInputChange('fakeSold', parseInt(e.target.value) || 0)}
                        placeholder="Nhập số lượng đã bán"
                        min="0"
                      />
                      <p className="text-xs text-yellow-500">
                        ⚠️ Số này sẽ hiển thị thay cho số thật trên frontend
                      </p>
                    </div>
                  )}
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

                {/* Sale Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isSale">Giảm giá (Sale)</Label>
                    <p className="text-sm text-text-muted">
                      Hiển thị badge giảm giá và giá gốc trên frontend
                    </p>
                  </div>
                  <Switch
                    id="isSale"
                    checked={formData.isSale}
                    onCheckedChange={(checked) => handleInputChange('isSale', checked)}
                  />
                </div>

                {formData.isSale && (
                  <div>
                    <Label htmlFor="salePercent">Phần trăm giảm giá (%)</Label>
                    <Input
                      id="salePercent"
                      type="number"
                      min={1}
                      max={99}
                      value={formData.salePercent}
                      onChange={(e) => handleInputChange('salePercent', parseInt(e.target.value) || 10)}
                      className="mt-1"
                    />
                    <p className="text-sm text-text-muted mt-1">
                      Giá gốc hiển thị: {formatCurrency(Math.round(formData.priceVnd / (1 - (formData.salePercent || 10) / 100)))} → Giá bán: {formatCurrency(formData.priceVnd)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Restock Section */}
          <Card className="border-amber-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-amber-500" />
                Bổ sung hàng
              </CardTitle>
              <CardDescription>
                Upload file .txt để bổ sung hoặc thay thế stock sản phẩm
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stock Status */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-card-dark rounded-lg p-3 text-center">
                  <p className="text-xs text-text-muted">Tổng dòng</p>
                  <p className="text-lg font-bold text-foreground">{formData.totalLines}</p>
                </div>
                <div className="bg-card-dark rounded-lg p-3 text-center">
                  <p className="text-xs text-text-muted">Đã bán</p>
                  <p className="text-lg font-bold text-red-500">{formData.usedLines}</p>
                </div>
                <div className="bg-card-dark rounded-lg p-3 text-center">
                  <p className="text-xs text-text-muted">Còn lại</p>
                  <p className={`text-lg font-bold ${formData.stock <= 5 ? 'text-amber-500' : 'text-green-500'}`}>
                    {formData.stock}
                  </p>
                </div>
              </div>

              {/* Low stock warning */}
              {formData.stock <= 5 && (
                <div className="flex items-center gap-2 bg-amber-500/10 text-amber-500 rounded-lg px-3 py-2 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{formData.stock === 0 ? 'Hết hàng! Cần bổ sung ngay.' : `Sắp hết hàng! Chỉ còn ${formData.stock} items.`}</span>
                </div>
              )}

              {/* Restock Mode Selection */}
              <div className="space-y-2">
                <Label>Chế độ bổ sung</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRestockMode('append')}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${restockMode === 'append'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-border hover:border-border/80'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Plus className="w-4 h-4 text-green-500" />
                      <span className="font-semibold text-sm">Nối thêm</span>
                    </div>
                    <p className="text-xs text-text-muted">Thêm dòng mới vào cuối file hiện tại</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRestockMode('replace')}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${restockMode === 'replace'
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-border hover:border-border/80'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <RefreshCw className="w-4 h-4 text-amber-500" />
                      <span className="font-semibold text-sm">Thay thế</span>
                    </div>
                    <p className="text-xs text-text-muted">Xóa file cũ, upload file hoàn toàn mới</p>
                  </button>
                </div>
              </div>

              {/* Replace warning */}
              {restockMode === 'replace' && (
                <div className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>File cũ sẽ bị thay thế hoàn toàn. usedLines sẽ reset về 0.</span>
                </div>
              )}

              {/* File Upload */}
              <div className="border-2 border-dashed border-border rounded-lg p-4">
                <div className="flex flex-col items-center space-y-3">
                  <Upload className="h-6 w-6 text-text-muted" />
                  <div className="text-center">
                    <p className="font-medium text-sm">
                      {restockMode === 'append' ? 'Upload file để nối thêm' : 'Upload file thay thế'}
                    </p>
                    <p className="text-xs text-text-muted">Chỉ chấp nhận file .txt (mỗi dòng = 1 item)</p>
                  </div>
                  <input
                    type="file"
                    accept=".txt"
                    onChange={handleRestock}
                    className="hidden"
                    id="restockUpload"
                    disabled={isRestocking}
                  />
                  <label htmlFor="restockUpload">
                    <Button
                      type="button"
                      variant={restockMode === 'replace' ? 'destructive' : 'default'}
                      disabled={isRestocking}
                      asChild
                    >
                      <span>
                        {isRestocking ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang xử lý...</>
                        ) : restockMode === 'append' ? (
                          <><Plus className="w-4 h-4 mr-2" />Chọn file bổ sung</>
                        ) : (
                          <><RefreshCw className="w-4 h-4 mr-2" />Chọn file thay thế</>
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>

              {/* Current file info */}
              {formData.fileName && (
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>File hiện tại: <strong>{formData.fileName}</strong></span>
                </div>
              )}
            </CardContent>
          </Card>

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
                    <div className="text-center space-y-2">
                      <p className="font-medium">Upload ảnh sản phẩm</p>
                      <p className="text-sm text-text-muted">JPG, PNG, WebP (Có thể chọn nhiều ảnh)</p>
                      <div className="text-xs text-text-muted bg-card-dark px-3 py-2 rounded-lg inline-block">
                        <p className="font-semibold text-brand mb-1">✨ Tự động tối ưu:</p>
                        <p>• Tỷ lệ: 1:1 (vuông, phù hợp với giao diện)</p>
                        <p>• Kích thước: 493x493px (tối ưu web)</p>
                        <p>• Chất lượng: 85% (cân bằng dung lượng)</p>
                        <p className="mt-1 text-success">→ Ảnh sẽ tự động crop và resize khi upload</p>
                      </div>
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
                      <div key={idx} className="relative group w-full h-24">
                        <Image
                          src={img}
                          alt={`Product ${idx + 1}`}
                          fill
                          className="object-cover rounded border border-border"
                          unoptimized
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
  );
}



