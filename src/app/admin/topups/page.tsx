'use client';

import { useState, useEffect } from 'react';
// import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// Input removed as unused
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Eye
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';


interface DepositRequest {
  id: string;
  amountVnd: number;
  note?: string;
  qrCode?: string;
  transferContent?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote?: string;
  createdAt: string;
  decidedAt?: string;
  user: {
    id: string;
    email: string;
  };
}

export default function AdminTopupsPage() {
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchDeposits();
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDeposits = async () => {
    try {
      const url = statusFilter === 'all'
        ? '/api/admin/deposits'
        : `/api/admin/deposits?status=${statusFilter}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setDeposits(data.deposits || []);
      }
    } catch (error) {
      console.error('Error fetching deposits:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tải danh sách yêu cầu nạp.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (depositId: string, action: 'approve' | 'reject') => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/deposits/${depositId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminNote: adminNote || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          variant: 'success',
          title: action === 'approve' ? 'Duyệt thành công' : 'Từ chối thành công',
          description: data.message || 'Yêu cầu nạp đã được xử lý.',
        });
        setIsActionOpen(false);
        setAdminNote('');
        fetchDeposits();
      } else {
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: data.error || 'Không thể xử lý yêu cầu nạp.',
        });
      }
    } catch (error) {
      console.error('Error processing deposit:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Đã xảy ra lỗi. Vui lòng thử lại.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openActionDialog = (deposit: DepositRequest, action: 'approve' | 'reject') => {
    setSelectedDeposit(deposit);
    setActionType(action);
    setAdminNote('');
    setIsActionOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Đã duyệt</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Bị từ chối</Badge>;
      case 'PENDING':
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />Chờ duyệt</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-card rounded w-1/4"></div>
          <div className="h-64 bg-card rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Yêu cầu nạp tiền</h1>
          <p className="text-text-muted">Quản lý các yêu cầu nạp tiền từ người dùng</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="PENDING">Chờ duyệt</SelectItem>
              <SelectItem value="APPROVED">Đã duyệt</SelectItem>
              <SelectItem value="REJECTED">Bị từ chối</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách yêu cầu nạp</CardTitle>
          <CardDescription>
            Tổng cộng {deposits.length} yêu cầu nạp
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deposits.length === 0 ? (
            <div className="text-center py-8 text-text-muted">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Không có yêu cầu nạp nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deposits.map((deposit) => (
                  <TableRow key={deposit.id}>
                    <TableCell className="font-mono text-xs">
                      #{deposit.id}
                    </TableCell>
                    <TableCell>{deposit.user?.email || 'N/A'}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(deposit.amountVnd)}
                    </TableCell>
                    <TableCell>{getStatusBadge(deposit.status)}</TableCell>
                    <TableCell>{formatDate(deposit.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDeposit(deposit);
                            setIsDetailOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Xem
                        </Button>
                        {deposit.status === 'PENDING' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openActionDialog(deposit, 'approve')}
                              className="text-success hover:text-success"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Duyệt
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openActionDialog(deposit, 'reject')}
                              className="text-danger hover:text-danger"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Từ chối
                            </Button>
                          </>
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

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu nạp</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết yêu cầu nạp tiền
            </DialogDescription>
          </DialogHeader>
          {selectedDeposit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID yêu cầu</Label>
                  <p className="font-mono text-sm">{selectedDeposit.id}</p>
                </div>
                <div>
                  <Label>Khách hàng</Label>
                  <p className="text-sm">{selectedDeposit.user?.email || 'N/A'}</p>
                </div>
                <div>
                  <Label>Số tiền</Label>
                  <p className="text-lg font-semibold text-brand">
                    {formatCurrency(selectedDeposit.amountVnd)}
                  </p>
                </div>
                <div>
                  <Label>Trạng thái</Label>
                  <div>{getStatusBadge(selectedDeposit.status)}</div>
                </div>
              </div>

              {selectedDeposit.note && (
                <div>
                  <Label>Ghi chú từ khách hàng</Label>
                  <p className="text-sm bg-card p-3 rounded-lg">{selectedDeposit.note}</p>
                </div>
              )}

              {selectedDeposit.transferContent && (
                <div>
                  <Label>Nội dung chuyển khoản</Label>
                  <p className="text-sm bg-card p-3 rounded-lg font-mono">
                    {selectedDeposit.transferContent}
                  </p>
                </div>
              )}

              {selectedDeposit.adminNote && (
                <div>
                  <Label>Ghi chú từ admin</Label>
                  <p className="text-sm bg-card p-3 rounded-lg">{selectedDeposit.adminNote}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm text-text-muted">
                <div>
                  <Label>Ngày tạo</Label>
                  <p>{formatDate(selectedDeposit.createdAt)}</p>
                </div>
                {selectedDeposit.decidedAt && (
                  <div>
                    <Label>Ngày quyết định</Label>
                    <p>{formatDate(selectedDeposit.decidedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={isActionOpen} onOpenChange={setIsActionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Duyệt yêu cầu nạp' : 'Từ chối yêu cầu nạp'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? 'Xác nhận duyệt yêu cầu nạp tiền này?'
                : 'Xác nhận từ chối yêu cầu nạp tiền này?'
              }
            </DialogDescription>
          </DialogHeader>
          {selectedDeposit && (
            <div className="space-y-4">
              <div className="bg-card p-4 rounded-lg">
                <p className="text-sm text-text-muted">Khách hàng: {selectedDeposit.user.email}</p>
                <p className="text-sm text-text-muted">Số tiền: {formatCurrency(selectedDeposit.amountVnd)}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminNote">
                  Ghi chú {actionType === 'approve' ? '(tùy chọn)' : '(bắt buộc)'}
                </Label>
                <Textarea
                  id="adminNote"
                  placeholder={actionType === 'approve'
                    ? 'Ghi chú cho khách hàng...'
                    : 'Lý do từ chối...'
                  }
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                  required={actionType === 'reject'}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsActionOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  variant={actionType === 'approve' ? 'default' : 'destructive'}
                  onClick={() => selectedDeposit && handleAction(selectedDeposit.id, actionType!)}
                  disabled={isSubmitting || (actionType === 'reject' && !adminNote.trim())}
                >
                  {isSubmitting
                    ? 'Đang xử lý...'
                    : actionType === 'approve'
                      ? 'Duyệt'
                      : 'Từ chối'
                  }
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}



