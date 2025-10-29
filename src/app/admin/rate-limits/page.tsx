'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Shield, Save, RotateCcw, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface RateLimitConfig {
  key: string
  name: string
  description: string
  limit: number
  window: number // in minutes
  blockDuration?: number // in minutes
}

export default function RateLimitsPage() {
  const { toast } = useToast()
  const [configs, setConfigs] = useState<RateLimitConfig[]>([
    {
      key: 'LOGIN',
      name: 'Login',
      description: 'Giới hạn số lần đăng nhập thất bại',
      limit: 5,
      window: 5,
      blockDuration: 15
    },
    {
      key: 'SIGNUP',
      name: 'Sign Up',
      description: 'Giới hạn số lần đăng ký tài khoản',
      limit: 3,
      window: 60,
      blockDuration: 60
    },
    {
      key: 'FORGOT_PASSWORD',
      name: 'Forgot Password',
      description: 'Giới hạn yêu cầu reset mật khẩu',
      limit: 3,
      window: 60,
      blockDuration: 60
    },
    {
      key: 'TOPUP_REQUEST',
      name: 'Topup Request',
      description: 'Giới hạn yêu cầu nạp tiền',
      limit: 5,
      window: 60,
      blockDuration: undefined
    },
    {
      key: 'CREATE_ORDER',
      name: 'Create Order',
      description: 'Giới hạn tạo đơn hàng',
      limit: 10,
      window: 1,
      blockDuration: undefined
    },
    {
      key: 'FILE_UPLOAD',
      name: 'File Upload',
      description: 'Giới hạn upload file',
      limit: 5,
      window: 1,
      blockDuration: undefined
    },
    {
      key: 'API_GENERAL',
      name: 'General API',
      description: 'Giới hạn API endpoints thông thường',
      limit: 60,
      window: 1,
      blockDuration: undefined
    }
  ])

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleUpdate = (key: string, field: keyof RateLimitConfig, value: number | undefined) => {
    setConfigs(prev =>
      prev.map(config =>
        config.key === key ? { ...config, [field]: value } : config
      )
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/rate-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs })
      })

      if (response.ok) {
        toast({
          title: 'Đã lưu',
          description: 'Cấu hình rate limiting đã được cập nhật'
        })
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể lưu cấu hình'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = (key: string) => {
    // Reset to default values
    const defaults: Record<string, Partial<RateLimitConfig>> = {
      LOGIN: { limit: 5, window: 5, blockDuration: 15 },
      SIGNUP: { limit: 3, window: 60, blockDuration: 60 },
      FORGOT_PASSWORD: { limit: 3, window: 60, blockDuration: 60 },
      TOPUP_REQUEST: { limit: 5, window: 60 },
      CREATE_ORDER: { limit: 10, window: 1 },
      FILE_UPLOAD: { limit: 5, window: 1 },
      API_GENERAL: { limit: 60, window: 1 }
    }

    const defaultConfig = defaults[key]
    if (defaultConfig) {
      setConfigs(prev =>
        prev.map(config =>
          config.key === key ? { ...config, ...defaultConfig } : config
        )
      )
    }
  }

  return (
    <AppShell isAdmin={true}>
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Rate Limiting</h1>
            <p className="text-text-muted mt-2">
              Quản lý giới hạn request để bảo vệ hệ thống khỏi spam và brute force
            </p>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <CardTitle>Cảnh báo</CardTitle>
            </div>
            <CardDescription>
              Thay đổi cấu hình rate limiting có thể ảnh hưởng đến trải nghiệm người dùng.
              Giá trị quá thấp có thể chặn người dùng hợp lệ. Giá trị quá cao có thể không
              bảo vệ đủ khỏi tấn công.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-6">
          {configs.map((config) => (
            <Card key={config.key}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>{config.name}</span>
                      <Badge variant="outline">{config.key}</Badge>
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {config.description}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReset(config.key)}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${config.key}-limit`}>
                      Số lần tối đa
                    </Label>
                    <Input
                      id={`${config.key}-limit`}
                      type="number"
                      min="1"
                      max="1000"
                      value={config.limit}
                      onChange={(e) =>
                        handleUpdate(config.key, 'limit', parseInt(e.target.value) || 1)
                      }
                    />
                    <p className="text-xs text-text-muted">
                      Số request tối đa trong khoảng thời gian
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${config.key}-window`}>
                      Thời gian (phút)
                    </Label>
                    <Input
                      id={`${config.key}-window`}
                      type="number"
                      min="1"
                      max="1440"
                      value={config.window}
                      onChange={(e) =>
                        handleUpdate(config.key, 'window', parseInt(e.target.value) || 1)
                      }
                    />
                    <p className="text-xs text-text-muted">
                      Khoảng thời gian tính rate limit
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${config.key}-block`}>
                      Thời gian chặn (phút)
                    </Label>
                    <Input
                      id={`${config.key}-block`}
                      type="number"
                      min="0"
                      max="1440"
                      value={config.blockDuration || 0}
                      onChange={(e) =>
                        handleUpdate(
                          config.key,
                          'blockDuration',
                          parseInt(e.target.value) || undefined
                        )
                      }
                      placeholder="Không chặn"
                    />
                    <p className="text-xs text-text-muted">
                      Thời gian chặn sau khi vượt giới hạn (0 = không chặn)
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Cấu hình hiện tại:</strong> Cho phép tối đa{' '}
                    <span className="text-brand font-semibold">{config.limit} requests</span>{' '}
                    trong{' '}
                    <span className="text-brand font-semibold">
                      {config.window} phút
                    </span>
                    {config.blockDuration && config.blockDuration > 0 && (
                      <>
                        . Chặn{' '}
                        <span className="text-destructive font-semibold">
                          {config.blockDuration} phút
                        </span>{' '}
                        sau khi vượt giới hạn
                      </>
                    )}
                    .
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lưu ý</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-text-muted">
            <p>
              • <strong>Limit</strong>: Số lần request tối đa được phép
            </p>
            <p>
              • <strong>Window</strong>: Khoảng thời gian tính rate limit (sliding window)
            </p>
            <p>
              • <strong>Block Duration</strong>: Thời gian chặn sau khi vượt giới hạn.
              Để 0 nếu chỉ muốn từ chối request chứ không chặn hoàn toàn
            </p>
            <p>
              • Thay đổi sẽ có hiệu lực ngay lập tức
            </p>
            <p>
              • Rate limit áp dụng theo IP address cho request chưa đăng nhập
            </p>
            <p>
              • Rate limit áp dụng theo User ID cho request đã đăng nhập
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
