import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-text-primary flex items-center justify-center">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-12">
            <div className="text-6xl font-bold text-brand mb-4">404</div>
            <h1 className="text-2xl font-semibold mb-2">Không tìm thấy trang</h1>
            <p className="text-text-muted mb-8">
              Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
            </p>
            
            <div className="space-y-3">
              <Link href="/" className="block">
                <Button className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Về trang chủ
                </Button>
              </Link>
              
              <Link href="/products" className="block">
                <Button variant="outline" className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  Khám phá sản phẩm
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



