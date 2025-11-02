import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ContactPage() {
  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Liên hệ</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p>Đang cập nhật...</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
