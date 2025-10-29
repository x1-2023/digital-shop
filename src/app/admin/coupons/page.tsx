'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Tag, Calendar, Percent } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  maxDiscountVnd?: number;
  minOrderVnd: number;
  maxUses?: number;
  usedCount: number;
  startDate?: string;
  expiryDate?: string;
  active: boolean;
  createdAt: string;
}

export default function CouponsAdminPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    discountValue: 0,
    maxDiscountVnd: '',
    minOrderVnd: 0,
    maxUses: '',
    startDate: '',
    expiryDate: '',
    active: true,
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...formData,
        maxDiscountVnd: formData.maxDiscountVnd ? parseFloat(formData.maxDiscountVnd) : undefined,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
      };

      const url = editingCoupon 
        ? `/api/admin/coupons/${editingCoupon.id}`
        : '/api/admin/coupons';
      
      const method = editingCoupon ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({
          variant: 'success',
          title: editingCoupon ? 'Đã cập nhật coupon' : 'Đã tạo coupon',
        });
        fetchCoupons();
        resetForm();
      } else {
        const data = await res.json();
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: data.error || 'Không thể lưu coupon',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Đã xảy ra lỗi khi lưu coupon',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa coupon này?')) return;

    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast({
          variant: 'success',
          title: 'Đã xóa coupon',
        });
        fetchCoupons();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể xóa coupon',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 0,
      maxDiscountVnd: '',
      minOrderVnd: 0,
      maxUses: '',
      startDate: '',
      expiryDate: '',
      active: true,
    });
    setEditingCoupon(null);
    setShowForm(false);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscountVnd: coupon.maxDiscountVnd?.toString() || '',
      minOrderVnd: coupon.minOrderVnd,
      maxUses: coupon.maxUses?.toString() || '',
      startDate: coupon.startDate ? coupon.startDate.split('T')[0] : '',
      expiryDate: coupon.expiryDate ? coupon.expiryDate.split('T')[0] : '',
      active: coupon.active,
    });
    setShowForm(true);
  };

  return (
    <AppShell isAdmin>
      <div className="flex-1 p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Quản lý Coupon</h1>
              <p className="text-text-muted">Tạo và quản lý mã giảm giá</p>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo Coupon
            </Button>
          </div>

          {/* Create/Edit Form */}
          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle>{editingCoupon ? 'Sửa Coupon' : 'Tạo Coupon Mới'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Mã Coupon *</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="SAVE20"
                        required
                        disabled={!!editingCoupon}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discountType">Loại Giảm Giá *</Label>
                      <Select
                        value={formData.discountType}
                        onValueChange={(value: 'PERCENTAGE' | 'FIXED') => 
                          setFormData({ ...formData, discountType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENTAGE">Phần trăm (%)</SelectItem>
                          <SelectItem value="FIXED">Số tiền cố định (VND)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discountValue">
                        {formData.discountType === 'PERCENTAGE' ? 'Phần trăm (%)' : 'Số tiền (VND)'} *
                      </Label>
                      <Input
                        id="discountValue"
                        type="number"
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
                        min="0"
                        step={formData.discountType === 'PERCENTAGE' ? '1' : '1000'}
                        required
                      />
                    </div>

                    {formData.discountType === 'PERCENTAGE' && (
                      <div className="space-y-2">
                        <Label htmlFor="maxDiscountVnd">Giảm tối đa (VND)</Label>
                        <Input
                          id="maxDiscountVnd"
                          type="number"
                          value={formData.maxDiscountVnd}
                          onChange={(e) => setFormData({ ...formData, maxDiscountVnd: e.target.value })}
                          placeholder="Không giới hạn"
                          min="0"
                          step="1000"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="minOrderVnd">Đơn hàng tối thiểu (VND)</Label>
                      <Input
                        id="minOrderVnd"
                        type="number"
                        value={formData.minOrderVnd}
                        onChange={(e) => setFormData({ ...formData, minOrderVnd: parseFloat(e.target.value) })}
                        min="0"
                        step="1000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxUses">Số lần sử dụng tối đa</Label>
                      <Input
                        id="maxUses"
                        type="number"
                        value={formData.maxUses}
                        onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                        placeholder="Không giới hạn"
                        min="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="startDate">Ngày bắt đầu</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expiryDate">Ngày hết hạn</Label>
                      <Input
                        id="expiryDate"
                        type="date"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="description">Mô tả</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Giảm 20% cho đơn hàng đầu tiên"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="active"
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
                      />
                      <Label htmlFor="active" className="font-normal">Kích hoạt coupon</Label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">
                      {editingCoupon ? 'Cập nhật' : 'Tạo Coupon'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Hủy
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Coupons List */}
          <Card>
            <CardHeader>
              <CardTitle>Danh sách Coupon</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : coupons.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  Chưa có coupon nào
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã</TableHead>
                      <TableHead>Giảm giá</TableHead>
                      <TableHead>Đã dùng</TableHead>
                      <TableHead>Hết hạn</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupons.map((coupon) => (
                      <TableRow key={coupon.id}>
                        <TableCell>
                          <div className="font-mono font-bold">{coupon.code}</div>
                          {coupon.description && (
                            <div className="text-sm text-text-muted">{coupon.description}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {coupon.discountType === 'PERCENTAGE' ? (
                            <span>{coupon.discountValue}%</span>
                          ) : (
                            <span>{formatCurrency(coupon.discountValue)}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {coupon.usedCount}
                          {coupon.maxUses && ` / ${coupon.maxUses}`}
                        </TableCell>
                        <TableCell>
                          {coupon.expiryDate ? (
                            <span className="text-sm">
                              {new Date(coupon.expiryDate).toLocaleDateString('vi-VN')}
                            </span>
                          ) : (
                            <span className="text-text-muted">Vô hạn</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={coupon.active ? 'success' : 'secondary'}>
                            {coupon.active ? 'Hoạt động' : 'Tắt'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(coupon)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(coupon.id)}
                            className="text-danger"
                          >
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
