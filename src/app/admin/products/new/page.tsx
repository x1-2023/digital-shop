'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { generateSlug } from '@/lib/utils';
import Image from 'next/image';

interface Category {
  id: string;
  name: string;
}

interface FormData {
  name: string;
  slug: string;
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
    slug: '',
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Auto-generate slug when name changes
    if (name === 'name' && value) {
      setFormData(prev => ({
        ...prev,
        name: value,
        slug: generateSlug(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'priceVnd' || name === 'stock' || name === 'totalLines'
          ? parseInt(value) || 0
          : value
      }));
    }
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
    } catch {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể upload file'
      });
    } finally {
      setUploading(false);
    }
  };

  // Resize image to optimal size (493x493px - 1:1 square)
  const resizeImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          // Target dimensions (1:1 square)
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

          // Calculate scaling to cover the canvas while maintaining aspect ratio
          const imgAspect = img.width / img.height;
          const targetAspect = targetWidth / targetHeight;

          let drawWidth, drawHeight, offsetX, offsetY;

          if (imgAspect > targetAspect) {
            // Image is wider - fit to height
            drawHeight = targetHeight;
            drawWidth = img.width * (targetHeight / img.height);
            offsetX = (targetWidth - drawWidth) / 2;
            offsetY = 0;
          } else {
            // Image is taller - fit to width
            drawWidth = targetWidth;
            drawHeight = img.height * (targetWidth / img.width);
            offsetX = 0;
            offsetY = (targetHeight - drawHeight) / 2;
          }

          // Draw image centered and cropped
          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

          // Convert to blob with quality optimization
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
            0.85 // 85% quality for good balance
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

        // Auto-resize image to 493x493px
        const resizedFile = await resizeImage(file);

        const formData = new FormData();
        formData.append('file', resizedFile);
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
        description: `Đã upload và tối ưu ${uploadedImages.length} ảnh (493x493px)`
      });
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
          slug: formData.slug,
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
                  placeholder="Tài Khoản Discord"
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="tai-khoan-discord-0211"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-text-muted mt-1">
                  Tự động tạo từ tên sản phẩm. Có thể chỉnh sửa. Ví dụ: tai-khoan-discord-0211
                </p>
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
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-4 w-full mt-4">
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <div className="relative w-full h-24">
                            <Image
                              src={img}
                              alt={`Product ${idx + 1}`}
                              fill
                              className="object-cover rounded border border-border"
                              unoptimized
                            />
                          </div>
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
  );
}
