'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Settings, Shield, Zap, Globe, Cpu, Database } from 'lucide-react';

export function HeroSection() {
    return (
        <div className="relative overflow-hidden bg-background border-b border-border">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-20">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-brand opacity-20 blur-[100px]"></div>
            </div>

            <div className="container relative z-10 mx-auto px-4 py-24 md:py-32">
                <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="inline-flex items-center rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-sm font-medium text-brand mb-6 backdrop-blur-sm">
                            <span className="flex h-2 w-2 rounded-full bg-brand mr-2 animate-pulse"></span>
                            Make Money Online Resources
                        </span>
                    </motion.div>

                    <motion.h1
                        className="text-4xl md:text-6xl font-bold tracking-tight text-text-primary mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        Nền tảng cung cấp <br className="hidden md:block" />
                        <span className="bg-gradient-to-r from-brand to-purple-400 bg-clip-text text-transparent">Digital Assets & Tools</span> hàng đầu
                    </motion.h1>

                    <motion.p
                        className="text-lg md:text-xl text-text-muted mb-10 max-w-2xl leading-relaxed"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        Tự động hóa quy trình Dropshipping, Marketing và MMO của bạn với các công cụ,
                        source code và tài nguyên chất lượng cao đã được kiểm duyệt.
                    </motion.p>

                    <motion.div
                        className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <Link
                            href="/products"
                            className="inline-flex items-center justify-center h-12 px-8 rounded-xl font-medium bg-brand text-white hover:bg-brand-dark transition-all shadow-lg shadow-brand/25 hover:shadow-brand/40 hover:-translate-y-0.5"
                        >
                            <Zap className="w-5 h-5 mr-2" />
                            Khám phá ngay
                        </Link>
                        <Link
                            href="/auth/signup"
                            className="inline-flex items-center justify-center h-12 px-8 rounded-xl font-medium border border-border bg-card/50 hover:bg-card text-text-primary transition-all backdrop-blur-sm hover:border-text-muted/30"
                        >
                            Đăng ký thành viên
                        </Link>
                    </motion.div>

                    {/* Features Grid */}
                    <motion.div
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 w-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                    >
                        {[
                            { icon: Shield, label: 'Bảo mật tuyệt đối' },
                            { icon: Zap, label: 'Giao dịch tự động' },
                            { icon: Database, label: 'Kho dữ liệu lớn' },
                            { icon: Cpu, label: 'API tốc độ cao' },
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center p-4 bg-card/30 border border-border/50 rounded-xl backdrop-blur-sm hover:bg-card/50 transition-colors">
                                <item.icon className="w-6 h-6 text-text-muted mb-2" />
                                <span className="text-sm font-medium text-text-muted">{item.label}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
