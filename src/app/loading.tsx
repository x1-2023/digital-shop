import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-text-primary flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-brand" />
        <p className="text-text-muted">Đang tải...</p>
      </div>
    </div>
  );
}



