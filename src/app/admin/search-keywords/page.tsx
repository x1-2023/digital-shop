'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, GripVertical, Search, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface SearchKeyword {
    id: string;
    keyword: string;
    subtitle: string | null;
    icon: string;
    order: number;
    active: boolean;
}

export default function SearchKeywordsPage() {
    const { toast } = useToast();
    const [keywords, setKeywords] = useState<SearchKeyword[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingKeyword, setEditingKeyword] = useState<SearchKeyword | null>(null);
    const [formData, setFormData] = useState({
        keyword: '',
        subtitle: '',
        icon: '🔥',
        order: 0,
        active: true,
    });

    useEffect(() => {
        fetchKeywords();
    }, []);

    const fetchKeywords = async () => {
        try {
            const res = await fetch('/api/admin/search-keywords');
            if (res.ok) {
                const data = await res.json();
                setKeywords(data);
            }
        } catch (error) {
            toast({ title: 'Lỗi tải dữ liệu', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingKeyword
                ? `/api/admin/search-keywords/${editingKeyword.id}`
                : '/api/admin/search-keywords';

            const res = await fetch(url, {
                method: editingKeyword ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast({ title: editingKeyword ? 'Đã cập nhật' : 'Đã thêm từ khóa mới' });
                setDialogOpen(false);
                resetForm();
                fetchKeywords();
            } else {
                const data = await res.json();
                toast({ title: data.error || 'Có lỗi xảy ra', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Có lỗi xảy ra', variant: 'destructive' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Xác nhận xóa từ khóa này?')) return;

        try {
            const res = await fetch(`/api/admin/search-keywords/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast({ title: 'Đã xóa' });
                fetchKeywords();
            }
        } catch (error) {
            toast({ title: 'Lỗi xóa', variant: 'destructive' });
        }
    };

    const toggleActive = async (keyword: SearchKeyword) => {
        try {
            const res = await fetch(`/api/admin/search-keywords/${keyword.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: !keyword.active }),
            });
            if (res.ok) {
                fetchKeywords();
            }
        } catch (error) {
            toast({ title: 'Lỗi cập nhật', variant: 'destructive' });
        }
    };

    const resetForm = () => {
        setFormData({ keyword: '', subtitle: '', icon: '🔥', order: 0, active: true });
        setEditingKeyword(null);
    };

    const openEditDialog = (keyword: SearchKeyword) => {
        setEditingKeyword(keyword);
        setFormData({
            keyword: keyword.keyword,
            subtitle: keyword.subtitle || '',
            icon: keyword.icon,
            order: keyword.order,
            active: keyword.active,
        });
        setDialogOpen(true);
    };

    const emojiOptions = ['🔥', '⭐', '🎮', '💎', '🚀', '📱', '💬', '🤖', '🎬', '🎵', '📧', '🛡️'];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Từ Khóa Tìm Kiếm</h1>
                    <p className="text-muted-foreground">Quản lý gợi ý tìm kiếm hiển thị trong dropdown</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Thêm từ khóa
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingKeyword ? 'Sửa từ khóa' : 'Thêm từ khóa mới'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="keyword">Từ khóa *</Label>
                                <Input
                                    id="keyword"
                                    value={formData.keyword}
                                    onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                                    placeholder="VD: Netflix Premium"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="subtitle">Mô tả</Label>
                                <Input
                                    id="subtitle"
                                    value={formData.subtitle}
                                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                    placeholder="VD: Bán chạy nhất tuần"
                                />
                            </div>

                            <div>
                                <Label>Icon</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {emojiOptions.map((emoji) => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, icon: emoji })}
                                            className={`w-10 h-10 rounded-lg border-2 text-lg flex items-center justify-center transition-all ${formData.icon === emoji ? 'border-brand bg-brand/10' : 'border-border hover:border-brand/50'
                                                }`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="order">Thứ tự</Label>
                                <Input
                                    id="order"
                                    type="number"
                                    value={formData.order}
                                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <Label htmlFor="active">Kích hoạt</Label>
                                <Switch
                                    id="active"
                                    checked={formData.active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                                />
                            </div>

                            <Button type="submit" className="w-full">
                                {editingKeyword ? 'Cập nhật' : 'Thêm mới'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        Danh sách từ khóa gợi ý
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
                    ) : keywords.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Chưa có từ khóa nào. Thêm từ khóa để hiển thị gợi ý tìm kiếm.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">Icon</TableHead>
                                    <TableHead>Từ khóa</TableHead>
                                    <TableHead>Mô tả</TableHead>
                                    <TableHead className="w-20">Thứ tự</TableHead>
                                    <TableHead className="w-20">Trạng thái</TableHead>
                                    <TableHead className="w-24">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {keywords.map((keyword) => (
                                    <TableRow key={keyword.id}>
                                        <TableCell>
                                            <span className="text-xl">{keyword.icon}</span>
                                        </TableCell>
                                        <TableCell className="font-medium">{keyword.keyword}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {keyword.subtitle || '-'}
                                        </TableCell>
                                        <TableCell>{keyword.order}</TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={keyword.active}
                                                onCheckedChange={() => toggleActive(keyword)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditDialog(keyword)}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(keyword.id)}
                                                    className="text-red-500 hover:text-red-600"
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
