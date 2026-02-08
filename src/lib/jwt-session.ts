/**
 * JWT Session Management
 * Replaces plaintext session cookies with signed JWT tokens
 */

import jwt from 'jsonwebtoken';

function getSecret() {
  // SSO: Prefer SSO_JWT_SECRET for ecosystem-wide auth
  const secret = process.env.SSO_JWT_SECRET || process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET;

  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
      throw new Error(
        'SSO_JWT_SECRET must be set and at least 32 characters long. ' +
        'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
      );
    }
    return 'default-dev-secret-do-not-use-in-production-at-least-32-chars';
  }
  return secret;
}

export interface SessionData {
  userId: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'USER';
  aud?: string[]; // SSO: audience - which apps this token is valid for
  token_version?: number; // SSO: for token revocation
  iat?: number;
  exp?: number;
}

export interface SessionPayload extends SessionData {
  iat: number;
  exp: number;
  iss: string;
  aud: string[];
  token_version: number;
}

/**
 * Create a signed JWT token for session
 * @param data - User session data
 * @param expiresIn - Token expiry (default: 7 days)
 * @returns Signed JWT token
 */
export function createSessionToken(
  data: SessionData,
  expiresIn: string | number = '7d'
): string {
  try {
    const token = jwt.sign(
      {
        userId: data.userId,
        email: data.email,
        role: data.role,
        aud: data.aud || ['shop', 'mail'], // SSO: default both apps
        token_version: data.token_version || 0,
      },
      getSecret(),
      {
        expiresIn: expiresIn as any,
        issuer: '0xf5-ecosystem',
        algorithm: 'HS256',
      } as jwt.SignOptions
    );

    return token;
  } catch (error) {
    console.error('Error creating session token:', error);
    throw new Error('Failed to create session token');
  }
}

/**
 * Verify and decode a JWT session token
 * @param token - JWT token string
 * @returns Decoded session data or null if invalid
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    // SSO: Accept both old issuer and new ecosystem issuer for backward compatibility
    let decoded: SessionPayload | null = null;

    try {
      decoded = jwt.verify(token, getSecret(), {
        issuer: '0xf5-ecosystem',
        algorithms: ['HS256'],
      }) as SessionPayload;
    } catch {
      // Fallback: try old issuer for tokens issued before SSO migration
      decoded = jwt.verify(token, getSecret(), {
        issuer: 'digital-shop',
        algorithms: ['HS256'],
      }) as SessionPayload;
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log('Session token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.log('Invalid session token');
    } else {
      console.error('Error verifying session token:', error);
    }
    return null;
  }
}

/**
 * Refresh a session token (extend expiry)
 * @param token - Current JWT token
 * @param expiresIn - New expiry (default: 7 days)
 * @returns New JWT token or null if current token invalid
 */
export function refreshSessionToken(
  token: string,
  expiresIn: string = '7d'
): string | null {
  const decoded = verifySessionToken(token);

  if (!decoded) {
    return null;
  }

  // Create new token with same data but new expiry
  return createSessionToken(
    {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      aud: decoded.aud,
      token_version: decoded.token_version,
    },
    expiresIn
  );
}

/**
 * Decode token without verification (use carefully!)
 * Useful for debugging or getting token data without validating signature
 * @param token - JWT token
 * @returns Decoded payload or null
 */
export function decodeSessionToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.decode(token) as SessionPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Check if token is expired (without verification)
 * @param token - JWT token
 * @returns true if expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeSessionToken(token);

  if (!decoded || !decoded.exp) {
    return true;
  }

  return Date.now() >= decoded.exp * 1000;
}

/**
 * Get token expiry time
 * @param token - JWT token
 * @returns Expiry timestamp (ms) or null
 */
export function getTokenExpiry(token: string): number | null {
  const decoded = decodeSessionToken(token);

  if (!decoded || !decoded.exp) {
    return null;
  }

  return decoded.exp * 1000;
}
