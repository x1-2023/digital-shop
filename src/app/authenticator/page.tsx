'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Shield,
  Plus,
  Copy,
  Trash2,
  Search,
  Clock,
  CheckCircle,
  Key
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authenticator } from 'otplib';

interface TwoFactorAccount {
  id: string;
  name: string;
  issuer: string;
  secret: string;
  createdAt: string;
}

interface TOTPCode {
  code: string;
  timeRemaining: number;
}

export default function AuthenticatorPage() {
  const [accounts, setAccounts] = useState<TwoFactorAccount[]>([]);
  const [codes, setCodes] = useState<Record<string, TOTPCode>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Quick code generation (one-time use without saving)
  const [quickSecret, setQuickSecret] = useState('');
  const [quickCode, setQuickCode] = useState<TOTPCode | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    issuer: '',
    secret: '',
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Generate TOTP codes and update every second
  useEffect(() => {
    const generateCodes = () => {
      const newCodes: Record<string, TOTPCode> = {};
      const now = Math.floor(Date.now() / 1000);
      const timeRemaining = 30 - (now % 30);

      accounts.forEach(account => {
        try {
          // Validate and clean secret
          const cleanSecret = account.secret.replace(/\s/g, '').toUpperCase();
          if (!cleanSecret || cleanSecret.length < 8) {
            throw new Error('Invalid secret length');
          }

          // Generate TOTP code using otplib
          const code = authenticator.generate(cleanSecret);
          newCodes[account.id] = {
            code,
            timeRemaining,
          };
        } catch (error) {
          console.error(`Error generating code for ${account.name}:`, error);
        }
      });

      setCodes(newCodes);

      // Generate quick code if secret is provided
      if (quickSecret) {
        try {
          const cleanSecret = quickSecret.replace(/\s/g, '').toUpperCase();
          if (cleanSecret.length < 8) {
            throw new Error('Secret too short');
          }

          // Generate TOTP code using otplib
          const code = authenticator.generate(cleanSecret);
          setQuickCode({
            code,
            timeRemaining,
          });
        } catch (error) {
          console.error('Error generating quick code:', error);
          setQuickCode(null);
        }
      } else {
        setQuickCode(null);
      }
    };

    generateCodes();
    const interval = setInterval(generateCodes, 1000);

    return () => clearInterval(interval);
  }, [accounts, quickSecret]);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/authenticator');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tải danh sách tài khoản',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.issuer || !formData.secret) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ thông tin',
      });
      return;
    }

    try {
      const res = await fetch('/api/authenticator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast({
          title: 'Thành công',
          description: 'Đã thêm tài khoản 2FA',
        });
        setFormData({ name: '', issuer: '', secret: '' });
        setShowAddForm(false);
        fetchAccounts();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Không thể thêm tài khoản');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa tài khoản này?')) return;

    try {
      const res = await fetch(`/api/authenticator?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast({
          title: 'Thành công',
          description: 'Đã xóa tài khoản',
        });
        fetchAccounts();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể xóa tài khoản',
      });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Đã sao chép',
      description: 'Mã đã được sao chép vào clipboard',
    });
  };

  const filteredAccounts = accounts.filter(account =>
    account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.issuer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-brand" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-text-primary">
                  Authenticator - 2FA
                </h1>
                <p className="text-text-muted">
                  Lấy mã xác thực 2 yếu tố từ chuỗi 2FA
                </p>
              </div>
            </div>
          </div>

          {/* Quick Code Generator - One-time use */}
          <Card className="mb-6 border-brand/30 bg-gradient-to-br from-brand/5 to-purple-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-brand" />
                Lấy mã nhanh (không lưu)
              </CardTitle>
              <p className="text-sm text-text-muted">
                Dán chuỗi 2FA để lấy mã code ngay - không cần lưu vào tài khoản
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    type="text"
                    placeholder="Dán chuỗi 2FA vào đây (VD: JBSWY3DPEHPK3PXP)"
                    value={quickSecret}
                    onChange={(e) => setQuickSecret(e.target.value.replace(/\s/g, '').toUpperCase())}
                    className="flex-1"
                  />
                  {quickSecret && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setQuickSecret('');
                        setQuickCode(null);
                      }}
                    >
                      Xóa
                    </Button>
                  )}
                </div>

                {quickCode && (
                  <div className="bg-card border-2 border-brand/30 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-text-muted mb-1">Mã xác thực</p>
                        <div className="font-mono text-4xl font-bold text-brand tracking-wider">
                          {quickCode.code.slice(0, 3)} {quickCode.code.slice(3)}
                        </div>
                      </div>
                      <Button
                        size="lg"
                        onClick={() => copyCode(quickCode.code)}
                        className="flex-shrink-0"
                      >
                        <Copy className="w-5 h-5 mr-2" />
                        Copy
                      </Button>
                    </div>

                    {/* Countdown */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-muted flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Làm mới sau
                        </span>
                        <span className={`font-medium text-lg ${quickCode.timeRemaining <= 5
                            ? 'text-danger'
                            : 'text-brand'
                          }`}>
                          {quickCode.timeRemaining}s
                        </span>
                      </div>
                      <div className="h-2 bg-card-dark rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ${quickCode.timeRemaining <= 5
                              ? 'bg-danger'
                              : 'bg-brand'
                            }`}
                          style={{ width: `${(quickCode.timeRemaining / 30) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {quickSecret && !quickCode && (
                  <div className="text-center py-4 text-text-muted text-sm">
                    Chuỗi 2FA không hợp lệ. Vui lòng kiểm tra lại.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Search and Add */}
          <div className="mb-6 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
              <Input
                type="text"
                placeholder="Tìm kiếm tài khoản..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm tài khoản
            </Button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Thêm tài khoản 2FA mới</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdd} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Tên tài khoản</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="VD: Gmail - work@example.com"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="issuer">Dịch vụ (Issuer)</Label>
                    <Input
                      id="issuer"
                      type="text"
                      placeholder="VD: Google, Facebook, GitHub"
                      value={formData.issuer}
                      onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="secret">Chuỗi 2FA Secret</Label>
                    <Input
                      id="secret"
                      type="text"
                      placeholder="VD: JBSWY3DPEHPK3PXP"
                      value={formData.secret}
                      onChange={(e) => setFormData({ ...formData, secret: e.target.value.replace(/\s/g, '') })}
                    />
                    <p className="text-xs text-text-muted mt-1">
                      Nhập chuỗi secret key (không có khoảng trắng)
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" className="flex-1">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Thêm
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddForm(false)}
                    >
                      Hủy
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Accounts List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full mx-auto"></div>
              <p className="text-text-muted mt-4">Đang tải...</p>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Key className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-50" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? 'Không tìm thấy tài khoản' : 'Chưa có tài khoản 2FA nào'}
                </h3>
                <p className="text-text-muted mb-4">
                  {searchQuery
                    ? 'Thử tìm kiếm với từ khóa khác'
                    : 'Thêm tài khoản đầu tiên để bắt đầu sử dụng'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm tài khoản
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAccounts.map((account) => {
                const codeData = codes[account.id];
                const timePercent = codeData ? (codeData.timeRemaining / 30) * 100 : 0;

                return (
                  <Card key={account.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">
                            {account.name}
                          </CardTitle>
                          <p className="text-xs text-text-muted truncate">
                            {account.issuer}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(account.id)}
                          className="ml-2 flex-shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {codeData ? (
                        <>
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-mono text-3xl font-bold text-brand tracking-wider">
                                {codeData.code.slice(0, 3)} {codeData.code.slice(3)}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyCode(codeData.code)}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Countdown Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-text-muted flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Làm mới sau
                              </span>
                              <span className={`font-medium ${codeData.timeRemaining <= 5
                                  ? 'text-danger'
                                  : 'text-text-muted'
                                }`}>
                                {codeData.timeRemaining}s
                              </span>
                            </div>
                            <div className="h-1.5 bg-card-dark rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-1000 ${codeData.timeRemaining <= 5
                                    ? 'bg-danger'
                                    : 'bg-brand'
                                  }`}
                                style={{ width: `${timePercent}%` }}
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-text-muted text-sm">Đang tạo mã...</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Info Section */}
          <Card className="mt-8 border-brand/20 bg-brand/5">
            <CardContent className="py-6">
              <div className="flex gap-4">
                <Shield className="w-8 h-8 text-brand flex-shrink-0" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-text-primary">
                    Authenticator là gì?
                  </h3>
                  <ul className="text-sm text-text-muted space-y-1 list-disc list-inside">
                    <li>
                      Authenticator là một ứng dụng tạo ra mã 2FA (mã code gồm 6 số ngẫu nhiên thay đổi ngẫu nhiên mỗi 30 giây)
                    </li>
                    <li>
                      Khi bạn đăng nhập vào tài khoản, có yêu cầu xác thực 2 yếu tố bằng chuỗi 2FA, bạn buộc phải sử dụng Authenticator để nhận mã đăng nhập
                    </li>
                    <li>
                      Khi đã đăng ký tài khoản với tài khoản 2FA, bạn cần lưu chuỗi 2FA lại. Tap hoá 2FA bán các sản phẩm thường kèm theo 2FA
                    </li>
                    <li>
                      Các gian hàng trên {process.env.NEXT_PUBLIC_SITE_NAME || 'Digital Shop'} bán các sản phẩm thường kèm theo 2FA, hãy dùng ứng dụng này để lấy mã đăng nhập nhé.
                    </li>
                    <li>
                      *Lưu ý: Tính năng này sẽ lưu trên trình duyệt của bạn, nếu bạn đổi trình duyệt hoặc xóa cookie sẽ bị mất dữ liệu. Hãy sao chép chuỗi dự phòng và lưu lại ở một nơi an toàn.
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
