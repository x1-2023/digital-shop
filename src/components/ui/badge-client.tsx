'use client';

import { Badge as BaseBadge } from '@/components/ui/badge';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export function Badge({ children, className, variant }: BadgeProps) {
  return (
    <BaseBadge className={className} variant={variant}>
      {children}
    </BaseBadge>
  );
}
