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

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-brand/10 text-brand">
                {review.avatar}
              </AvatarFallback>
            </Avatar>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-text-primary">{review.displayName}</p>
                  <p className="text-xs text-text-muted">
                    {formatDate(review.createdAt)}
                  </p>
                </div>
              </div>

              {/* Stars */}
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>

              {/* Comment */}
              {review.comment && (
                <p className="text-sm text-text-secondary whitespace-pre-line">
                  {review.comment}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Trang trước
          </Button>
          <span className="px-4 py-2 text-sm">
            Trang {page} / {totalPages}
          </span>
          <Button
            variant="outline"
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
