'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye, EyeOff, GripVertical, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Banner {
    id: string;
    title: string;
    subtitle: string | null;
    description: string | null;
    buttonText: string;
    buttonLink: string;
    imageUrl: string | null;
    gradientFrom: string;
    gradientTo: string;
    features: string | null;
    order: number;
    active: boolean;
    createdAt: string;
}

export default function AdminBannersPage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        description: '',
        buttonText: 'Khám phá ngay',
        buttonLink: '/products',
        imageUrl: '',
        gradientFrom: '#2563EB',
        gradientTo: '#06B6D4',
        features: '',
        order: 0,
        active: true,
    });

    useEffect(() => {
        fetchBanners();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchBanners = async () => {
        try {
            const res = await fetch('/api/admin/banners');
            if (res.ok) {
                const data = await res.json();
                setBanners(data.banners || []);
            }
        } catch (error) {
            console.error('Error fetching banners:', error);
            toast({
                variant: 'destructive',
                title: 'Lỗi',
                description: 'Không thể tải danh sách banner',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            subtitle: '',
            description: '',
            buttonText: 'Khám phá ngay',
            buttonLink: '/products',
            imageUrl: '',
            gradientFrom: '#2563EB',
            gradientTo: '#06B6D4',
            features: '',
            order: 0,
            active: true,
        });
        setEditingBanner(null);
    };

    const handleEdit = (banner: Banner) => {
        setEditingBanner(banner);
        setFormData({
            title: banner.title,
            subtitle: banner.subtitle || '',
            description: banner.description || '',
            buttonText: banner.buttonText,
            buttonLink: banner.buttonLink,
            imageUrl: banner.imageUrl || '',
            gradientFrom: banner.gradientFrom,
            gradientTo: banner.gradientTo,
            features: banner.features ? JSON.parse(banner.features).join('\n') : '',
            order: banner.order,
            active: banner.active,
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const url = editingBanner
                ? `/api/admin/banners/${editingBanner.id}`
                : '/api/admin/banners';

            const method = editingBanner ? 'PUT' : 'POST';

            const featuresArray = formData.features
                .split('\n')
                .map(f => f.trim())
                .filter(f => f.length > 0);

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    features: featuresArray.length > 0 ? featuresArray : null,
                }),
            });

            if (res.ok) {
                toast({
                    title: 'Thành công',
                    description: editingBanner ? 'Đã cập nhật banner' : 'Đã tạo banner mới',
                });
                fetchBanners();
                setIsDialogOpen(false);
                resetForm();
            } else {
                const error = await res.json();
                throw new Error(error.error || 'Unknown error');
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Không thể lưu banner';
            toast({
                variant: 'destructive',
                title: 'Lỗi',
                description: errorMessage,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa banner này?')) return;

        try {
            const res = await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast({ title: 'Đã xóa banner' });
                fetchBanners();
            }
        } catch {
            toast({
                variant: 'destructive',
                title: 'Lỗi',
                description: 'Không thể xóa banner',
            });
        }
    };

    const handleToggleActive = async (banner: Banner) => {
        try {
            const res = await fetch(`/api/admin/banners/${banner.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: !banner.active }),
            });

            if (res.ok) {
                toast({ title: banner.active ? 'Đã ẩn banner' : 'Đã hiện banner' });
                fetchBanners();
            }
        } catch {
            toast({
                variant: 'destructive',
                title: 'Lỗi',
                description: 'Không thể cập nhật trạng thái',
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Quản Lý Banner</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Cấu hình slider banner trên trang chủ
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Thêm Banner
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingBanner ? 'Chỉnh Sửa Banner' : 'Thêm Banner Mới'}</DialogTitle>
                            <DialogDescription>
                                Banner sẽ hiển thị trên slider của trang chủ
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Tiêu đề *</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="VD: MARKETPLACE MMO"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subtitle">Phụ đề</Label>
                                    <Input
                                        id="subtitle"
                                        value={formData.subtitle}
                                        onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                        placeholder="VD: ESCROW BẢO VỆ 100%"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Mô tả</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Mô tả ngắn gọn về banner"
                                    rows={2}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="buttonText">Nội dung nút</Label>
                                    <Input
                                        id="buttonText"
                                        value={formData.buttonText}
                                        onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="buttonLink">Link nút</Label>
                                    <Input
                                        id="buttonLink"
                                        value={formData.buttonLink}
                                        onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                                        placeholder="/products"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="features">Điểm nổi bật (mỗi dòng 1 điểm)</Label>
                                <Textarea
                                    id="features"
                                    value={formData.features}
                                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                                    placeholder="Escrow bảo vệ&#10;Bảo hành rõ ràng&#10;Telegram support"
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="gradientFrom">Màu gradient (bắt đầu)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="color"
                                            value={formData.gradientFrom}
                                            onChange={(e) => setFormData({ ...formData, gradientFrom: e.target.value })}
                                            className="w-12 h-10 p-1"
                                        />
                                        <Input
                                            id="gradientFrom"
                                            value={formData.gradientFrom}
                                            onChange={(e) => setFormData({ ...formData, gradientFrom: e.target.value })}
                                            placeholder="#2563EB"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gradientTo">Màu gradient (kết thúc)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="color"
                                            value={formData.gradientTo}
                                            onChange={(e) => setFormData({ ...formData, gradientTo: e.target.value })}
                                            className="w-12 h-10 p-1"
                                        />
                                        <Input
                                            id="gradientTo"
                                            value={formData.gradientTo}
                                            onChange={(e) => setFormData({ ...formData, gradientTo: e.target.value })}
                                            placeholder="#06B6D4"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="imageUrl">URL Ảnh nền (tùy chọn)</Label>
                                    <Input
                                        id="imageUrl"
                                        value={formData.imageUrl}
                                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                        placeholder="https://example.com/banner.jpg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="order">Thứ tự hiển thị</Label>
                                    <Input
                                        id="order"
                                        type="number"
                                        value={formData.order}
                                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Switch
                                    id="active"
                                    checked={formData.active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                                />
                                <Label htmlFor="active">Hiển thị trên trang chủ</Label>
                            </div>

                            {/* Preview */}
                            <div className="mt-4 p-4 rounded-xl text-white" style={{
                                background: `linear-gradient(to right, ${formData.gradientFrom}, ${formData.gradientTo})`
                            }}>
                                <p className="text-xs opacity-75 mb-1">Xem trước:</p>
                                <h3 className="text-xl font-bold">{formData.title || 'Tiêu đề'}</h3>
                                <p className="text-lg font-semibold opacity-90">{formData.subtitle || 'Phụ đề'}</p>
                                <p className="text-sm opacity-75 mt-1">{formData.description || 'Mô tả'}</p>
                            </div>

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">Hủy</Button>
                                </DialogClose>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? 'Đang lưu...' : (editingBanner ? 'Cập nhật' : 'Tạo mới')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Danh Sách Banner</CardTitle>
                    <CardDescription>
                        Kéo thả để sắp xếp thứ tự hiển thị (chức năng đang phát triển)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
                    ) : banners.length === 0 ? (
                        <div className="text-center py-8">
                            <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">Chưa có banner nào</p>
                            <p className="text-sm text-muted-foreground">Nhấn &quot;Thêm Banner&quot; để tạo banner đầu tiên</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10">#</TableHead>
                                    <TableHead>Tiêu đề</TableHead>
                                    <TableHead>Màu sắc</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {banners.map((banner) => (
                                    <TableRow key={banner.id}>
                                        <TableCell>
                                            <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{banner.title}</div>
                                            <div className="text-sm text-muted-foreground">{banner.subtitle}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-6 h-6 rounded"
                                                    style={{ background: `linear-gradient(to right, ${banner.gradientFrom}, ${banner.gradientTo})` }}
                                                />
                                                <span className="text-xs text-muted-foreground">
                                                    {banner.gradientFrom} → {banner.gradientTo}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={banner.active ? 'default' : 'secondary'}>
                                                {banner.active ? 'Hiển thị' : 'Ẩn'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleToggleActive(banner)}
                                                    title={banner.active ? 'Ẩn' : 'Hiện'}
                                                >
                                                    {banner.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(banner)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(banner.id)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="w-4 h-4" />
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
    );
}
