'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Save, Upload, Loader2, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ProductFormData {
  name: string;
  categoryId: string;
  slug: string;
  description: string;
  priceVnd: number;
  stock: number;
  active: boolean;
  fileName?: string;
  totalLines?: number;
  productFile?: File;
}

interface Category {
  id: string;
  name: string;
}

export function ProductFormUnified({ 
  categories = [],
  initialData,
  onSubmit,
  isLoading = false
}: {
  categories?: Category[];
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  isLoading?: boolean;
}) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData?.name || '',
    categoryId: initialData?.categoryId || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    priceVnd: initialData?.priceVnd || 0,
    stock: initialData?.stock || 0,
    active: initialData?.active !== false,
    fileName: initialData?.fileName || '',
    totalLines: initialData?.totalLines || 0,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFormData(prev => ({
        ...prev,
        fileName: file.name,
        productFile: file,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.categoryId || !formData.slug) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Vui lòng điền tên sản phẩm, chọn danh mục và slug',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submit error:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Tạo sản phẩm mới</h1>
            <p className="text-text-muted">Nhập thông tin sản phẩm, tải ảnh và file</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin sản phẩm</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tên sản phẩm */}
              <div>
                <Label htmlFor="name">Tên sản phẩm *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ví dụ: Discord Premium Account"
                  className="mt-2"
                />
              </div>

              {/* Slug */}
              <div>
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="discord-premium-account"
                  className="mt-2"
                />
              </div>

              {/* Danh mục */}
              <div>
                <Label htmlFor="category">Danh mục *</Label>
                <select
                  id="category"
                  value={formData.categoryId}
                  onChange={(e) => handleInputChange('categoryId', e.target.value)}
                  className="w-full mt-2 px-3 py-2 border border-border rounded-lg bg-card text-text-primary"
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Giá */}
              <div>
                <Label htmlFor="price">Giá (VND) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.priceVnd}
                  onChange={(e) => handleInputChange('priceVnd', Number(e.target.value))}
                  placeholder="50000"
                  className="mt-2"
                />
              </div>

              {/* Số lượng kho */}
              <div>
                <Label htmlFor="stock">Số lượng kho</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => handleInputChange('stock', Number(e.target.value))}
                  placeholder="100"
                  className="mt-2"
                />
              </div>

              {/* Số dòng file */}
              <div>
                <Label htmlFor="totalLines">Tổng số account/item trong file</Label>
                <Input
                  id="totalLines"
                  type="number"
                  value={formData.totalLines || 0}
                  onChange={(e) => handleInputChange('totalLines', Number(e.target.value))}
                  placeholder="2000"
                  className="mt-2"
                />
              </div>
            </div>

            {/* Mô tả */}
            <div>
              <Label htmlFor="description">Mô tả sản phẩm</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Nhập mô tả chi tiết về sản phẩm..."
                rows={4}
                className="mt-2"
              />
            </div>

            {/* File upload */}
            <div className="border-2 border-dashed border-border rounded-lg p-6">
              <div className="flex flex-col items-center">
                <Upload className="h-8 w-8 text-text-muted mb-2" />
                <label className="cursor-pointer">
                  <span className="text-sm font-medium text-brand hover:underline">
                    Chọn file sản phẩm (txt, csv, etc.)
                  </span>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".txt,.csv,.zip"
                  />
                </label>
                {selectedFile && (
                  <div className="mt-3 text-sm text-text-muted">
                    ✓ {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => handleInputChange('active', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="active">Kích hoạt sản phẩm</Label>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="gap-2"
              >
                {isSubmitting || isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Tạo sản phẩm
                  </>
                )}
              </Button>
              <Link href="/admin/products">
                <Button variant="outline">Hủy</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
