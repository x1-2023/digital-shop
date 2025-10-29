'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
}

interface FormData {
  name: string;
  categoryId: string;
  description: string;
  priceVnd: number;
  stock: number;
  fileName: string;
  fileUrl: string;
  fileContent: string;
  totalLines: number;
  images: string[];
}

export default function CreateProductPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    categoryId: '',
    description: '',
    priceVnd: 0,
    stock: 0,
    fileName: '',
    fileUrl: '',
    fileContent: '',
    totalLines: 0,
    images: []
  });
  const [productFile, setProductFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const generateSlug = (name: string) => {
    const sanitized = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const random = Math.random().toString(36).substring(2, 8);
    return `${sanitized}-${random}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'priceVnd' || name === 'stock' || name === 'totalLines'
        ? parseInt(value) || 0
        : value
    }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, categoryId: value }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.txt')) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Vui lòng chọn file .txt'
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'product');

      const res = await fetch('/api/admin/products/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const result = await res.json();
      const { fileName, fileUrl, totalLines, fileContent } = result.data;

      setProductFile(file);
      setFormData(prev => ({
        ...prev,
        fileName,
        fileUrl,
        fileContent,
        totalLines,
        stock: totalLines // Auto set stock = totalLines
      }));

      toast({
        title: 'Thành công',
        description: `File đã upload: ${totalLines} dòng`
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể upload file'
      });
    } finally {
      setUploading(false);
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
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'image');

        const res = await fetch('/api/admin/products/upload', {
          method: 'POST',
          body: formData
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.categoryId) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Vui lòng điền tên sản phẩm và danh mục'
      });
      return;
    }

    setIsLoading(true);

    try {
      const createRes = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: generateSlug(formData.name),
          categoryId: formData.categoryId,
          description: formData.description,
          priceVnd: Number(formData.priceVnd) || 0,
          stock: Number(formData.stock) || 0,
          fileName: formData.fileName,
          fileUrl: formData.fileUrl,
          totalLines: Number(formData.totalLines) || 0,
          usedLines: 0,
          images: JSON.stringify(formData.images),
          active: true
        })
      });

      if (!createRes.ok) {
        const errorData = await createRes.json();
        console.error('Create product error:', errorData);
        throw new Error(errorData.error || 'Không thể tạo sản phẩm');
      }

      toast({
        title: 'Thành công',
        description: 'Sản phẩm đã được tạo'
      });

      router.push('/admin/products');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell isAdmin>
      <div className="flex-1 p-6">
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <Link href="/admin/products">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Tạo sản phẩm mới</h1>
              <p className="text-text-muted">Thêm sản phẩm với file dữ liệu</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Thông tin sản phẩm</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name">Tên sản phẩm *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Discord Premium Account"
                    required
                  />
                </div>

                <div>
                  <Label>Danh mục *</Label>
                  <Select value={formData.categoryId} onValueChange={handleCategoryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Mô tả sản phẩm..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="priceVnd">Giá (VND)</Label>
                    <Input
                      id="priceVnd"
                      name="priceVnd"
                      type="number"
                      value={formData.priceVnd}
                      onChange={handleInputChange}
                      placeholder="50000"
                      min="0"
                    />
                  </div>
                </div>

                <div className="border-2 border-dashed border-border rounded-lg p-6">
                  <div className="flex flex-col items-center space-y-4">
                    <Upload className="h-8 w-8 text-text-muted" />
                    <div className="text-center">
                      <p className="font-medium">Upload file dữ liệu *</p>
                      <p className="text-sm text-text-muted">File .txt - Mỗi dòng = 1 account</p>
                      <p className="text-xs text-text-muted mt-1">Số lượng sẽ tự động được tính từ số dòng</p>
                    </div>
                    <input
                      type="file"
                      accept=".txt"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="fileUpload"
                      disabled={uploading}
                    />
                    <label htmlFor="fileUpload">
                      <Button type="button" variant="outline" disabled={uploading} asChild>
                        <span>{uploading ? 'Đang upload...' : 'Chọn file'}</span>
                      </Button>
                    </label>
                    {productFile && (
                      <div className="text-sm space-y-1 text-center">
                        <p className="text-success font-medium">
                          ✓ {formData.fileName}
                        </p>
                        <p className="text-text-muted">
                          {formData.totalLines} dòng = {formData.stock} sản phẩm
                        </p>
                      </div>
                    )}
                  </div>
                </div>

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
                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-4 gap-4 w-full mt-4">
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
                </div>

                <div className="flex space-x-4 pt-6 border-t">
                  <Link href="/admin/products">
                    <Button type="button" variant="outline">Hủy</Button>
                  </Link>
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? 'Đang tạo...' : 'Tạo sản phẩm'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
