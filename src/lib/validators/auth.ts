import { z } from 'zod';

export const LoginSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

export const RegisterSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string()
        .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
        .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
        .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
        .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 số'),
    confirmPassword: z.string(),
    referralCode: z.string().optional(),
    agreeToTerms: z.boolean().refine((val) => val === true, {
        message: 'Bạn phải đồng ý với điều khoản sử dụng',
    }),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
});

export const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
});
