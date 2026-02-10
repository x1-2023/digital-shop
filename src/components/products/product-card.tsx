'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Eye } from 'lucide-react';
import { formatCurrency, safeParseImages } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { QuickBuyModal } from './quick-buy-modal';

interface Product {
    id: string;
    name: string;
    description: string;
    priceVnd: number;
    images: any;
    category: {
        name: string;
    };
    slug: string;
    fileName?: string | null;
    stock: number;
    avgRating?: number;
    reviewCount?: number;
    soldCount?: number;
}

export function ProductCard({ product }: { product: Product }) {
    const images = safeParseImages(product.images as string);
    const [isQuickBuyOpen, setIsQuickBuyOpen] = useState(false);

    return (
        <>
            <div className="group relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:shadow-brand/5 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
                {/* Image Section */}
                <div className="relative w-full aspect-square bg-secondary/30 overflow-hidden">
                    {images[0] ? (
                        <Image
                            src={images[0]}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            unoptimized
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                            <span className="text-4xl opacity-50">📦</span>
                        </div>
                    )}

                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-[1px]">
                        <Link
                            href={`/products/${product.slug}`}
                            className="p-2.5 rounded-full bg-background text-foreground hover:bg-brand hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-300 shadow-lg"
                        >
                            <Eye className="w-5 h-5" />
                        </Link>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        <Badge variant="secondary" className="backdrop-blur-md bg-black/60 text-white border-0 text-[10px] px-2 h-5">
                            {product.category.name}
                        </Badge>
                    </div>

                    {product.fileName && (
                        <div className="absolute top-2 right-2">
                            <span className="inline-flex items-center rounded-md border border-blue-500/30 bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-medium text-blue-200 backdrop-blur-md">
                                AUTO
                            </span>
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="p-3 flex flex-col flex-grow">
                    <Link href={`/products/${product.slug}`} className="group-hover:text-brand transition-colors">
                        <h3 className="font-medium text-base mb-1 text-card-foreground line-clamp-2 min-h-[3rem] leading-snug">
                            {product.name}
                        </h3>
                    </Link>

                    {/* Rating & Sold (Real data from API) */}
                    <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                        {(product.avgRating || 0) > 0 && (
                            <>
                                <div className="flex items-center text-yellow-500">
                                    <span className="text-xs mr-1">{product.avgRating?.toFixed(1)}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                                        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <span>•</span>
                            </>
                        )}
                        {(product.soldCount || 0) > 0 && (
                            <span>Đã bán {product.soldCount}</span>
                        )}
                    </div>

                    <div className="mt-auto pt-3 border-t border-border/50 flex items-center justify-between">
                        <div>
                            <div className="text-base font-bold text-red-600 dark:text-red-400">
                                {formatCurrency(product.priceVnd)}
                            </div>
                            {product.stock > 0 ? (
                                <div className="text-[10px] text-emerald-500 mt-0.5 flex items-center">
                                    <span className="w-1 h-1 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                                    Sẵn hàng
                                </div>
                            ) : (
                                <div className="text-[10px] text-muted-foreground mt-0.5">Hết hàng</div>
                            )}
                        </div>

                        {product.stock > 0 ? (
                            <button
                                onClick={() => setIsQuickBuyOpen(true)}
                                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition-colors shadow-md shadow-blue-500/20"
                            >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                Mua Ngay
                            </button>
                        ) : (
                            <span className="inline-flex items-center h-8 px-3 rounded-lg bg-secondary text-muted-foreground text-xs font-medium">
                                Hết hàng
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Buy Modal */}
            <QuickBuyModal
                product={{
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    priceVnd: product.priceVnd,
                    stock: product.stock,
                    images: product.images,
                    category: product.category,
                }}
                isOpen={isQuickBuyOpen}
                onClose={() => setIsQuickBuyOpen(false)}
            />
        </>
    );
}
