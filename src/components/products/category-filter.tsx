'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';

interface Category {
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
}

interface CategoryFilterProps {
    categories: Category[];
    selectedCategory: string;
    onCategoryChange: (categoryId: string) => void;
}

export function CategoryFilter({ categories, selectedCategory, onCategoryChange }: CategoryFilterProps) {
    return (
        <div className="bg-secondary/30 rounded-2xl p-4">
            <div className="flex flex-wrap gap-2 sm:gap-3">
                {/* All Categories */}
                <button
                    onClick={() => onCategoryChange('all')}
                    className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl bg-card border transition-all hover:-translate-y-0.5",
                        selectedCategory === 'all'
                            ? "border-brand shadow-md shadow-brand/20"
                            : "border-border hover:border-brand/50"
                    )}
                >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand/20 to-brand/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">🏠</span>
                    </div>
                    <span className="text-sm font-medium whitespace-nowrap">Tất cả</span>
                </button>

                {categories.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => onCategoryChange(category.id)}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl bg-card border transition-all hover:-translate-y-0.5",
                            selectedCategory === category.id
                                ? "border-brand shadow-md shadow-brand/20"
                                : "border-border hover:border-brand/50"
                        )}
                    >
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {category.icon ? (
                                (category.icon.startsWith('/') || category.icon.startsWith('http')) ? (
                                    <Image
                                        src={category.icon}
                                        alt={category.name}
                                        width={28}
                                        height={28}
                                        className="w-7 h-7 object-contain"
                                        unoptimized
                                    />
                                ) : (
                                    <span className="text-xl">{category.icon}</span>
                                )
                            ) : (
                                <span className="text-xl">📦</span>
                            )}
                        </div>
                        <span className="text-sm font-medium whitespace-nowrap">{category.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
