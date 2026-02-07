'use client';

import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationBarProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

export function PaginationBar({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
}: PaginationBarProps) {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage > 3) {
                pages.push('...');
            }

            // Show pages around current
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) {
                    pages.push(i);
                }
            }

            if (currentPage < totalPages - 2) {
                pages.push('...');
            }

            // Always show last page
            if (!pages.includes(totalPages)) {
                pages.push(totalPages);
            }
        }

        return pages;
    };

    if (totalPages <= 1) return null;

    return (
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Info text */}
            <div className="text-sm text-text-muted">
                Hiển thị <span className="font-semibold text-text-primary">{endItem - startItem + 1}</span> trong số{' '}
                <span className="font-semibold text-text-primary">{totalItems}</span> Sản phẩm
            </div>

            {/* Pagination */}
            <div className="flex items-center gap-1">
                {/* Previous */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                        currentPage === 1
                            ? "text-text-muted cursor-not-allowed"
                            : "text-text-primary hover:bg-secondary"
                    )}
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page numbers */}
                {getPageNumbers().map((page, index) => (
                    <button
                        key={index}
                        onClick={() => typeof page === 'number' && onPageChange(page)}
                        disabled={page === '...'}
                        className={cn(
                            "min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium transition-colors",
                            page === currentPage
                                ? "bg-brand text-white"
                                : page === '...'
                                    ? "cursor-default text-text-muted"
                                    : "text-text-primary hover:bg-secondary"
                        )}
                    >
                        {page}
                    </button>
                ))}

                {/* Next */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                        currentPage === totalPages
                            ? "text-text-muted cursor-not-allowed"
                            : "text-text-primary hover:bg-secondary"
                    )}
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
