'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye, EyeOff, Image as ImageIcon, Code, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Advertisement {
  id: string;
  name: string;
  type: 'GOOGLE_ADSENSE' | 'HTML_EMBED' | 'IMAGE_BANNER' | 'VIDEO';
  placement: 'SIDEBAR_LEFT' | 'SIDEBAR_RIGHT' | 'BETWEEN_PRODUCTS' | 'HEADER' | 'FOOTER';
  content: string;
  imageUrl?: string | null;
  clickUrl?: string | null;
  order: number;
  enabled: boolean;
  impressions: number;
  clicks: number;
  createdAt: string;
  updatedAt: string;
}

const AD_TYPES = [
  { value: 'GOOGLE_ADSENSE', label: 'Google AdSense', icon: Code },
  { value: 'HTML_EMBED', label: 'Custom HTML/JS', icon: Code },
  { value: 'IMAGE_BANNER', label: 'Image Banner', icon: ImageIcon },
  { value: 'VIDEO', label: 'Video', icon: Video },
];

const PLACEMENTS = [
  { value: 'SIDEBAR_LEFT', label: 'Sidebar Trái' },
  { value: 'SIDEBAR_RIGHT', label: 'Sidebar Phải' },
  { value: 'BETWEEN_PRODUCTS', label: 'Giữa Sản Phẩm' },
  { value: 'HEADER', label: 'Header' },
  { value: 'FOOTER', label: 'Footer' },
];

export default function AdminAdvertisementsPage() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    type: 'IMAGE_BANNER' as Advertisement['type'],
    placement: 'SIDEBAR_RIGHT' as Advertisement['placement'],
    content: '',
    imageUrl: '',
    clickUrl: '',
    order: 0,
    enabled: true,
  });

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const res = await fetch('/api/admin/advertisements');
      if (res.ok) {
        const data = await res.json();
        setAds(data.ads || []);
      }
    } catch (error) {
      console.error('Error fetching ads:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tải danh sách quảng cáo',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const url = editingAd
        ? `/api/admin/advertisements/${editingAd.id}`
        : '/api/admin/advertisements';

      const method = editingAd ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast({
          title: 'Thành công',
          description: editingAd ? 'Đã cập nhật quảng cáo' : 'Đã tạo quảng cáo mới',
        });
        setIsDialogOpen(false);
        resetForm();
        fetchAds();
      } else {
        throw new Error('Failed to save ad');
      }
    } catch (error) {
      console.error('Error saving ad:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể lưu quảng cáo',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa quảng cáo này?')) return;

    try {
      const res = await fetch(`/api/admin/advertisements/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast({
          title: 'Đã xóa',
          description: 'Quảng cáo đã được xóa',
        });
        fetchAds();
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể xóa quảng cáo',
      });
    }
  };

  const handleEdit = (ad: Advertisement) => {
    setEditingAd(ad);
    setFormData({
      name: ad.name,
      type: ad.type,
      placement: ad.placement,
      content: ad.content,
      imageUrl: ad.imageUrl || '',
      clickUrl: ad.clickUrl || '',
      order: ad.order,
      enabled: ad.enabled,
    });
    setIsDialogOpen(true);
  };

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/admin/advertisements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });

      if (res.ok) {
        fetchAds();
      }
    } catch (error) {
      console.error('Error toggling ad:', error);
    }
  };

  const resetForm = () => {
    setEditingAd(null);
    setFormData({
      name: '',
      type: 'IMAGE_BANNER',
      placement: 'SIDEBAR_RIGHT',
      content: '',
      imageUrl: '',
      clickUrl: '',
      order: 0,
      enabled: true,
    });
  };

  const getTypeIcon = (type: Advertisement['type']) => {
    const adType = AD_TYPES.find((t) => t.value === type);
    return adType ? <adType.icon className="h-4 w-4" /> : null;
  };

  const getCTR = (ad: Advertisement) => {
    if (ad.impressions === 0) return '0%';
    return ((ad.clicks / ad.impressions) * 100).toFixed(2) + '%';
  };

  return (
    <AppShell isAdmin>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quản Lý Quảng Cáo</h1>
            <p className="text-muted-foreground">
              Quản lý quảng cáo hiển thị trên website
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Thêm Quảng Cáo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAd ? 'Chỉnh Sửa Quảng Cáo' : 'Thêm Quảng Cáo Mới'}
                </DialogTitle>
                <DialogDescription>
                  Cấu hình quảng cáo hiển thị trên website
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Tên (Nội bộ)</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: Banner Trang Chủ"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Loại Quảng Cáo</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value as Advertisement['type'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AD_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="placement">Vị Trí</Label>
                    <Select
                      value={formData.placement}
                      onValueChange={(value) => setFormData({ ...formData, placement: value as Advertisement['placement'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLACEMENTS.map((placement) => (
                          <SelectItem key={placement.value} value={placement.value}>
                            {placement.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.type === 'IMAGE_BANNER' && (
                  <>
                    <div>
                      <Label htmlFor="imageUrl">URL Hình Ảnh</Label>
                      <Input
                        id="imageUrl"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder="https://example.com/banner.jpg"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Upload ảnh lên hosting hoặc nhập URL
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="clickUrl">Link Khi Click</Label>
                      <Input
                        id="clickUrl"
                        value={formData.clickUrl}
                        onChange={(e) => setFormData({ ...formData, clickUrl: e.target.value })}
                        placeholder="https://example.com/landing-page"
                      />
                    </div>
                  </>
                )}

                {(formData.type === 'GOOGLE_ADSENSE' || formData.type === 'HTML_EMBED' || formData.type === 'VIDEO') && (
                  <div>
                    <Label htmlFor="content">
                      {formData.type === 'GOOGLE_ADSENSE' ? 'Google AdSense Code' :
                       formData.type === 'VIDEO' ? 'Video Embed Code' : 'HTML/JavaScript Code'}
                    </Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder={
                        formData.type === 'GOOGLE_ADSENSE'
                          ? '<script async src="https://pagead2.googlesyndication.com/..."></script>'
                          : formData.type === 'VIDEO'
                          ? '<iframe src="https://www.youtube.com/embed/..." ...></iframe>'
                          : '<div>Custom HTML content</div>'
                      }
                      rows={8}
                      className="font-mono text-sm"
                      required
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="order">Thứ Tự Hiển Thị</Label>
                    <Input
                      id="order"
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Số nhỏ hiển thị trước
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 pt-8">
                    <Switch
                      id="enabled"
                      checked={formData.enabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                    />
                    <Label htmlFor="enabled">Kích hoạt</Label>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Đang lưu...' : editingAd ? 'Cập Nhật' : 'Tạo Quảng Cáo'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Hủy
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Danh Sách Quảng Cáo</CardTitle>
            <CardDescription>
              Tổng: {ads.length} quảng cáo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Đang tải...</div>
            ) : ads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Chưa có quảng cáo nào. Nhấn &quot;Thêm Quảng Cáo&quot; để bắt đầu.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Vị Trí</TableHead>
                    <TableHead>Thứ Tự</TableHead>
                    <TableHead>Trạng Thái</TableHead>
                    <TableHead>Impressions</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>CTR</TableHead>
                    <TableHead className="text-right">Thao Tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ads.map((ad) => (
                    <TableRow key={ad.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(ad.type)}
                          {ad.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {AD_TYPES.find((t) => t.value === ad.type)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {PLACEMENTS.find((p) => p.value === ad.placement)?.label}
                      </TableCell>
                      <TableCell>{ad.order}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleEnabled(ad.id, !ad.enabled)}
                        >
                          {ad.enabled ? (
                            <Eye className="h-4 w-4 text-green-500" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>{ad.impressions.toLocaleString()}</TableCell>
                      <TableCell>{ad.clicks.toLocaleString()}</TableCell>
                      <TableCell>{getCTR(ad)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(ad)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(ad.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
