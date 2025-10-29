import jwt from 'jsonwebtoken';

const PRIVATE_KEY = process.env.LICENSE_PRIVATE_KEY!;
const PUBLIC_KEY = process.env.LICENSE_PUBLIC_KEY!;

export interface LicensePayload {
  productId: string;
  orderId: string;
  email: string;
  issuedAt: number;
  expiresAt?: number;
}

export function generateLicense(payload: LicensePayload): string {
  if (!PRIVATE_KEY) {
    throw new Error('LICENSE_PRIVATE_KEY not configured');
  }

  const token = jwt.sign(payload, PRIVATE_KEY, {
    algorithm: 'RS256',
    expiresIn: payload.expiresAt ? Math.floor((payload.expiresAt - payload.issuedAt) / 1000) : '1y',
  });

  return token;
}

export function verifyLicense(token: string): LicensePayload | null {
  if (!PUBLIC_KEY) {
    throw new Error('LICENSE_PUBLIC_KEY not configured');
  }

  try {
    const decoded = jwt.verify(token, PUBLIC_KEY, {
      algorithms: ['RS256'],
    }) as LicensePayload;

    return decoded;
  } catch (error) {
    console.error('License verification failed:', error);
    return null;
  }
}

export function generateLicenseCode(): string {
  // Generate a simple license code (can be customized)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function createLicenseForOrder(
  productId: string,
  orderId: string,
  email: string,
  expiresInDays?: number
): { code: string; jwt: string } {
  const now = Date.now();
  const expiresAt = expiresInDays ? now + (expiresInDays * 24 * 60 * 60 * 1000) : undefined;

  const payload: LicensePayload = {
    productId,
    orderId,
    email,
    issuedAt: now,
    expiresAt,
  };

  const code = generateLicenseCode();
  const jwtToken = generateLicense(payload);

  return {
    code,
    jwt: jwtToken,
  };
}



