'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Trophy, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface FeaturedUser {
    id: string;
    name: string;
    sales: number;
    rating: number;
    avatarUrl: string | null;
    rank: number;
    active: boolean;
    createdAt: string;
}

export default function AdminFeaturedUsersPage() {
    const [users, setUsers] = useState<FeaturedUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<FeaturedUser | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        name: '',
        sales: 0,
        rating: 5.0,
        avatarUrl: '',
        rank: 0,
        active: true,
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/featured-users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error('Error fetching featured users:', error);
            toast({
                variant: 'destructive',
                title: 'Lỗi',
                description: 'Không thể tải danh sách Top Sellers',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            sales: 0,
            rating: 5.0,
            avatarUrl: '',
            rank: 0,
            active: true,
        });
        setEditingUser(null);
    };

    const handleEdit = (user: FeaturedUser) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            sales: user.sales,
            rating: user.rating,
            avatarUrl: user.avatarUrl || '',
            rank: user.rank,
            active: user.active,
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const url = editingUser
                ? `/api/admin/featured-users/${editingUser.id}`
                : '/api/admin/featured-users';

            const method = editingUser ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast({
                    title: 'Thành công',
                    description: editingUser ? 'Đã cập nhật Top Seller' : 'Đã thêm Top Seller mới',
                });
                fetchUsers();
                setIsDialogOpen(false);
                resetForm();
            } else {
                const error = await res.json();
                throw new Error(error.error || 'Unknown error');
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Lỗi',
                description: error.message || 'Không thể lưu Top Seller',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa Top Seller này?')) return;

        try {
            const res = await fetch(`/api/admin/featured-users/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast({ title: 'Đã xóa Top Seller' });
                fetchUsers();
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Lỗi',
                description: 'Không thể xóa Top Seller',
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Top Sellers</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Quản lý danh sách Top Seller hiển thị trên trang chủ
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Thêm Seller
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingUser ? 'Chỉnh Sửa Seller' : 'Thêm Seller Mới'}</DialogTitle>
                            <DialogDescription>
                                Seller sẽ hiển thị trên widget "Top Seller Tuần" ở trang chủ
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Tên hiển thị *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="VD: MMO_Master"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="sales">Số lượt bán</Label>
                                    <Input
                                        id="sales"
                                        type="number"
                                        value={formData.sales}
                                        onChange={(e) => setFormData({ ...formData, sales: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rating">Đánh giá (1-5)</Label>
                                    <Input
                                        id="rating"
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="5"
                                        value={formData.rating}
                                        onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 5.0 })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="rank">Thứ hạng</Label>
                                    <Input
                                        id="rank"
                                        type="number"
                                        value={formData.rank}
                                        onChange={(e) => setFormData({ ...formData, rank: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="avatarUrl">URL Avatar</Label>
                                    <Input
                                        id="avatarUrl"
                                        value={formData.avatarUrl}
                                        onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                                        placeholder="https://..."
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

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">Hủy</Button>
                                </DialogClose>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? 'Đang lưu...' : (editingUser ? 'Cập nhật' : 'Tạo mới')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Danh Sách Top Sellers</CardTitle>
                    <CardDescription>
                        Các seller này sẽ hiển thị trong widget "Top Seller Tuần" trên trang chủ
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-8">
                            <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">Chưa có Top Seller nào</p>
                            <p className="text-sm text-muted-foreground">Nhấn "Thêm Seller" để tạo mới</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10">#</TableHead>
                                    <TableHead>Seller</TableHead>
                                    <TableHead>Doanh số</TableHead>
                                    <TableHead>Rating</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-bold text-yellow-600">{user.rank}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={user.avatarUrl || ''} />
                                                    <AvatarFallback className="bg-brand/10 text-brand font-bold text-xs">
                                                        {user.name[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{user.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{user.sales.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                {user.rating.toFixed(1)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.active ? 'default' : 'secondary'}>
                                                {user.active ? 'Hiển thị' : 'Ẩn'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(user)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(user.id)}
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
