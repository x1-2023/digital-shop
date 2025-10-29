import { z } from 'zod';

// User validations
export const createUserSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  role: z.enum(['ADMIN', 'BUYER']).optional(),
});

// Wallet validations
export const topupRequestSchema = z.object({
  amountVnd: z.number().min(10000, 'Số tiền tối thiểu là 10,000 VND').max(100000000, 'Số tiền tối đa là 100,000,000 VND'),
  note: z.string().max(500, 'Ghi chú không được quá 500 ký tự').optional(),
});

// Product validations
export const createProductSchema = z.object({
  type: z.enum(['FILE', 'LICENSE', 'APP']),
  name: z.string().min(1, 'Tên sản phẩm không được để trống').max(200, 'Tên sản phẩm không được quá 200 ký tự'),
  slug: z.string().min(1, 'Slug không được để trống').max(100, 'Slug không được quá 100 ký tự'),
  priceAmountVnd: z.number().min(0, 'Giá không được âm'),
  stock: z.number().int().min(0, 'Số lượng không được âm'),
  description: z.string().max(2000, 'Mô tả không được quá 2000 ký tự').optional(),
  images: z.array(z.string()).max(10, 'Tối đa 10 ảnh').optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  active: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial();

// Order validations
export const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1, 'Product ID không được để trống'),
    quantity: z.number().int().min(1, 'Số lượng phải lớn hơn 0'),
  })).min(1, 'Đơn hàng phải có ít nhất 1 sản phẩm'),
});

export const payWithWalletSchema = z.object({
  orderId: z.string().min(1, 'Order ID không được để trống'),
});

// Admin validations
export const approveDepositSchema = z.object({
  depositId: z.string().min(1, 'Deposit ID không được để trống'),
  adminNote: z.string().max(500, 'Ghi chú admin không được quá 500 ký tự').optional(),
});

export const rejectDepositSchema = z.object({
  depositId: z.string().min(1, 'Deposit ID không được để trống'),
  adminNote: z.string().min(1, 'Lý do từ chối không được để trống').max(500, 'Lý do từ chối không được quá 500 ký tự'),
});

// Settings validations
export const updateSettingsSchema = z.object({
  paymentMethods: z.object({
    manual: z.boolean(),
    tpbank: z.boolean(),
    momo: z.boolean(),
    crypto: z.boolean(),
  }).optional(),
  bankInfo: z.object({
    bank: z.string().max(100, 'Tên ngân hàng không được quá 100 ký tự'),
    account: z.string().max(50, 'Số tài khoản không được quá 50 ký tự'),
    name: z.string().max(100, 'Tên chủ tài khoản không được quá 100 ký tự'),
    instructions: z.string().max(1000, 'Hướng dẫn không được quá 1000 ký tự'),
  }).optional(),
  topupRules: z.object({
    minVnd: z.number().min(1000, 'Số tiền tối thiểu phải lớn hơn 1,000 VND'),
    maxVnd: z.number().max(1000000000, 'Số tiền tối đa không được quá 1 tỷ VND'),
  }).optional(),
  tpbankConfig: z.object({
    enabled: z.boolean(),
    apiUrl: z.string().url('API URL không hợp lệ').optional(),
    token: z.string().optional(),
    amountTolerance: z.number().min(0, 'Sai số không được âm').max(10000, 'Sai số không được quá 10,000 VND'),
  }).optional(),
  uiTexts: z.record(z.string(), z.string()).optional(),
});

// Common response schemas
export const errorResponseSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.any().optional(),
});

export const successResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  message: z.string().optional(),
});



