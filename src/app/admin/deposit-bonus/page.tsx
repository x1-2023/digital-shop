'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Gift, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BonusTier {
  minAmount: number;
  maxAmount: number;
  bonusPercent: number;
}

export default function AdminDepositBonusPage() {
  const [tiers, setTiers] = useState<BonusTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    minAmount: 0,
    maxAmount: 0,
    bonusPercent: 0,
  });

  // Demo calculation
  const [demoAmount, setDemoAmount] = useState(100000);
  const [demoBonus, setDemoBonus] = useState({ percent: 0, amount: 0, total: 0 });

  useEffect(() => {
    fetchTiers();
  }, []);

  useEffect(() => {
    calculateDemoBonus();
  }, [demoAmount, tiers]);

  const fetchTiers = async () => {
    try {
      const res = await fetch('/api/admin/deposit-bonus');
      if (res.ok) {
        const data = await res.json();
        setTiers(data.tiers || []);
      }
    } catch (error) {
      console.error('Error fetching tiers:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tải cấu hình thưởng',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDemoBonus = () => {
    const matchingTier = tiers.find(
      (tier) => demoAmount >= tier.minAmount && demoAmount <= tier.maxAmount
    );

    if (matchingTier) {
      const bonusAmount = Math.floor((demoAmount * matchingTier.bonusPercent) / 100);
      setDemoBonus({
        percent: matchingTier.bonusPercent,
        amount: bonusAmount,
        total: demoAmount + bonusAmount,
      });
    } else {
      setDemoBonus({ percent: 0, amount: 0, total: demoAmount });
    }
  };

  const handleSaveTiers = async () => {
    setIsSaving(true);

    try {
      const res = await fetch('/api/admin/deposit-bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiers }),
      });

      if (res.ok) {
        toast({
          title: 'Thành công',
          description: 'Đã lưu cấu hình thưởng nạp tiền',
        });
        fetchTiers();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
    } catch (error: any) {
      console.error('Error saving tiers:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error.message || 'Không thể lưu cấu hình',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTier = () => {
    if (formData.minAmount >= formData.maxAmount) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Số tiền tối thiểu phải nhỏ hơn số tiền tối đa',
      });
      return;
    }

    if (formData.bonusPercent <= 0 || formData.bonusPercent > 100) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Phần trăm thưởng phải từ 0-100%',
      });
      return;
    }

    const newTiers = [...tiers];

    if (editingIndex !== null) {
      newTiers[editingIndex] = formData;
    } else {
      newTiers.push(formData);
    }

    // Sort by minAmount
    newTiers.sort((a, b) => a.minAmount - b.minAmount);

    setTiers(newTiers);
    setIsDialogOpen(false);
    resetForm();

    toast({
      title: 'Đã thêm',
      description: 'Tier đã được thêm. Nhấn "Lưu Cấu Hình" để áp dụng.',
    });
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setFormData(tiers[index]);
    setIsDialogOpen(true);
  };

  const handleDelete = (index: number) => {
    if (!confirm('Bạn có chắc muốn xóa tier này?')) return;

    const newTiers = tiers.filter((_, i) => i !== index);
    setTiers(newTiers);

    toast({
      title: 'Đã xóa',
      description: 'Tier đã được xóa. Nhấn "Lưu Cấu Hình" để áp dụng.',
    });
  };

  const resetForm = () => {
    setEditingIndex(null);
    setFormData({
      minAmount: 0,
      maxAmount: 0,
      bonusPercent: 0,
    });
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
  };

  return (
    <AppShell isAdmin>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Gift className="h-8 w-8" />
              Thưởng % Nạp Tiền
            </h1>
            <p className="text-muted-foreground">
              Cấu hình thưởng khi khách hàng nạp tiền
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSaveTiers}
              disabled={isSaving || tiers.length === 0}
            >
              {isSaving ? 'Đang lưu...' : 'Lưu Cấu Hình'}
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm Tier
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingIndex !== null ? 'Chỉnh Sửa Tier' : 'Thêm Tier Mới'}
                  </DialogTitle>
                  <DialogDescription>
                    Cấu hình mức thưởng theo khoảng số tiền nạp
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="minAmount">Số Tiền Tối Thiểu (VND)</Label>
                    <Input
                      id="minAmount"
                      type="number"
                      value={formData.minAmount}
                      onChange={(e) => setFormData({ ...formData, minAmount: parseInt(e.target.value) || 0 })}
                      placeholder="50000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxAmount">Số Tiền Tối Đa (VND)</Label>
                    <Input
                      id="maxAmount"
                      type="number"
                      value={formData.maxAmount}
                      onChange={(e) => setFormData({ ...formData, maxAmount: parseInt(e.target.value) || 0 })}
                      placeholder="100000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bonusPercent">Phần Trăm Thưởng (%)</Label>
                    <Input
                      id="bonusPercent"
                      type="number"
                      value={formData.bonusPercent}
                      onChange={(e) => setFormData({ ...formData, bonusPercent: parseFloat(e.target.value) || 0 })}
                      placeholder="5"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Ví dụ: 5 = thưởng 5%, 10 = thưởng 10%
                    </p>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2">Ví dụ:</p>
                    <p className="text-sm text-muted-foreground">
                      Nạp {formatVND(formData.minAmount)} - {formatVND(formData.maxAmount)}
                      → Thưởng {formData.bonusPercent}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Nạp {formatVND((formData.minAmount + formData.maxAmount) / 2)}
                      → Nhận {formatVND(Math.floor(((formData.minAmount + formData.maxAmount) / 2) * (1 + formData.bonusPercent / 100)))}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleAddTier}>
                      {editingIndex !== null ? 'Cập Nhật' : 'Thêm Tier'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Cấu Hình Tiers</CardTitle>
              <CardDescription>
                {tiers.length === 0 ? 'Chưa có tier nào' : `${tiers.length} tier đã cấu hình`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Đang tải...</div>
              ) : tiers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chưa có tier nào. Nhấn &quot;Thêm Tier&quot; để bắt đầu.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Khoảng Tiền</TableHead>
                      <TableHead>Thưởng</TableHead>
                      <TableHead className="text-right">Thao Tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tiers.map((tier, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="text-sm">
                            {formatVND(tier.minAmount)}
                            <br />
                            <span className="text-muted-foreground">đến</span>
                            <br />
                            {formatVND(tier.maxAmount)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-green-500">
                            <TrendingUp className="mr-1 h-3 w-3" />
                            +{tier.bonusPercent}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(index)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(index)}
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

          <Card>
            <CardHeader>
              <CardTitle>Tính Thử Thưởng</CardTitle>
              <CardDescription>
                Nhập số tiền để xem thưởng nhận được
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="demoAmount">Số Tiền Nạp (VND)</Label>
                <Input
                  id="demoAmount"
                  type="number"
                  value={demoAmount}
                  onChange={(e) => setDemoAmount(parseInt(e.target.value) || 0)}
                  placeholder="100000"
                />
              </div>

              <div className="bg-muted p-6 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Số tiền nạp:</span>
                  <span className="font-medium">{formatVND(demoAmount)}</span>
                </div>

                {demoBonus.percent > 0 && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Thưởng ({demoBonus.percent}%):</span>
                      <span className="font-medium text-green-500">
                        +{formatVND(demoBonus.amount)}
                      </span>
                    </div>
                    <div className="border-t pt-3 flex justify-between items-center">
                      <span className="font-semibold">Tổng nhận được:</span>
                      <span className="font-bold text-lg text-primary">
                        {formatVND(demoBonus.total)}
                      </span>
                    </div>
                  </>
                )}

                {demoBonus.percent === 0 && (
                  <div className="text-center text-muted-foreground">
                    Không có thưởng cho khoảng tiền này
                  </div>
                )}
              </div>

              {tiers.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">💡 Gợi ý:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {tiers.map((tier, index) => (
                      <li key={index}>
                        • Nạp {formatVND(tier.minAmount)} - {formatVND(tier.maxAmount)} → Thưởng +{tier.bonusPercent}%
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Hướng Dẫn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• <strong>Tier</strong> là mức thưởng theo khoảng số tiền nạp</p>
            <p>• Các tier không được chồng lấn (overlap) nhau</p>
            <p>• Hệ thống tự động tính và cộng thưởng khi auto-topup</p>
            <p>• User sẽ thấy % thưởng trên trang nạp tiền</p>
            <p>• Ví dụ: Nạp 100k với thưởng 10% → Nhận 110k vào ví</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
