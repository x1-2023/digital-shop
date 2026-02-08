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
import { Plus, Edit, Trash2, Trophy, Zap, Users, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatCurrency } from '@/lib/utils';

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

interface AutoSpender {
    id: string;
    name: string;
    fullName: string;
    totalSpent: number;
    avatarUrl: string | null;
    rank: number;
}

export default function AdminFeaturedUsersPage() {
    const [users, setUsers] = useState<FeaturedUser[]>([]);
    const [autoSpenders, setAutoSpenders] = useState<AutoSpender[]>([]);
    const [mode, setMode] = useState<'manual' | 'auto'>('manual');
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<FeaturedUser | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSwitchingMode, setIsSwitchingMode] = useState(false);
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
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/featured-users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
                setMode(data.mode || 'manual');
                setAutoSpenders(data.autoSpenders || []);
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

    const handleToggleMode = async () => {
        const newMode = mode === 'manual' ? 'auto' : 'manual';
        setIsSwitchingMode(true);

        try {
            const res = await fetch('/api/admin/featured-users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: newMode }),
            });

            if (res.ok) {
                setMode(newMode);
                toast({
                    title: 'Đã chuyển chế độ',
                    description: newMode === 'auto'
                        ? 'Đang hiển thị top chi tiêu từ đơn hàng thật'
                        : 'Đang hiển thị danh sách thủ công',
                });
                // Re-fetch to get auto spenders if switching to auto
                fetchUsers();
            }
        } catch {
            toast({
                variant: 'destructive',
                title: 'Lỗi',
                description: 'Không thể chuyển chế độ',
            });
        } finally {
            setIsSwitchingMode(false);
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
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Không thể lưu Top Seller';
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
        if (!confirm('Bạn có chắc chắn muốn xóa Top Seller này?')) return;

        try {
            const res = await fetch(`/api/admin/featured-users/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast({ title: 'Đã xóa Top Seller' });
                fetchUsers();
            }
        } catch {
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
            </div>

            {/* Mode Toggle Card */}
            <Card className="border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-transparent">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Settings className="w-5 h-5 text-purple-500" />
                            <div>
                                <p className="font-semibold text-foreground">Chế độ hiển thị</p>
                                <p className="text-sm text-muted-foreground">
                                    {mode === 'manual'
                                        ? 'Thủ công — Hiện danh sách bạn tạo'
                                        : 'Tự động — Tính từ đơn hàng thật'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-sm font-medium ${mode === 'manual' ? 'text-purple-500' : 'text-muted-foreground'}`}>
                                <Users className="w-4 h-4 inline mr-1" />
                                Thủ công
                            </span>
                            <Switch
                                checked={mode === 'auto'}
                                onCheckedChange={handleToggleMode}
                                disabled={isSwitchingMode}
                            />
                            <span className={`text-sm font-medium ${mode === 'auto' ? 'text-green-500' : 'text-muted-foreground'}`}>
                                <Zap className="w-4 h-4 inline mr-1" />
                                Tự động
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Auto Mode Preview */}
            {mode === 'auto' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-green-500" />
                            Top Chi Tiêu (Tự động)
                        </CardTitle>
                        <CardDescription>
                            Dữ liệu được tính tự động từ đơn hàng đã thanh toán
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {autoSpenders.length === 0 ? (
                            <div className="text-center py-8">
                                <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">Chưa có đơn hàng nào</p>
                                <p className="text-sm text-muted-foreground">Khi có khách mua hàng, top chi tiêu sẽ tự động hiển thị</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10">#</TableHead>
                                        <TableHead>Người dùng</TableHead>
                                        <TableHead>Tên đầy đủ</TableHead>
                                        <TableHead className="text-right">Tổng chi tiêu</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {autoSpenders.map((spender) => (
                                        <TableRow key={spender.id}>
                                            <TableCell className="font-bold text-yellow-600">{spender.rank}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="bg-green-500/10 text-green-600 font-bold text-xs">
                                                            {spender.name[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">{spender.name}</span>
                                                    <Badge variant="outline" className="text-xs">hiển thị</Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{spender.fullName}</TableCell>
                                            <TableCell className="text-right font-bold text-green-500">
                                                {formatCurrency(spender.totalSpent)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Manual Mode - CRUD */}
            {mode === 'manual' && (
                <>
                    <div className="flex justify-end">
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
                                        Seller sẽ hiển thị trên widget &quot;Top Chi Tiêu&quot; ở trang chủ
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Tên hiển thị *</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="VD: MMO***"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="sales">Số tiền chi tiêu (VNĐ)</Label>
                                            <Input
                                                id="sales"
                                                type="number"
                                                value={formData.sales}
                                                onChange={(e) => setFormData({ ...formData, sales: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="rank">Thứ hạng</Label>
                                            <Input
                                                id="rank"
                                                type="number"
                                                value={formData.rank}
                                                onChange={(e) => setFormData({ ...formData, rank: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="avatarUrl">URL Avatar (tùy chọn)</Label>
                                        <Input
                                            id="avatarUrl"
                                            value={formData.avatarUrl}
                                            onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                                            placeholder="https://..."
                                        />
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
                            <CardTitle>Danh Sách Top Sellers (Thủ công)</CardTitle>
                            <CardDescription>
                                Các seller này sẽ hiển thị trong widget &quot;Top Chi Tiêu&quot; trên trang chủ
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
                            ) : users.length === 0 ? (
                                <div className="text-center py-8">
                                    <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">Chưa có Top Seller nào</p>
                                    <p className="text-sm text-muted-foreground">Nhấn &quot;Thêm Seller&quot; để tạo mới</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-10">#</TableHead>
                                            <TableHead>Seller</TableHead>
                                            <TableHead>Chi tiêu</TableHead>
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
                                                <TableCell className="font-medium text-green-500">
                                                    {formatCurrency(user.sales)}
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
                </>
            )}
        </div>
    );
}
