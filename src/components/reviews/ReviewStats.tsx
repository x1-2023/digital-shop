'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';

interface RatingDistribution {
  rating: number;
  count: number;
  percentage: number;
}

interface Stats {
  average: number;
  total: number;
  distribution: RatingDistribution[];
}

interface ReviewStatsProps {
  productSlug: string;
  refreshTrigger?: number;
}

export function ReviewStats({ productSlug, refreshTrigger }: ReviewStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/products/${productSlug}/reviews/stats`);
      const data = await response.json();

      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch review stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [productSlug, refreshTrigger]);

  if (isLoading) {
    return <div className="text-center py-4 text-text-muted">Đang tải...</div>;
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="text-center py-4 text-text-muted">
        Chưa có đánh giá
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Rating */}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-text-primary">
            {stats.average.toFixed(1)}
          </div>
          <div className="flex items-center justify-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= Math.round(stats.average)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-text-muted mt-1">
            {stats.total} đánh giá
          </p>
        </div>

        {/* Distribution Bars */}
        <div className="flex-1 space-y-2">
          {stats.distribution.map((item) => (
            <div key={item.rating} className="flex items-center gap-2">
              <span className="text-xs text-text-muted w-8">
                {item.rating} ⭐
              </span>
              <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <span className="text-xs text-text-muted w-12 text-right">
                {item.count} ({item.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
