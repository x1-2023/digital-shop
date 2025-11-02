'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Plus, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { generateSlug } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  active: boolean;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: ''
  });
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tải danh mục'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Auto-generate slug when name changes
    if (name === 'name' && value && !editingId) {
      setFormData(prev => ({
        ...prev,
        name: value,
        slug: generateSlug(value)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Tên danh mục không được để trống'
      });
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/admin/categories/${editingId}` : '/api/admin/categories';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug || generateSlug(formData.name),
          description: formData.description,
          icon: formData.icon
        })
      });

      if (!res.ok) throw new Error('Failed');

      toast({
        title: 'Thành công',
        description: editingId ? 'Danh mục đã cập nhật' : 'Danh mục đã tạo'
      });

      setFormData({ name: '', slug: '', description: '', icon: '' });
      setEditingId(null);
      setShowForm(false);
      fetchCategories();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Có lỗi xảy ra'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa?')) return;

    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');

      toast({
        title: 'Thành công',
        description: 'Danh mục đã xóa'
      });

      fetchCategories();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể xóa danh mục'
      });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      slug: category.slug || '',
      description: category.description || '',
      icon: category.icon || ''
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', slug: '', description: '', icon: '' });
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Vui lòng chọn file ảnh'
      });
      return;
    }

    setUploadingIcon(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('type', 'image');

      const res = await fetch('/api/admin/products/upload', {
        method: 'POST',
        body: formDataUpload
      });

      if (!res.ok) throw new Error('Upload failed');

      const result = await res.json();
      setFormData(prev => ({ ...prev, icon: result.data.imageUrl }));

      toast({
        title: 'Thành công',
        description: 'Icon đã upload'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể upload icon'
      });
    } finally {
      setUploadingIcon(false);
    }
  };

  return (
    <AppShell isAdmin>
      <div className="flex-1 p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Quản lý danh mục</h1>
              <p className="text-text-muted">Tạo và quản lý các danh mục sản phẩm</p>
            </div>
            <Button onClick={() => setShowForm(true)} disabled={showForm}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm danh mục
            </Button>
          </div>

          {/* Form */}
          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle>{editingId ? 'Cập nhật' : 'Thêm'} danh mục</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Tên danh mục *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="VD: Tài Khoản Discord"
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
                      Tự động tạo từ tên. Có thể chỉnh sửa. Ví dụ: tai-khoan-discord-0211
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="description">Mô tả</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Mô tả danh mục..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Icon danh mục</Label>
                    <div className="mt-2 space-y-4">
                      {/* Icon Preview */}
                      {formData.icon && (
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 border border-border rounded-lg overflow-hidden bg-card flex items-center justify-center">
                            <Image
                              src={formData.icon}
                              alt="Category icon"
                              width={80}
                              height={80}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setFormData(prev => ({ ...prev, icon: '' }))}
                          >
                            Xóa icon
                          </Button>
                        </div>
                      )}
                      
                      {/* Upload Button */}
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleIconUpload}
                          className="hidden"
                          id="iconUpload"
                          disabled={uploadingIcon}
                        />
                        <label htmlFor="iconUpload">
                          <Button
                            type="button"
                            variant="outline"
                            disabled={uploadingIcon}
                            asChild
                          >
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              {uploadingIcon ? 'Đang upload...' : 'Upload icon'}
                            </span>
                          </Button>
                        </label>
                        <span className="text-sm text-text-muted">
                          PNG, JPG, WebP (Khuyến nghị: 128x128px)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      Hủy
                    </Button>
                    <Button type="submit">
                      {editingId ? 'Cập nhật' : 'Tạo'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* List */}
          <Card>
            <CardHeader>
              <CardTitle>Danh sách danh mục</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-text-muted">Đang tải...</div>
              ) : categories.length === 0 ? (
                <div className="text-center py-8 text-text-muted">Không có danh mục nào</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Icon</TableHead>
                      <TableHead>Tên</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Mô tả</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map(cat => (
                      <TableRow key={cat.id}>
                        <TableCell>
                          <div className="w-10 h-10 border border-border rounded-lg overflow-hidden bg-card flex items-center justify-center">
                            {cat.icon ? (
                              <Image
                                src={cat.icon}
                                alt={cat.name}
                                width={40}
                                height={40}
                                className="w-full h-full object-contain"
                                unoptimized
                                onError={(e) => {
                                  // Fallback to emoji if image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <span className={cat.icon ? 'hidden text-xl' : 'text-xl'}>📦</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{cat.name}</TableCell>
                        <TableCell className="text-text-muted text-sm">{cat.slug}</TableCell>
                        <TableCell>{cat.description}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(cat)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(cat.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
