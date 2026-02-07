'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  displayName: string;
  avatar: string;
  createdAt: string;
}

interface ReviewListProps {
  productSlug: string;
  refreshTrigger?: number; // Trigger to refresh reviews
}

export function ReviewList({ productSlug, refreshTrigger }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/products/${productSlug}/reviews?page=${page}&limit=10`
      );
      const data = await response.json();

      if (response.ok) {
        setReviews(data.reviews);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page, productSlug, refreshTrigger]);

  if (isLoading) {
    return (
      <div className="text-center py-8 text-text-muted">
        Đang tải đánh giá...
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm này!
      </div>
    );
  }

  const formatDateFull = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0') + ' ' +
      String(d.getHours()).padStart(2, '0') + ':' +
      String(d.getMinutes()).padStart(2, '0') + ':' +
      String(d.getSeconds()).padStart(2, '0');
  };

  return (
    <div className="space-y-0">
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-border py-6 last:border-0 animate-in fade-in duration-300">
          <div className="flex items-start justify-between mb-2">
            {/* User Info */}
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-brand/10 text-brand font-bold">
                  {review.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm text-text-primary">{review.displayName}</p>
                {/* Stars - Moved under name as per design */}
                <div className="flex items-center gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3.5 w-3.5 ${star <= review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                        }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Date */}
            <p className="text-xs text-text-muted">
              {formatDateFull(review.createdAt)}
            </p>
          </div>

          {/* Comment */}
          {review.comment && (
            <div className="mt-3 pl-[52px]">
              <p className="text-sm text-text-primary/90 whitespace-pre-line leading-relaxed">
                {review.comment}
              </p>
            </div>
          )}
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8 pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Trang trước
          </Button>
          <span className="px-4 py-2 text-sm flex items-center">
            Trang {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Trang sau
          </Button>
        </div>
      )}
    </div>
  );
}
