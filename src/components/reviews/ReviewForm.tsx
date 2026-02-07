'use client';

import { useState, useEffect } from 'react';
import { Star, ShoppingBag, AlertCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface ReviewFormProps {
  productSlug: string;
  onSuccess?: () => void;
}

export function ReviewForm({ productSlug, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canReview, setCanReview] = useState<boolean | null>(null); // null = loading
  const [reviewStatus, setReviewStatus] = useState<'can_review' | 'not_purchased' | 'already_reviewed' | 'not_logged_in'>('not_purchased');
  const { toast } = useToast();

  useEffect(() => {
    checkReviewEligibility();
  }, [productSlug]);

  const checkReviewEligibility = async () => {
    try {
      // Check if user is logged in and has purchased the product
      const res = await fetch(`/api/products/${productSlug}/reviews/check`);
      const data = await res.json();

      if (res.status === 401) {
        setCanReview(false);
        setReviewStatus('not_logged_in');
      } else if (data.canReview) {
        setCanReview(true);
        setReviewStatus('can_review');
      } else if (data.reason === 'already_reviewed') {
        setCanReview(false);
        setReviewStatus('already_reviewed');
      } else {
        setCanReview(false);
        setReviewStatus('not_purchased');
      }
    } catch {
      setCanReview(false);
      setReviewStatus('not_logged_in');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast({
        variant: 'destructive',
        title: 'Vui lòng chọn số sao đánh giá',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/products/${productSlug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || undefined,
          isAnonymous,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Thành công',
          description: 'Đánh giá của bạn đã được gửi',
        });
        // Reset form
        setRating(0);
        setComment('');
        setIsAnonymous(false);
        setCanReview(false);
        setReviewStatus('already_reviewed');
        onSuccess?.();
      } else {
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: data.error || 'Không thể gửi đánh giá',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Có lỗi xảy ra, vui lòng thử lại',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (canReview === null) {
    return (
      <div className="text-center py-6 text-text-muted">
        <div className="animate-pulse">Đang kiểm tra...</div>
      </div>
    );
  }

  // Not logged in
  if (reviewStatus === 'not_logged_in') {
    return (
      <div className="text-center py-6 space-y-3">
        <Lock className="h-8 w-8 mx-auto text-text-muted opacity-50" />
        <p className="text-text-muted">Đăng nhập để đánh giá sản phẩm</p>
        <Link href="/login">
          <Button variant="outline" size="sm">
            Đăng nhập
          </Button>
        </Link>
      </div>
    );
  }

  // Already reviewed
  if (reviewStatus === 'already_reviewed') {
    return (
      <div className="text-center py-6 space-y-2">
        <Star className="h-8 w-8 mx-auto text-yellow-400 fill-yellow-400" />
        <p className="text-text-muted font-medium">Bạn đã đánh giá sản phẩm này rồi</p>
        <p className="text-xs text-text-muted">Cảm ơn bạn đã chia sẻ trải nghiệm!</p>
      </div>
    );
  }

  // Not purchased — show message instead of form
  if (reviewStatus === 'not_purchased') {
    return (
      <div className="text-center py-6 space-y-3">
        <ShoppingBag className="h-8 w-8 mx-auto text-text-muted opacity-50" />
        <p className="text-text-muted font-medium">Chỉ người mua mới có thể đánh giá</p>
        <p className="text-xs text-text-muted">Mua sản phẩm này để chia sẻ trải nghiệm của bạn</p>
      </div>
    );
  }

  // Can review — show form
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Star Rating */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          Đánh giá của bạn <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`h-8 w-8 ${star <= (hoveredRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                  }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="text-sm text-text-muted ml-2">
              ({rating} sao)
            </span>
          )}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          Nhận xét (không bắt buộc)
        </label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
          rows={4}
          maxLength={1000}
        />
        <p className="text-xs text-text-muted mt-1">
          {comment.length}/1000 ký tự
        </p>
      </div>

      {/* Anonymous Option */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="anonymous"
          checked={isAnonymous}
          onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
        />
        <label
          htmlFor="anonymous"
          className="text-sm cursor-pointer select-none"
        >
          Đánh giá ẩn danh (hiện &quot;Người dùng ẩn danh&quot;)
        </label>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting || rating === 0}
        className="w-full"
      >
        {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
      </Button>
    </form>
  );
}
