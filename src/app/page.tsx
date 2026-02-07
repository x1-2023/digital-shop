import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { HeroMarketplace } from '@/components/home/hero-marketplace';
import { TopSellers } from '@/components/home/top-sellers';
import { HomeProductsSection } from '@/components/home/home-products-section';
import { Button } from '@/components/ui/button';

async function getDealProduct() {
  const product = await prisma.product.findFirst({
    where: {
      active: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      category: true,
    },
  });
  return product;
}

export default async function Home() {
  const [dealProduct, session] = await Promise.all([
    getDealProduct(),
    getSession(),
  ]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pb-12">
        {/* Marketplace Hero Section (Slider + Deal) */}
        <HeroMarketplace dealProduct={dealProduct} />

        <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-6 items-start mt-6">

          {/* Main Content (Left) */}
          <div className="flex-1 w-full space-y-6">
            {/* Products Section with Filter & Pagination */}
            <HomeProductsSection />
          </div>

          {/* Sidebar (Right) - Top Sellers */}
          <aside className="w-full lg:w-80 flex-shrink-0 space-y-6">
            <TopSellers />

            {/* Banner Ad (Static) */}
            <div className="rounded-xl overflow-hidden border border-border shadow-sm">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white text-center">
                <h4 className="font-bold text-lg mb-2">Quảng Cáo VIP</h4>
                <p className="text-sm opacity-90 mb-4">Tiếp cận khách hàng mục tiêu ngay hôm nay!</p>
                <Button variant="secondary" size="sm" className="w-full">Liên hệ đặt Ads</Button>
              </div>
            </div>
          </aside>

        </div>

        {/* CTA Section (Only for guests) */}
        {!session?.user && (
          <section className="mt-12 border-t border-border bg-card/50 py-16">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 max-w-2xl mx-auto">
                Sẵn sàng nâng cấp công việc MMO?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Gia nhập cộng đồng và bắt đầu mua bán tài nguyên ngay hôm nay.
              </p>
              <Link href="/auth/signup">
                <Button size="lg" className="px-8 shadow-xl shadow-brand/20">
                  Tạo tài khoản miễn phí
                </Button>
              </Link>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}