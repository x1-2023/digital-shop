'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Package, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CategoryFilter } from '@/components/products/category-filter';
import { SortBar } from '@/components/products/sort-bar';
import { PaginationBar } from '@/components/products/pagination-bar';
import { ProductCard } from '@/components/products/product-card';

interface Product {
    id: string;
    categoryId: string;
    name: string;
    slug: string;
    priceVnd: number;
    stock: number;
    images?: string;
    description?: string;
    category?: {
        id: string;
        name: string;
        slug: string;
        icon?: string | null;
    };
}

interface Category {
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
}

const ITEMS_PER_PAGE = 20;

export function HomeProductsSection() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [search, sortBy, selectedCategory, currentPage]);

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories');
            if (response.ok) {
                const data = await response.json();
                setCategories(data.categories || []);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (sortBy) params.append('sort', sortBy);
            if (selectedCategory && selectedCategory !== 'all') {
                params.append('categoryId', selectedCategory);
            }
            params.append('page', currentPage.toString());
            params.append('limit', ITEMS_PER_PAGE.toString());

            const response = await fetch(`/api/products?${params}`);
            if (response.ok) {
                const data = await response.json();
                setProducts(data.products || []);
                setTotalProducts(data.pagination?.total || data.products?.length || 0);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCategoryChange = (categoryId: string) => {
        setSelectedCategory(categoryId);
        setCurrentPage(1);
    };

    const handleSortChange = (sort: string) => {
        setSortBy(sort);
        setCurrentPage(1);
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setCurrentPage(1);
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted h-5 w-5" />
                <Input
                    placeholder="Tìm kiếm sản phẩm..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-12 h-12 rounded-full border-2 focus:border-brand bg-card"
                />
                {search && (
                    <button
                        onClick={() => handleSearchChange('')}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-primary"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* Category Filter */}
            <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
            />

            {/* Sort Bar */}
            <SortBar
                sortBy={sortBy}
                onSortChange={handleSortChange}
            />

            {/* Products Grid */}
            <section>
                <div className="flex justify-between items-center mb-4 bg-card p-4 rounded-xl border border-border shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🔥</span>
                        <h2 className="text-xl font-bold text-foreground">
                            {selectedCategory === 'all'
                                ? 'Tất Cả Sản Phẩm'
                                : categories.find(c => c.id === selectedCategory)?.name || 'Sản Phẩm'}
                        </h2>
                        <span className="text-sm text-muted-foreground">
                            ({totalProducts} sản phẩm)
                        </span>
                    </div>
                    <Link
                        href="/products"
                        className="hidden md:inline-flex items-center text-sm font-medium text-brand hover:text-brand-light transition-colors group"
                    >
                        Xem tất cả <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-64 bg-secondary rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product as any} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-card rounded-xl border border-dashed border-border">
                        <Package className="h-12 w-12 mx-auto mb-4 text-text-muted opacity-50" />
                        <p className="text-muted-foreground">Chưa có sản phẩm nào</p>
                    </div>
                )}

                <div className="mt-6 text-center md:hidden">
                    <Link
                        href="/products"
                        className="inline-flex items-center justify-center h-10 px-6 rounded-lg font-medium border border-border bg-card text-text-primary w-full"
                    >
                        Xem tất cả sản phẩm
                    </Link>
                </div>
            </section>

            {/* Pagination */}
            <PaginationBar
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalProducts}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
            />
        </div>
    );
}
