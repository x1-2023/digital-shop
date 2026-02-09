'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Zap, Shield, CheckCircle, Headphones, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, safeParseImages } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface HeroMarketplaceProps {
    dealProduct?: any;
}

export function HeroMarketplace({ dealProduct }: HeroMarketplaceProps) {
    const images = safeParseImages(dealProduct?.images as string);

    return (
        <section className="container mx-auto px-4 py-6">
            {/* Static Banner */}
            <div className="relative rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-950">

                {/* Background Decoration */}
                <div className="absolute inset-0">
                    <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500/30 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 right-1/3 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-pink-500/20 rounded-full blur-2xl"></div>
                </div>

                {/* Content Container */}
                <div className="relative z-10 flex flex-col lg:flex-row">

                    {/* Banner Content - Left */}
                    <div className="flex-1 p-6 md:p-10 text-white flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-3 opacity-90">
                            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Shield className="w-5 h-5" />
                            </div>
                            <span className="font-semibold tracking-wider text-sm">{(process.env.NEXT_PUBLIC_SITE_NAME || 'DIGITAL SHOP').toUpperCase()}</span>
                        </div>

                        <h2 className="text-2xl md:text-4xl font-extrabold mb-1 tracking-tight">
                            DIGITAL MARKETPLACE
                        </h2>
                        <h3 className="text-lg md:text-2xl font-bold mb-3 text-white/90">
                            GIÁ TỐT - GIAO NHANH - UY TÍN
                        </h3>
                        <p className="text-white/80 mb-5 text-sm md:text-base max-w-md">
                            Mua nhanh - Nhận hàng tự động - Có bảo hành rõ ràng
                        </p>

                        <div className="flex flex-wrap gap-2 mb-5">
                            <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                                <CheckCircle className="w-3 h-3" />
                                Giao hàng tự động
                            </div>
                            <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                                <Clock className="w-3 h-3" />
                                Bảo hành rõ ràng
                            </div>
                            <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                                <Headphones className="w-3 h-3" />
                                Hỗ trợ 24/7
                            </div>
                        </div>

                        <Link href="/products" className="w-fit">
                            <Button size="default" className="bg-white text-gray-900 hover:bg-white/90 border-none font-bold shadow-xl">
                                Khám phá sản phẩm
                            </Button>
                        </Link>
                    </div>

                    {/* Deal Card - Right (Hidden on mobile, visible on lg+) */}
                    <div className="hidden lg:flex w-[320px] xl:w-[380px] p-4 flex-shrink-0">
                        <div className="w-full bg-card/95 backdrop-blur-md rounded-xl p-4 border border-border shadow-xl flex flex-col">
                            <div className="flex items-center gap-2 mb-3">
                                <Zap className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
                                <span className="font-bold text-orange-500 uppercase text-xs">Deal Hôm Nay</span>
                            </div>

                            {dealProduct ? (
                                <div className="flex-1 flex gap-4">
                                    {/* Left: Square Image */}
                                    <div className="relative w-[100px] xl:w-[120px] h-[100px] xl:h-[120px] flex-shrink-0 rounded-xl overflow-hidden bg-secondary/50">
                                        {images[0] ? (
                                            <Image
                                                src={images[0]}
                                                alt={dealProduct.name}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-4xl">🎁</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Info */}
                                    <div className="flex-1 flex flex-col min-w-0">
                                        <Link href={`/products/${dealProduct.slug}`} className="hover:text-brand transition-colors">
                                            <h3 className="font-bold text-sm mb-2 line-clamp-2 leading-tight">
                                                {dealProduct.name}
                                            </h3>
                                        </Link>

                                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                                            {dealProduct.isSale && (
                                                <span className="text-xs text-muted-foreground line-through">
                                                    {formatCurrency(Math.round(dealProduct.priceVnd / (1 - (dealProduct.salePercent || 10) / 100)))}
                                                </span>
                                            )}
                                            <span className="text-lg font-bold text-red-500">
                                                {formatCurrency(dealProduct.priceVnd)}
                                            </span>
                                            {dealProduct.isSale && (
                                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">-{dealProduct.salePercent || 10}%</Badge>
                                            )}
                                        </div>

                                        <Link href={`/products/${dealProduct.slug}`} className="w-full mt-auto">
                                            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-9 rounded-xl text-sm">
                                                Xem ngay →
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-4">
                                    <span className="text-4xl mb-3">🎁</span>
                                    <p className="text-sm text-center">Chưa có deal hôm nay</p>
                                    <Link href="/products" className="mt-3">
                                        <Button variant="outline" size="sm">Xem sản phẩm</Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Deal Card - Shown below banner on mobile */}
            {dealProduct && (
                <div className="lg:hidden mt-4 bg-card rounded-xl p-4 border border-border shadow-lg">
                    <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
                        <span className="font-bold text-orange-500 uppercase text-xs">Deal Hôm Nay</span>
                    </div>

                    <div className="flex gap-4">
                        {/* Image */}
                        <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-secondary/50">
                            {images[0] ? (
                                <Image
                                    src={images[0]}
                                    alt={dealProduct.name}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-3xl">🎁</span>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 flex flex-col min-w-0">
                            <Link href={`/products/${dealProduct.slug}`} className="hover:text-brand transition-colors">
                                <h3 className="font-bold text-sm mb-1 line-clamp-2 leading-tight">
                                    {dealProduct.name}
                                </h3>
                            </Link>

                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                {dealProduct.isSale && (
                                    <span className="text-xs text-muted-foreground line-through">
                                        {formatCurrency(Math.round(dealProduct.priceVnd / (1 - (dealProduct.salePercent || 10) / 100)))}
                                    </span>
                                )}
                                <span className="text-base font-bold text-red-500">
                                    {formatCurrency(dealProduct.priceVnd)}
                                </span>
                                {dealProduct.isSale && (
                                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">-{dealProduct.salePercent || 10}%</Badge>
                                )}
                            </div>

                            <Link href={`/products/${dealProduct.slug}`} className="w-full mt-auto">
                                <Button size="sm" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-xs">
                                    Xem ngay →
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
