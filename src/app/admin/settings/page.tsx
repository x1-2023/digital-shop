'use client';

import { useState, useEffect } from 'react';
// import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Save,
  CreditCard,
  Banknote,
  Shield,
  Loader2,
  Plus,
  Trash2,
  TestTube,
  AlertCircle,
  CheckCircle2,
  Landmark,
  Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { BankAPIConfig } from '@/lib/generic-bank-api';

interface SettingsData {
  paymentMethods: {
    manual: boolean;
    autoTopup: boolean;
  };
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    instructions: string;
  };
  topupRules: {
    minVnd: number;
    maxVnd: number;
  };
  autoTopupBanks: BankAPIConfig[];
  discordWebhook: {
    enabled: boolean;
    webhookUrl: string;
    notifyOnOrders: boolean;
    notifyOnDeposits: boolean;
  };
}

const EMPTY_BANK_CONFIG: Partial<BankAPIConfig> = {
  name: '',
  enabled: true,
  apiUrl: 'http://192.168.1.1:6868',
  method: 'GET',
  fieldMapping: {
    transactionsPath: 'transactionHistoryList',
    fields: {
      transactionId: 'refNo',
      amount: 'creditAmount',
      description: 'description',
      transactionDate: 'transactionDate',
    },
  },
  filters: {
    onlyCredit: true,
    creditIndicator: {
      field: 'debitAmount',
      value: '0',
      condition: 'equals',
    },
  },
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    paymentMethods: {
      manual: true,
      autoTopup: false,
    },
    bankInfo: {
      bankName: '',
      accountNumber: '',
      accountHolder: '',
      instructions: '',
    },
    topupRules: {
      minVnd: 10000,
      maxVnd: 10000000,
    },
    autoTopupBanks: [],
    discordWebhook: {
      enabled: false,
      webhookUrl: '',
      notifyOnOrders: true,
      notifyOnDeposits: true,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<any>(null);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Load website settings
      const settingsRes = await fetch('/api/admin/website-settings');
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(prev => ({
          ...prev,
          ...data.settings,
        }));
      }

      // Load bank configs
      const banksRes = await fetch('/api/admin/bank-config');
      if (banksRes.ok) {
        const data = await banksRes.json();
        setSettings(prev => ({
          ...prev,
          autoTopupBanks: data.configs || [],
        }));
      }

      // Load webhook config
      const webhookRes = await fetch('/api/admin/webhook');
      if (webhookRes.ok) {
        const data = await webhookRes.json();
        setSettings(prev => ({
          ...prev,
          discordWebhook: data.config || {
            enabled: false,
            webhookUrl: '',
            notifyOnOrders: true,
            notifyOnDeposits: true,
          },
        }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Có lỗi xảy ra khi tải cài đặt',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save website settings
      const settingsRes = await fetch('/api/admin/website-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethods: settings.paymentMethods,
          bankInfo: settings.bankInfo,
          topupRules: settings.topupRules,
        }),
      });

      if (!settingsRes.ok) {
        throw new Error('Không thể lưu cài đặt');
      }

      // Save bank configs
      const banksRes = await fetch('/api/admin/bank-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: settings.autoTopupBanks }),
      });

      if (!banksRes.ok) {
        throw new Error('Không thể lưu cấu hình ngân hàng');
      }

      // Save webhook config
      const webhookRes = await fetch('/api/admin/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings.discordWebhook),
      });

      if (!webhookRes.ok) {
        throw new Error('Không thể lưu cấu hình webhook');
      }

      toast({
        title: 'Đã lưu cài đặt',
        description: 'Cài đặt đã được cập nhật thành công',
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu cài đặt',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSettings = (path: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current: any = newSettings;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  const toggleTopupMode = (mode: 'manual' | 'autoTopup') => {
    setSettings(prev => ({
      ...prev,
      paymentMethods: {
        manual: mode === 'manual',
        autoTopup: mode === 'autoTopup',
      },
    }));
  };

  const addBank = () => {
    const newId = `bank_${Date.now()}`;
    setSettings(prev => ({
      ...prev,
      autoTopupBanks: [
        ...prev.autoTopupBanks,
        { ...EMPTY_BANK_CONFIG, id: newId } as BankAPIConfig,
      ],
    }));
    setEditingBankId(newId);
  };

  const deleteBank = (id: string) => {
    setSettings(prev => ({
      ...prev,
      autoTopupBanks: prev.autoTopupBanks.filter(b => b.id !== id),
    }));
    if (editingBankId === id) {
      setEditingBankId(null);
    }
  };

  const updateBank = (id: string, updates: Partial<BankAPIConfig>) => {
    setSettings(prev => ({
      ...prev,
      autoTopupBanks: prev.autoTopupBanks.map(b =>
        b.id === id ? { ...b, ...updates } : b
      ),
    }));
  };

  const testBankConnection = async (config: BankAPIConfig) => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/admin/bank-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });

      const data = await response.json();
      setTestResult(data);

      if (data.success) {
        toast({
          title: 'Kết nối thành công',
          description: `Tìm thấy ${data.count} giao dịch`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Kết nối thất bại',
          description: data.error,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể test kết nối',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const testWebhook = async () => {
    setIsTestingWebhook(true);
    setWebhookTestResult(null);

    try {
      const response = await fetch('/api/admin/webhook/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: settings.discordWebhook.webhookUrl,
        }),
      });

      const data = await response.json();
      setWebhookTestResult(data);

      if (data.success) {
        toast({
          title: 'Test thành công',
          description: 'Kiểm tra Discord channel của bạn',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Test thất bại',
          description: data.message,
        });
      }
    } catch (error) {
      setWebhookTestResult({
        success: false,
        message: 'Có lỗi xảy ra khi test webhook',
      });
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Có lỗi xảy ra khi test webhook',
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-card rounded w-1/4"></div>
          <div className="h-64 bg-card rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Cài đặt hệ thống</h1>
            <p className="text-text-muted">
              Quản lý cài đặt thanh toán và nạp tiền
            </p>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Lưu cài đặt
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="topup-mode" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="topup-mode">Chế độ nạp tiền</TabsTrigger>
            <TabsTrigger value="bank-info">Thông tin NH</TabsTrigger>
            <TabsTrigger value="auto-banks">Cấu hình Auto</TabsTrigger>
            <TabsTrigger value="webhook">Discord Webhook</TabsTrigger>
          </TabsList>

          {/* Topup Mode */}
          <TabsContent value="topup-mode" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Chế độ nạp tiền</span>
                </CardTitle>
                <CardDescription>
                  Chọn chế độ nạp tiền (chỉ được bật 1 trong 2)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="manual-topup" className="text-base font-semibold">
                      Nạp tiền thủ công
                    </Label>
                    <p className="text-sm text-text-muted mt-1">
                      Người dùng tạo QR code, chuyển khoản, admin duyệt thủ công
                    </p>
                  </div>
                  <Switch
                    id="manual-topup"
                    checked={settings.paymentMethods.manual}
                    onCheckedChange={() => toggleTopupMode('manual')}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="auto-topup" className="text-base font-semibold">
                      Nạp tiền tự động
                    </Label>
                    <p className="text-sm text-text-muted mt-1">
                      Tự động check giao dịch từ Bank API, tự động duyệt và cộng tiền
                    </p>
                  </div>
                  <Switch
                    id="auto-topup"
                    checked={settings.paymentMethods.autoTopup}
                    onCheckedChange={() => toggleTopupMode('autoTopup')}
                  />
                </div>

                {settings.paymentMethods.autoTopup && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-blue-500">Lưu ý khi bật Auto-Topup</p>
                        <ul className="text-sm text-text-muted mt-2 space-y-1 list-disc list-inside">
                          <li>Cần cấu hình ít nhất 1 ngân hàng trong tab &quot;Cấu hình Auto&quot;</li>
                          <li>Cần setup Bank API server riêng (chạy trên port 6868 hoặc tùy chỉnh)</li>
                          <li>Cần setup Cron job gọi API mỗi 20 giây</li>
                          <li>Mã nạp tiền format: <code className="bg-background px-1 py-0.5 rounded">NAP + userId</code></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Topup Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Quy tắc nạp tiền</span>
                </CardTitle>
                <CardDescription>
                  Giới hạn số tiền nạp tối thiểu và tối đa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min-amount">Số tiền tối thiểu (VND)</Label>
                    <Input
                      id="min-amount"
                      type="number"
                      value={settings.topupRules.minVnd || 0}
                      onChange={(e) => updateSettings('topupRules.minVnd', parseInt(e.target.value))}
                      placeholder="10000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-amount">Số tiền tối đa (VND)</Label>
                    <Input
                      id="max-amount"
                      type="number"
                      value={settings.topupRules.maxVnd || 0}
                      onChange={(e) => updateSettings('topupRules.maxVnd', parseInt(e.target.value))}
                      placeholder="10000000"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bank Info */}
          <TabsContent value="bank-info" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Banknote className="h-5 w-5" />
                  <span>Thông tin ngân hàng nhận tiền</span>
                </CardTitle>
                <CardDescription>
                  Thông tin này sẽ hiển thị cho người dùng khi nạp tiền (dùng cho cả thủ công và tự động)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bank-name">Tên ngân hàng</Label>
                    <Input
                      id="bank-name"
                      value={settings.bankInfo.bankName || ''}
                      onChange={(e) => updateSettings('bankInfo.bankName', e.target.value)}
                      placeholder="Ví dụ: TPBank"
                    />
                  </div>
                  <div>
                    <Label htmlFor="account-number">Số tài khoản</Label>
                    <Input
                      id="account-number"
                      value={settings.bankInfo.accountNumber || ''}
                      onChange={(e) => updateSettings('bankInfo.accountNumber', e.target.value)}
                      placeholder="Ví dụ: 03097189801"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="account-holder">Tên chủ tài khoản</Label>
                  <Input
                    id="account-holder"
                    value={settings.bankInfo.accountHolder || ''}
                    onChange={(e) => updateSettings('bankInfo.accountHolder', e.target.value)}
                    placeholder="Ví dụ: NGUYEN VAN A"
                  />
                </div>

                <div>
                  <Label htmlFor="instructions">Hướng dẫn nạp tiền</Label>
                  <Textarea
                    id="instructions"
                    value={settings.bankInfo.instructions || ''}
                    onChange={(e) => updateSettings('bankInfo.instructions', e.target.value)}
                    placeholder="Hướng dẫn chi tiết cho người dùng..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Auto Banks Config */}
          <TabsContent value="auto-banks" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Landmark className="h-5 w-5" />
                      <span>Cấu hình Bank API</span>
                    </CardTitle>
                    <CardDescription>
                      Quản lý các ngân hàng cho auto-topup (có thể dùng nhiều ngân hàng)
                    </CardDescription>
                  </div>
                  <Button onClick={addBank} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm ngân hàng
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.autoTopupBanks.length === 0 ? (
                  <div className="text-center py-12 text-text-muted">
                    <Landmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Chưa có ngân hàng nào được cấu hình</p>
                    <p className="text-sm mt-2">Click &quot;Thêm ngân hàng&quot; để bắt đầu</p>
                  </div>
                ) : (
                  settings.autoTopupBanks.map((bank) => (
                    <Card key={bank.id} className="border-2">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Switch
                              checked={bank.enabled}
                              onCheckedChange={(checked) =>
                                updateBank(bank.id, { enabled: checked })
                              }
                            />
                            <div>
                              <CardTitle className="text-base">
                                {bank.name || 'Ngân hàng chưa đặt tên'}
                              </CardTitle>
                              <p className="text-xs text-text-muted">{bank.apiUrl}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setEditingBankId(editingBankId === bank.id ? null : bank.id)
                              }
                            >
                              {editingBankId === bank.id ? 'Thu gọn' : 'Chỉnh sửa'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteBank(bank.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      {editingBankId === bank.id && (
                        <CardContent className="space-y-4 border-t pt-4">
                          {/* Basic Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Tên ngân hàng</Label>
                              <Input
                                value={bank.name}
                                onChange={(e) =>
                                  updateBank(bank.id, { name: e.target.value })
                                }
                                placeholder="MB Bank, VCB, TPBank..."
                              />
                            </div>
                            <div>
                              <Label>Method</Label>
                              <Select
                                value={bank.method}
                                onValueChange={(value: 'GET' | 'POST') =>
                                  updateBank(bank.id, { method: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="GET">GET</SelectItem>
                                  <SelectItem value="POST">POST</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <Label>API URL (Bank API Server)</Label>
                            <Input
                              value={bank.apiUrl}
                              onChange={(e) =>
                                updateBank(bank.id, { apiUrl: e.target.value })
                              }
                              placeholder="http://192.168.1.1:6868"
                            />
                            <p className="text-xs text-text-muted mt-1">
                              URL của server check giao dịch ngân hàng (chạy riêng)
                            </p>
                          </div>

                          {/* Field Mapping */}
                          <div className="border-t pt-4">
                            <Label className="text-base font-semibold">Field Mapping</Label>
                            <p className="text-sm text-text-muted mb-3">
                              Cấu hình đường dẫn đến các field trong JSON response
                            </p>

                            <div className="space-y-3">
                              <div>
                                <Label className="text-xs">Transactions Path</Label>
                                <Input
                                  value={bank.fieldMapping.transactionsPath}
                                  onChange={(e) =>
                                    updateBank(bank.id, {
                                      fieldMapping: {
                                        ...bank.fieldMapping,
                                        transactionsPath: e.target.value,
                                      },
                                    })
                                  }
                                  placeholder="transactionHistoryList"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs">Transaction ID Field</Label>
                                  <Input
                                    value={bank.fieldMapping.fields.transactionId}
                                    onChange={(e) =>
                                      updateBank(bank.id, {
                                        fieldMapping: {
                                          ...bank.fieldMapping,
                                          fields: {
                                            ...bank.fieldMapping.fields,
                                            transactionId: e.target.value,
                                          },
                                        },
                                      })
                                    }
                                    placeholder="refNo"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Amount Field</Label>
                                  <Input
                                    value={bank.fieldMapping.fields.amount}
                                    onChange={(e) =>
                                      updateBank(bank.id, {
                                        fieldMapping: {
                                          ...bank.fieldMapping,
                                          fields: {
                                            ...bank.fieldMapping.fields,
                                            amount: e.target.value,
                                          },
                                        },
                                      })
                                    }
                                    placeholder="creditAmount"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Description Field</Label>
                                  <Input
                                    value={bank.fieldMapping.fields.description}
                                    onChange={(e) =>
                                      updateBank(bank.id, {
                                        fieldMapping: {
                                          ...bank.fieldMapping,
                                          fields: {
                                            ...bank.fieldMapping.fields,
                                            description: e.target.value,
                                          },
                                        },
                                      })
                                    }
                                    placeholder="description"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Date Field</Label>
                                  <Input
                                    value={bank.fieldMapping.fields.transactionDate}
                                    onChange={(e) =>
                                      updateBank(bank.id, {
                                        fieldMapping: {
                                          ...bank.fieldMapping,
                                          fields: {
                                            ...bank.fieldMapping.fields,
                                            transactionDate: e.target.value,
                                          },
                                        },
                                      })
                                    }
                                    placeholder="transactionDate"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Credit Filter */}
                          <div className="border-t pt-4">
                            <Label className="text-base font-semibold">Credit Filter</Label>
                            <p className="text-sm text-text-muted mb-3">
                              Lọc chỉ lấy giao dịch tiền VÀO (credit)
                            </p>

                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <Label className="text-xs">Field</Label>
                                <Input
                                  value={bank.filters.creditIndicator?.field || ''}
                                  onChange={(e) =>
                                    updateBank(bank.id, {
                                      filters: {
                                        ...bank.filters,
                                        creditIndicator: {
                                          ...bank.filters.creditIndicator!,
                                          field: e.target.value,
                                        },
                                      },
                                    })
                                  }
                                  placeholder="debitAmount"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Value</Label>
                                <Input
                                  value={bank.filters.creditIndicator?.value || ''}
                                  onChange={(e) =>
                                    updateBank(bank.id, {
                                      filters: {
                                        ...bank.filters,
                                        creditIndicator: {
                                          ...bank.filters.creditIndicator!,
                                          value: e.target.value,
                                        },
                                      },
                                    })
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Condition</Label>
                                <Select
                                  value={bank.filters.creditIndicator?.condition || 'equals'}
                                  onValueChange={(value: 'equals' | 'greater' | 'contains') =>
                                    updateBank(bank.id, {
                                      filters: {
                                        ...bank.filters,
                                        creditIndicator: {
                                          ...bank.filters.creditIndicator!,
                                          condition: value,
                                        },
                                      },
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="equals">Equals</SelectItem>
                                    <SelectItem value="greater">Greater</SelectItem>
                                    <SelectItem value="contains">Contains</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>

                          {/* Test Button */}
                          <div className="border-t pt-4">
                            <Button
                              onClick={() => testBankConnection(bank)}
                              disabled={isTesting}
                              variant="outline"
                              className="w-full"
                            >
                              {isTesting ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Đang test...
                                </>
                              ) : (
                                <>
                                  <TestTube className="h-4 w-4 mr-2" />
                                  Test kết nối
                                </>
                              )}
                            </Button>

                            {testResult && (
                              <div
                                className={`mt-3 p-3 rounded-lg border ${testResult.success
                                    ? 'bg-green-500/10 border-green-500/20'
                                    : 'bg-red-500/10 border-red-500/20'
                                  }`}
                              >
                                <div className="flex items-start space-x-2">
                                  {testResult.success ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <AlertCircle className="h-5 w-5 text-red-500" />
                                  )}
                                  <div className="flex-1">
                                    <p className="font-semibold text-sm">
                                      {testResult.success ? 'Kết nối thành công!' : 'Kết nối thất bại'}
                                    </p>
                                    <p className="text-sm text-text-muted mt-1">
                                      {testResult.message || testResult.error}
                                    </p>
                                    {testResult.sample && testResult.sample.length > 0 && (
                                      <div className="mt-2 text-xs">
                                        <p className="font-semibold">Giao dịch mẫu:</p>
                                        <pre className="mt-1 bg-background p-2 rounded overflow-auto">
                                          {JSON.stringify(testResult.sample[0], null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Discord Webhook */}
          <TabsContent value="webhook" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Send className="h-5 w-5" />
                  <span>Discord Webhook</span>
                </CardTitle>
                <CardDescription>
                  Nhận thông báo realtime về Discord khi có order hoặc nạp tiền
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Enable switch */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="webhook-enabled" className="text-base font-semibold">
                      Bật Discord Webhook
                    </Label>
                    <p className="text-sm text-text-muted mt-1">
                      Gửi thông báo tự động đến Discord channel
                    </p>
                  </div>
                  <Switch
                    id="webhook-enabled"
                    checked={settings.discordWebhook.enabled}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      discordWebhook: { ...prev.discordWebhook, enabled: checked }
                    }))}
                  />
                </div>

                {/* Webhook URL */}
                <div>
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    value={settings.discordWebhook.webhookUrl}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      discordWebhook: { ...prev.discordWebhook, webhookUrl: e.target.value }
                    }))}
                    placeholder="https://discord.com/api/webhooks/..."
                    disabled={!settings.discordWebhook.enabled}
                  />
                  <p className="text-xs text-text-muted mt-1">
                    Tạo webhook trong Discord: Server Settings → Integrations → Webhooks
                  </p>
                </div>

                {/* Notify on orders */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="notify-orders"
                    checked={settings.discordWebhook.notifyOnOrders}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      discordWebhook: { ...prev.discordWebhook, notifyOnOrders: checked }
                    }))}
                    disabled={!settings.discordWebhook.enabled}
                  />
                  <Label htmlFor="notify-orders">Thông báo khi có order mới</Label>
                </div>

                {/* Notify on deposits */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="notify-deposits"
                    checked={settings.discordWebhook.notifyOnDeposits}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      discordWebhook: { ...prev.discordWebhook, notifyOnDeposits: checked }
                    }))}
                    disabled={!settings.discordWebhook.enabled}
                  />
                  <Label htmlFor="notify-deposits">Thông báo khi có nạp tiền</Label>
                </div>

                {/* Test button */}
                <Button
                  onClick={testWebhook}
                  disabled={isTestingWebhook || !settings.discordWebhook.webhookUrl}
                  variant="outline"
                  className="w-full"
                >
                  {isTestingWebhook ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang test...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Test Webhook
                    </>
                  )}
                </Button>

                {/* Test result */}
                {webhookTestResult && (
                  <div className={`p-3 rounded-lg border ${webhookTestResult.success
                      ? 'bg-green-500/10 border-green-500/20'
                      : 'bg-red-500/10 border-red-500/20'
                    }`}>
                    <div className="flex items-start space-x-2">
                      {webhookTestResult.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-sm">
                          {webhookTestResult.success ? 'Thành công!' : 'Thất bại'}
                        </p>
                        <p className="text-sm text-text-muted mt-1">
                          {webhookTestResult.message}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
