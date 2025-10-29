'use client';

import { useEffect, useState } from 'react';

interface Advertisement {
  id: string;
  name: string;
  type: 'GOOGLE_ADSENSE' | 'HTML_EMBED' | 'IMAGE_BANNER' | 'VIDEO';
  placement: string;
  content: string;
  imageUrl?: string | null;
  clickUrl?: string | null;
  order: number;
}

interface AdDisplayProps {
  placement: 'SIDEBAR_LEFT' | 'SIDEBAR_RIGHT' | 'BETWEEN_PRODUCTS' | 'HEADER' | 'FOOTER';
  className?: string;
}

export function AdDisplay({ placement, className = '' }: AdDisplayProps) {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [trackedImpressions, setTrackedImpressions] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placement]);

  const fetchAds = async () => {
    try {
      const res = await fetch(`/api/advertisements?placement=${placement}`);
      if (res.ok) {
        const data = await res.json();
        setAds(data.ads || []);
      }
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const trackImpression = async (adId: string) => {
    try {
      await fetch(`/api/admin/advertisements/${adId}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'impression' }),
      });
    } catch (error) {
      console.error('Error tracking impression:', error);
    }
  };

  const trackClick = async (adId: string) => {
    try {
      await fetch(`/api/admin/advertisements/${adId}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'click' }),
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };

  // Track impressions for all ads
  useEffect(() => {
    ads.forEach((ad) => {
      if (!trackedImpressions.has(ad.id)) {
        trackImpression(ad.id);
        setTrackedImpressions((prev) => new Set(prev).add(ad.id));
      }
    });
  }, [ads, trackedImpressions]);

  const renderAd = (ad: Advertisement) => {
    switch (ad.type) {
      case 'IMAGE_BANNER':
        return (
          <a
            href={ad.clickUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick(ad.id)}
            className="block hover:opacity-80 transition-opacity"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ad.imageUrl || ''}
              alt={ad.name}
              className="w-full h-auto rounded-lg"
            />
          </a>
        );

      case 'GOOGLE_ADSENSE':
      case 'HTML_EMBED':
      case 'VIDEO':
        return (
          <div
            dangerouslySetInnerHTML={{ __html: ad.content }}
            className="w-full"
          />
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return null; // Don't show loading state for ads
  }

  if (ads.length === 0) {
    return null; // No ads to display
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {ads.map((ad) => (
        <div key={ad.id} className="ad-container">
          {renderAd(ad)}
        </div>
      ))}
    </div>
  );
}
