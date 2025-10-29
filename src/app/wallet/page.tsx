'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Wallet, Plus, QrCode, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface WalletData {
  balance: number;
  currency: string;
}

interface HistoryItem {
  type: 'deposit' | 'order';
  id: string | number;
  amount: number;
  status: string;
  note?: string;
  adminNote?: string;
  createdAt: string;
  decidedAt?: string;
}

interface TopupConfirmData {
  amount: number;
  note: string;
  qrCode: string;
  transferContent: string;
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
}

interface TopupRules {
  minVnd: number;
  maxVnd: number;
}

interface BonusTier {
  minAmount: number;
  maxAmount: number;
  bonusPercent: number;
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupNote, setTopupNote] = useState('');
  const [confirmData, setConfirmData] = useState<TopupConfirmData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [topupRules, setTopupRules] = useState<TopupRules>({ minVnd: 1000, maxVnd: 100000000 });
  const [bonusTiers, setBonusTiers] = useState<BonusTier[]>([]);
  const [estimatedBonus, setEstimatedBonus] = useState({ percent: 0, amount: 0, total: 0 });
  const { toast } = useToast();

  // Fetch wallet data
  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const [walletRes, historyRes, settingsRes, bonusRes] = await Promise.all([
          fetch('/api/wallet/balance'),
          fetch('/api/wallet/history'),
          fetch('/api/settings'),
          fetch('/api/deposit-bonus-tiers'),
        ]);

        if (walletRes.ok) {
          const walletData = await walletRes.json();
          setWallet(walletData);
        }

        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setHistory(historyData.history || []);
        }

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          console.log('[Wallet] Settings data:', settingsData);
          if (settingsData.settings?.topupRules) {
            const rules = typeof settingsData.settings.topupRules === 'string'
              ? JSON.parse(settingsData.settings.topupRules)
              : settingsData.settings.topupRules;
            console.log('[Wallet] Parsed topupRules:', rules);
            setTopupRules(rules);
          } else {
            console.log('[Wallet] No topupRules in settings');
          }
        }

        if (bonusRes.ok) {
          const bonusData = await bonusRes.json();
          setBonusTiers(bonusData.tiers || []);
        }
      } catch (error) {
        console.error('Error fetching wallet data:', error);
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: 'Không thể tải dữ liệu ví. Vui lòng thử lại.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalletData();
  }, [toast]);

  // Calculate bonus when topup amount changes
  useEffect(() => {
    const amount = parseFloat(topupAmount) || 0;
    if (amount <= 0 || bonusTiers.length === 0) {
      setEstimatedBonus({ percent: 0, amount: 0, total: amount });
      return;
    }

    const matchingTier = bonusTiers.find(
      (tier) => amount >= tier.minAmount && amount <= tier.maxAmount
    );

    if (matchingTier) {
      const bonusAmount = Math.floor((amount * matchingTier.bonusPercent) / 100);
      setEstimatedBonus({
        percent: matchingTier.bonusPercent,
        amount: bonusAmount,
        total: amount + bonusAmount,
      });
    } else {
      setEstimatedBonus({ percent: 0, amount: 0, total: amount });
    }
  }, [topupAmount, bonusTiers]);

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(topupAmount);
    const minAmount = topupRules?.minVnd || 10000;
    const maxAmount = topupRules?.maxVnd || 100000000;
    
    // Validate amount against rules
    if (amount < minAmount) {
      toast({
        variant: 'destructive',
        title: 'Số tiền không hợp lệ',
        description: `Số tiền tối thiểu là ${minAmount.toLocaleString('vi-VN')} VND`,
      });
      return;
    }
    
    if (amount > maxAmount) {
      toast({
        variant: 'destructive',
        title: 'Số tiền không hợp lệ',
        description: `Số tiền tối đa là ${maxAmount.toLocaleString('vi-VN')} VND`,
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Get bank info and generate QR/transfer content
      const response = await fetch('/api/wallet/topup/prepare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amountVnd: amount,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Show confirmation dialog with QR code
        setConfirmData({
          amount: parseFloat(topupAmount),
          note: topupNote,
          qrCode: data.qrCode,
          transferContent: data.transferContent,
          bankInfo: data.bankInfo,
        });
        setIsTopupOpen(false);
        setIsConfirmOpen(true);
      } else {
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: data.error || 'Không thể tạo thông tin chuyển khoản.',
        });
      }
    } catch (error) {
      console.error('Error preparing topup:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Đã xảy ra lỗi. Vui lòng thử lại.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmTopup = async () => {
    if (!confirmData) return;
    
    setIsCreating(true);

    try {
      const response = await fetch('/api/wallet/topup/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amountVnd: confirmData.amount,
          note: confirmData.note,
          qrCode: confirmData.qrCode,
          transferContent: confirmData.transferContent,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Tạo yêu cầu thành công',
          description: 'Vui lòng chuyển khoản theo thông tin và chờ admin duyệt.',
        });
        setIsConfirmOpen(false);
        setConfirmData(null);
        setTopupAmount('');
        setTopupNote('');
        // Refresh history
        const historyRes = await fetch('/api/wallet/history');
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setHistory(historyData.history || []);
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: data.error || 'Không thể tạo yêu cầu nạp.',
        });
      }
    } catch (error) {
      console.error('Error creating topup request:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Đã xảy ra lỗi. Vui lòng thử lại.',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancelTopup = () => {
    setIsConfirmOpen(false);
    setConfirmData(null);
    setTopupAmount('');
    setTopupNote('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Đã duyệt</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Bị từ chối</Badge>;
      case 'PENDING':
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />Chờ duyệt</Badge>;
      case 'PAID':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Đã thanh toán</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-card rounded w-1/4"></div>
            <div className="h-32 bg-card rounded"></div>
            <div className="h-64 bg-card rounded"></div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Wallet Balance & Topup Rules */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wallet className="h-6 w-6" />
                  <span>Ví của bạn</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-brand">
                      {wallet ? formatCurrency(wallet.balance) : '0 VND'}
                    </p>
                    <p className="text-text-muted">Số dư hiện tại</p>
                  </div>
                  <Dialog open={isTopupOpen} onOpenChange={setIsTopupOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center space-x-2">
                        <Plus className="h-4 w-4" />
                        <span>Nạp tiền</span>
                      </Button>
                    </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tạo yêu cầu nạp tiền</DialogTitle>
                      <DialogDescription>
                        Nhập số tiền và ghi chú để tạo yêu cầu nạp tiền
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleTopup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Số tiền (VND)</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder={(topupRules?.minVnd || 10000).toLocaleString('vi-VN')}
                          value={topupAmount}
                          onChange={(e) => setTopupAmount(e.target.value)}
                          required
                          min={topupRules?.minVnd || 10000}
                          max={topupRules?.maxVnd || 100000000}
                          step="1000"
                        />
                        <p className="text-xs text-text-muted">
                          Tối thiểu: {(topupRules?.minVnd || 10000).toLocaleString('vi-VN')} VND
                          {' • '}
                          Tối đa: {(topupRules?.maxVnd || 100000000).toLocaleString('vi-VN')} VND
                        </p>

                        {/* Bonus Display */}
                        {estimatedBonus.percent > 0 && (
                          <div className="mt-3 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 mt-0.5">
                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                                  🎁 Thưởng {estimatedBonus.percent}%
                                </p>
                                <div className="mt-2 text-sm space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-green-600 dark:text-green-400">Số tiền nạp:</span>
                                    <span className="font-medium">{parseFloat(topupAmount || '0').toLocaleString('vi-VN')} ₫</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-green-600 dark:text-green-400">Tiền thưởng:</span>
                                    <span className="font-medium text-green-600">+{estimatedBonus.amount.toLocaleString('vi-VN')} ₫</span>
                                  </div>
                                  <div className="flex justify-between pt-2 border-t border-green-200 dark:border-green-800">
                                    <span className="font-semibold text-green-700 dark:text-green-300">Tổng nhận được:</span>
                                    <span className="font-bold text-lg text-green-600">{estimatedBonus.total.toLocaleString('vi-VN')} ₫</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Bonus Tiers Info */}
                        {bonusTiers.length > 0 && !estimatedBonus.percent && (
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                              💡 Thưởng nạp tiền:
                            </p>
                            <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                              {bonusTiers.map((tier, idx) => (
                                <li key={idx}>
                                  • Nạp {tier.minAmount.toLocaleString('vi-VN')} - {tier.maxAmount.toLocaleString('vi-VN')} ₫ → Thưởng +{tier.bonusPercent}%
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="note">Ghi chú (tùy chọn)</Label>
                        <Textarea
                          id="note"
                          placeholder="Ghi chú cho admin..."
                          value={topupNote}
                          onChange={(e) => setTopupNote(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsTopupOpen(false)}
                        >
                          Hủy
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? 'Đang xử lý...' : 'Tiếp tục'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Confirmation Dialog with QR Code */}
                <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Chi tiết yêu cầu nạp</DialogTitle>
                      <DialogDescription>
                        Thông tin chi tiết yêu cầu nạp tiền
                      </DialogDescription>
                    </DialogHeader>
                    {confirmData && (
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-sm text-text-muted mb-2">ID yêu cầu</p>
                          <p className="text-lg font-mono font-bold">
                            Sẽ được tạo sau khi xác nhận
                          </p>
                        </div>

                        <div className="text-center">
                          <p className="text-sm text-text-muted mb-2">Khách hàng</p>
                          <p className="font-medium">{wallet?.currency || 'User'}</p>
                        </div>

                        <div className="text-center border-t border-b border-border py-4">
                          <p className="text-sm text-text-muted mb-2">Số tiền</p>
                          <p className="text-3xl font-bold text-brand">
                            {formatCurrency(confirmData.amount)}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-text-muted">Trạng thái</p>
                          <Badge variant="warning">
                            <Clock className="w-3 h-3 mr-1" />
                            Chờ duyệt
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-text-muted">Nội dung chuyển khoản</p>
                          <div className="bg-card p-3 rounded border border-border">
                            <p className="font-mono text-sm break-all">
                              {confirmData.transferContent}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-text-muted text-center">QR Code</p>
                          <div className="flex justify-center bg-white p-4 rounded">
                            {confirmData.qrCode ? (
                              <img 
                                src={confirmData.qrCode} 
                                alt="QR Code" 
                                className="w-64 h-64"
                              />
                            ) : (
                              <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded">
                                <p className="text-gray-500">QR Code không khả dụng</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <p className="font-medium">Thông tin ngân hàng:</p>
                          <div className="bg-card p-3 rounded border border-border space-y-1">
                            <p><span className="text-text-muted">Ngân hàng:</span> {confirmData.bankInfo.bankName}</p>
                            <p><span className="text-text-muted">Số tài khoản:</span> {confirmData.bankInfo.accountNumber}</p>
                            <p><span className="text-text-muted">Chủ tài khoản:</span> {confirmData.bankInfo.accountHolder}</p>
                          </div>
                        </div>

                        {confirmData.note && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-text-muted">Ghi chú</p>
                            <p className="text-sm">{confirmData.note}</p>
                          </div>
                        )}

                        <div className="flex justify-end space-x-2 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancelTopup}
                            disabled={isCreating}
                          >
                            Hủy
                          </Button>
                          <Button 
                            onClick={handleConfirmTopup}
                            disabled={isCreating}
                          >
                            {isCreating ? 'Đang tạo...' : 'Hoàn tất'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Topup Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quy tắc nạp tiền</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-muted">Số tiền tối thiểu:</span>
                <span className="font-semibold text-brand">
                  {(topupRules?.minVnd || 10000).toLocaleString('vi-VN')} ₫
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-muted">Số tiền tối đa:</span>
                <span className="font-semibold text-brand">
                  {(topupRules?.maxVnd || 100000000).toLocaleString('vi-VN')} ₫
                </span>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-text-muted">
                  Vui lòng nhập số tiền trong khoảng cho phép để tạo yêu cầu nạp tiền
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử giao dịch</CardTitle>
              <CardDescription>
                Tất cả các giao dịch nạp tiền và mua hàng
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có giao dịch nào</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loại</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ghi chú</TableHead>
                      <TableHead>Ngày</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {item.type === 'deposit' ? (
                              <Plus className="h-4 w-4 text-success" />
                            ) : (
                              <Wallet className="h-4 w-4 text-brand" />
                            )}
                            <span>
                              {item.type === 'deposit' ? 'Nạp tiền' : 'Mua hàng'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={item.amount > 0 ? 'text-success' : 'text-danger'}>
                            {item.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(item.amount))}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(item.status)}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="truncate">{item.note || '-'}</p>
                            {item.adminNote && (
                              <p className="text-xs text-text-muted truncate">
                                Admin: {item.adminNote}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{formatDate(item.createdAt)}</p>
                            {item.decidedAt && (
                              <p className="text-text-muted">
                                Duyệt: {formatDate(item.decidedAt)}
                              </p>
                            )}
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
      </div>
    </AppShell>
  );
}



