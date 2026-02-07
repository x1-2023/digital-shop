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
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3">
                {/* All Categories */}
                <button
                    onClick={() => onCategoryChange('all')}
                    className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl bg-card border transition-all hover:-translate-y-0.5",
                        selectedCategory === 'all'
                            ? "border-brand shadow-md shadow-brand/20"
                            : "border-border hover:border-brand/50"
                    )}
                >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand/20 to-brand/10 flex items-center justify-center">
                        <span className="text-xl">🏠</span>
                    </div>
                    <span className="text-xs font-medium text-center line-clamp-1">Tất cả</span>
                </button>

                {categories.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => onCategoryChange(category.id)}
                        className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-xl bg-card border transition-all hover:-translate-y-0.5",
                            selectedCategory === category.id
                                ? "border-brand shadow-md shadow-brand/20"
                                : "border-border hover:border-brand/50"
                        )}
                    >
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                            {category.icon ? (
                                <Image
                                    src={category.icon}
                                    alt={category.name}
                                    width={24}
                                    height={24}
                                    className="w-6 h-6 object-contain"
                                />
                            ) : (
                                <span className="text-xl">📦</span>
                            )}
                        </div>
                        <span className="text-xs font-medium text-center line-clamp-1">{category.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
