'use client';

import { useState, useEffect } from 'react';
// import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Star, Eye, EyeOff, Trash2, FileText, Zap } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  isAnonymous: boolean;
  status: 'PUBLISHED' | 'HIDDEN' | 'DELETED';
  adminNote: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
  };
  product: {
    id: string;
    name: string;
    slug: string;
  };
  order: {
    id: string;
    createdAt: string;
  };
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [newStatus, setNewStatus] = useState<'PUBLISHED' | 'HIDDEN' | 'DELETED'>('PUBLISHED');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, [filterStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      const response = await fetch(`/api/admin/reviews?${params}`);
      const data = await response.json();

      if (response.ok) {
        setReviews(data.reviews);
      } else {
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: data.error || 'Không thể tải danh sách đánh giá',
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể kết nối server',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openDialog = (review: Review) => {
    setSelectedReview(review);
    setAdminNote(review.adminNote || '');
    setNewStatus(review.status);
    setIsDialogOpen(true);
  };

  const handleUpdateReview = async () => {
    if (!selectedReview) return;

    try {
      const response = await fetch(`/api/admin/reviews/${selectedReview.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          adminNote: adminNote,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Thành công',
          description: 'Đã cập nhật đánh giá',
        });
        setIsDialogOpen(false);
        fetchReviews();
      } else {
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: data.error || 'Không thể cập nhật đánh giá',
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể kết nối server',
      });
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Bạn có chắc muốn xóa vĩnh viễn đánh giá này?')) return;

    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Thành công',
          description: 'Đã xóa đánh giá',
        });
        fetchReviews();
      } else {
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: data.error || 'Không thể xóa đánh giá',
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể kết nối server',
      });
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              }`}
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      PUBLISHED: { variant: 'default', label: 'Công khai' },
      HIDDEN: { variant: 'secondary', label: 'Đã ẩn' },
      DELETED: { variant: 'destructive', label: 'Đã xóa' },
    };

    const config = variants[status] || variants.PUBLISHED;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleAutoReview = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/cron/auto-review');
      const data = await res.json();
      if (res.ok) {
        toast({
          title: 'Thành công',
          description: `Đã xử lý ${data.details.processed} đơn hàng, tạo ${data.details.reviewsCreated} đánh giá.`,
        });
        fetchReviews(); // Refresh list
      } else {
        throw new Error(data.error);
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể chạy auto-review',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(reviews.length / ITEMS_PER_PAGE);
  const paginatedReviews = reviews.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="flex-1 p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quản lý đánh giá</h1>
            <p className="text-text-muted">Xem và quản lý tất cả đánh giá sản phẩm</p>
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={handleAutoReview} disabled={isLoading} variant="outline">
              <Zap className="mr-2 h-4 w-4" />
              Chạy Auto-Review
            </Button>

            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="PUBLISHED">Công khai</SelectItem>
                <SelectItem value="HIDDEN">Đã ẩn</SelectItem>
                <SelectItem value="DELETED">Đã xóa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách đánh giá ({reviews.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Đang tải...</div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                Không có đánh giá nào
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Đánh giá</TableHead>
                    <TableHead>Nội dung</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedReviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>
                        <div className="font-medium">{review.product.name}</div>
                        <div className="text-sm text-text-muted">
                          {review.product.slug}
                        </div>
                      </TableCell>
                      <TableCell>
                        {review.isAnonymous ? (
                          <span className="text-text-muted italic">Ẩn danh</span>
                        ) : (
                          review.user.email
                        )}
                      </TableCell>
                      <TableCell>{renderStars(review.rating)}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {review.comment || <span className="text-text-muted italic">Không có</span>}
                      </TableCell>
                      <TableCell>{getStatusBadge(review.status)}</TableCell>
                      <TableCell>{formatDate(review.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDialog(review)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          {review.status !== 'HIDDEN' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedReview(review);
                                setNewStatus('HIDDEN');
                                handleUpdateReview();
                              }}
                            >
                              <EyeOff className="h-4 w-4" />
                            </Button>
                          )}
                          {review.status === 'HIDDEN' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedReview(review);
                                setNewStatus('PUBLISHED');
                                handleUpdateReview();
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteReview(review.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                Trước
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce((acc: (number | string)[], p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === '...' ? (
                    <span key={`e-${idx}`} className="px-2 text-muted-foreground">...</span>
                  ) : (
                    <Button
                      key={p}
                      variant={currentPage === p ? 'default' : 'outline'}
                      onClick={() => setCurrentPage(p as number)}
                    >
                      {p}
                    </Button>
                  )
                )}
              <Button
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Sau
              </Button>
            </div>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Chi tiết đánh giá</DialogTitle>
            </DialogHeader>

            {selectedReview && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Sản phẩm</label>
                  <p>{selectedReview.product.name}</p>
                </div>

                <div>
                  <label className="text-sm font-medium">Người dùng</label>
                  <p>{selectedReview.isAnonymous ? 'Ẩn danh' : selectedReview.user.email}</p>
                </div>

                <div>
                  <label className="text-sm font-medium">Đánh giá</label>
                  <div className="mt-1">{renderStars(selectedReview.rating)}</div>
                </div>

                <div>
                  <label className="text-sm font-medium">Nội dung</label>
                  <p className="mt-1 p-3 bg-muted rounded">
                    {selectedReview.comment || <span className="text-text-muted italic">Không có</span>}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Trạng thái</label>
                  <Select value={newStatus} onValueChange={(value: 'PUBLISHED' | 'HIDDEN' | 'DELETED') => setNewStatus(value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLISHED">Công khai</SelectItem>
                      <SelectItem value="HIDDEN">Ẩn</SelectItem>
                      <SelectItem value="DELETED">Xóa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Ghi chú admin</label>
                  <Textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Thêm ghi chú nội bộ..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleUpdateReview}>
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

