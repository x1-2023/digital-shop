'use client';

import { cn } from '@/lib/utils';
import { Clock, Percent, TrendingUp, ArrowDownWideNarrow, ArrowUpWideNarrow } from 'lucide-react';

interface SortOption {
    value: string;
    label: string;
    shortLabel?: string;
    icon: React.ReactNode;
}

const SORT_OPTIONS: SortOption[] = [
    { value: 'newest', label: 'Mới nhất', shortLabel: 'Mới', icon: <Clock className="w-4 h-4" /> },
    { value: 'discount', label: 'Giá ưu đãi', shortLabel: 'Sale', icon: <Percent className="w-4 h-4" /> },
    { value: 'bestseller', label: 'Bán chạy', shortLabel: 'Hot', icon: <TrendingUp className="w-4 h-4" /> },
];

const PRICE_SORT_OPTIONS: SortOption[] = [
    { value: 'price-low', label: 'Giá thấp', icon: <ArrowDownWideNarrow className="w-4 h-4" /> },
    { value: 'price-high', label: 'Giá cao', icon: <ArrowUpWideNarrow className="w-4 h-4" /> },
];

interface SortBarProps {
    sortBy: string;
    onSortChange: (sort: string) => void;
}

export function SortBar({ sortBy, onSortChange }: SortBarProps) {
    return (
        <div className="flex flex-wrap items-center gap-2 bg-card border border-border rounded-2xl p-3 sm:p-4">
            {/* Label */}
            <div className="bg-brand text-white text-xs sm:text-sm font-semibold px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shrink-0">
                SẮP XẾP:
            </div>

            {/* Main Sort Options */}
            {SORT_OPTIONS.map((option) => (
                <button
                    key={option.value}
                    onClick={() => onSortChange(option.value)}
                    className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-xs sm:text-sm font-medium transition-colors",
                        sortBy === option.value
                            ? "bg-brand/10 border-brand text-brand"
                            : "border-border text-text-muted hover:border-brand/50 hover:text-text-primary"
                    )}
                >
                    {option.icon}
                    <span className="hidden sm:inline">{option.label}</span>
                    <span className="sm:hidden">{option.shortLabel || option.label}</span>
                </button>
            ))}

            {/* Divider */}
            <div className="hidden sm:block w-px h-6 bg-border mx-1"></div>

            {/* Price Sort Options */}
            {PRICE_SORT_OPTIONS.map((option) => (
                <button
                    key={option.value}
                    onClick={() => onSortChange(option.value)}
                    className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg border text-xs sm:text-sm font-medium transition-colors",
                        sortBy === option.value
                            ? "bg-brand/10 border-brand text-brand"
                            : "border-border text-text-muted hover:border-brand/50 hover:text-text-primary"
                    )}
                >
                    {option.icon}
                    <span className="hidden sm:inline">{option.label}</span>
                </button>
            ))}
        </div>
    );
}
