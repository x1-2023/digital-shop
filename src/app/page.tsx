import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import { getSession } from '@/lib/auth';

async function getProducts() {
  const products = await prisma.product.findMany({
    where: {
      active: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 6,
  });
  return products;
}

async function getCategories() {
  const categories = await prisma.category.findMany({
    where: {
      active: true,
    },
    orderBy: {
      order: 'asc',
    },
  });
  return categories;
}

export default async function Home() {
  const [products, categories, session] = await Promise.all([
    getProducts(),
    getCategories(),
    getSession(),
  ]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="border-b border-border bg-gradient-to-b from-background to-card">
          <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-brand to-purple-500 bg-clip-text text-transparent">
              Chào mừng đến WebMMO
            </h1>
            <p className="text-xl text-text-muted mb-8 max-w-2xl mx-auto">
              Cửa hàng tài nguyên số, app, license chất lượng cao với thanh toán ví nội bộ
            </p>
            <div className="flex gap-4 justify-center">
              <Link 
                href="/products"
                className="inline-flex items-center justify-center h-11 px-8 rounded-2xl text-sm font-medium bg-brand text-white hover:bg-brand/90 shadow-lg hover:shadow-2xl hover:shadow-black/40 transition-colors"
              >
                Xem sản phẩm
              </Link>
              {!session?.user && (
                <Link 
                  href="/auth/signin"
                  className="inline-flex items-center justify-center h-11 px-8 rounded-2xl text-sm font-medium border border-border bg-transparent hover:bg-card hover:text-text-primary transition-colors"
                >
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2 text-center">Danh mục sản phẩm</h2>
            <p className="text-text-muted text-center">Khám phá các danh mục đa dạng</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?categoryId=${category.id}`}
                className="group"
              >
                <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:shadow-black/20 transition-all hover:-translate-y-1 flex flex-col items-center justify-center aspect-square">
                  {/* Icon/Image */}
                  <div className="w-16 h-16 mb-3 flex items-center justify-center">
                    {category.icon ? (
                      <Image
                        src={category.icon}
                        alt={category.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-brand/10 flex items-center justify-center">
                        <span className="text-3xl">📦</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Category Name */}
                  <h3 className="text-sm font-medium text-center text-text-primary group-hover:text-brand transition-colors line-clamp-2">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-text-muted">Chưa có danh mục nào</p>
            </div>
          )}
        </section>

        {/* Products Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Sản phẩm nổi bật</h2>
              <p className="text-text-muted">Khám phá các sản phẩm mới nhất</p>
            </div>
            <Link 
              href="/products"
              className="inline-flex items-center justify-center h-10 px-4 py-2 rounded-2xl text-sm font-medium border border-border bg-transparent hover:bg-card hover:text-text-primary transition-colors"
            >
              Xem tất cả →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const images = product.images ? JSON.parse(product.images as string) : [];
              
              return (
                <div 
                  key={product.id} 
                  className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-black/40 transition-all flex flex-col h-full"
                >
                  {/* Image Section */}
                  <div className="relative w-full bg-card-dark" style={{ paddingBottom: '56.25%' }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      {images[0] ? (
                        <>
                          <Image
                            src={images[0]}
                            alt={product.name}
                            width={300}
                            height={200}
                            className="w-full h-full object-cover"
                            unoptimized
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <span className="hidden text-6xl">📄</span>
                        </>
                      ) : (
                        <span className="text-6xl">
                          📄
                        </span>
                      )}
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center rounded-full border-transparent bg-brand text-white px-2.5 py-0.5 text-xs font-semibold">
                        {product.fileName ? 'FILE' : 'PRODUCT'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Content Section */}
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="font-semibold text-lg mb-2 text-text-primary line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-text-muted text-sm mb-4 line-clamp-2 min-h-[40px]">
                      {product.description}
                    </p>
                    
                    <div className="mt-auto pt-4 border-t border-border">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-xl font-bold text-brand truncate">
                            {formatCurrency(product.priceVnd)}
                          </div>
                          <div className="text-xs text-text-muted mt-1">
                            Kho: {product.stock}
                          </div>
                        </div>
                        <Link 
                          href={`/products/${product.slug}`}
                          className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium bg-brand text-white hover:bg-brand/90 transition-colors"
                        >
                          Xem
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {products.length === 0 && (
            <div className="text-center py-16">
              <p className="text-text-muted text-lg mb-4">Chưa có sản phẩm nào</p>
              <p className="text-text-muted text-sm">
                Vui lòng quay lại sau hoặc liên hệ admin để thêm sản phẩm
              </p>
            </div>
          )}
        </section>

        {/* Features Section */}
        <section className="border-t border-border bg-card">
          <div className="container mx-auto px-4 py-16">
            <h2 className="text-3xl font-bold text-center mb-12">Tại sao chọn WebMMO?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand/10 flex items-center justify-center">
                  <span className="text-3xl">💳</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Ví nội bộ</h3>
                <p className="text-text-muted">
                  Thanh toán nhanh chóng, an toàn với hệ thống ví tích hợp
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand/10 flex items-center justify-center">
                  <span className="text-3xl">⚡</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Giao dịch nhanh</h3>
                <p className="text-text-muted">
                  Nhận sản phẩm ngay sau khi thanh toán thành công
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand/10 flex items-center justify-center">
                  <span className="text-3xl">🔒</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Bảo mật cao</h3>
                <p className="text-text-muted">
                  RBAC, audit logs, rate limiting đảm bảo an toàn
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand/10 flex items-center justify-center">
                  <span className="text-3xl">📱</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Responsive</h3>
                <p className="text-text-muted">
                  Giao diện tối ưu cho mọi thiết bị
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand/10 flex items-center justify-center">
                  <span className="text-3xl">🎯</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Đa dạng</h3>
                <p className="text-text-muted">
                  File, License, App - đa dạng loại sản phẩm
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand/10 flex items-center justify-center">
                  <span className="text-3xl">🎨</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Dark Theme</h3>
                <p className="text-text-muted">
                  Thiết kế tối chuyên nghiệp, dễ nhìn
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        {!session?.user && (
          <section className="container mx-auto px-4 py-16 text-center">
            <h2 className="text-3xl font-bold mb-4">Sẵn sàng bắt đầu?</h2>
            <p className="text-text-muted mb-8 max-w-2xl mx-auto">
              Đăng ký ngay để trải nghiệm mua sắm tài nguyên số dễ dàng và nhanh chóng
            </p>
            <Link 
              href="/auth/signin"
              className="inline-flex items-center justify-center h-11 px-8 rounded-2xl text-sm font-medium bg-brand text-white hover:bg-brand/90 shadow-lg hover:shadow-2xl hover:shadow-black/40 transition-colors"
            >
              Đăng nhập ngay
            </Link>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}