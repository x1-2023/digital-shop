'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, RefreshCw, ArrowLeft } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-text-primary flex items-center justify-center">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-12">
            <div className="text-6xl font-bold text-danger mb-4">500</div>
            <h1 className="text-2xl font-semibold mb-2">Có lỗi xảy ra</h1>
            <p className="text-text-muted mb-8">
              Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-card border border-border rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold mb-2">Chi tiết lỗi:</h3>
                <p className="text-sm text-text-muted font-mono break-all">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-text-muted mt-2">
                    Digest: {error.digest}
                  </p>
                )}
              </div>
            )}
            
            <div className="space-y-3">
              <Button onClick={reset} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Thử lại
              </Button>
              
              <Link href="/" className="block">
                <Button variant="outline" className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Về trang chủ
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



