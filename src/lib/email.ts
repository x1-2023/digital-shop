// Email sending utilities
// Integrated with Resend API

import { Resend } from 'resend';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// Initialize Resend
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

/**
 * Send email using Resend API
 * Falls back to console logging if RESEND_API_KEY is not configured
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { to, subject, text, html } = options;

  // If Resend is not configured, log to console
  if (!resend) {
    console.log('📧 [Email] Resend not configured. Email content:');
    console.log(`   From: ${FROM_EMAIL}`);
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Text: ${text || '(no text)'}`);
    console.log(`   HTML: ${html ? '(HTML content provided)' : '(no HTML)'}`);
    console.log('');
    console.log('ℹ️  To enable email sending, add RESEND_API_KEY to .env');
    return true; // Return true in dev so app doesn't break
  }

  // Send email via Resend
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      text: text || '',
      html: html || '',
    });

    if (error) {
      console.error('❌ Failed to send email via Resend:', error);
      return false;
    }

    console.log('✅ Email sent successfully via Resend:', data?.id);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<boolean> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password/${resetToken}`;

  const subject = 'Đặt lại mật khẩu - WebMMO';
  
  const text = `
Xin chào,

Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.

Vui lòng nhấp vào link sau để đặt lại mật khẩu:
${resetUrl}

Link này sẽ hết hạn sau 1 giờ.

Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.

Trân trọng,
WebMMO Team
  `;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Đặt lại mật khẩu</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 32px; margin: 0; font-weight: bold;">
                🔐 Đặt lại mật khẩu
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Xin chào,
              </p>
              <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.
              </p>
              <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Vui lòng nhấp vào nút bên dưới để đặt lại mật khẩu:
              </p>
              
              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: bold; box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);">
                      Đặt lại mật khẩu
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 30px 0 0; padding-top: 20px; border-top: 1px solid #334155;">
                Hoặc copy link sau vào trình duyệt:
              </p>
              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 10px 0 0; word-break: break-all;">
                ${resetUrl}
              </p>
              
              <!-- Warning -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                <tr>
                  <td style="background-color: #1e293b; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px;">
                    <p style="color: #fbbf24; font-size: 14px; line-height: 1.6; margin: 0;">
                      ⚠️ <strong>Lưu ý:</strong> Link này sẽ hết hạn sau 1 giờ.
                    </p>
                    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 10px 0 0;">
                      Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 30px 40px; text-align: center; border-top: 1px solid #334155;">
              <p style="color: #64748b; font-size: 14px; margin: 0 0 10px;">
                Trân trọng,<br>
                <strong style="color: #94a3b8;">WebMMO Team</strong>
              </p>
              <p style="color: #475569; font-size: 12px; margin: 10px 0 0;">
                © 2025 WebMMO. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to: email,
    subject,
    text,
    html,
  });
}

/**
 * Send email verification email (for future implementation)
 */
export async function sendVerificationEmail(
  email: string,
  verificationToken: string
): Promise<boolean> {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/verify-email/${verificationToken}`;

  const subject = 'Xác thực email - WebMMO';
  
  const text = `
Xin chào,

Cảm ơn bạn đã đăng ký tài khoản tại WebMMO!

Vui lòng nhấp vào link sau để xác thực email của bạn:
${verifyUrl}

Link này sẽ hết hạn sau 24 giờ.

Trân trọng,
Digital Shop Team
  `;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xác thực email</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 32px; margin: 0;">✉️ Xác thực email</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                Cảm ơn bạn đã đăng ký tài khoản tại Digital Shop!
              </p>
              <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                Vui lòng nhấp vào nút bên dưới để xác thực email của bạn:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${verifyUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: bold;">
                      Xác thực email
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to: email,
    subject,
    text,
    html,
  });
}
