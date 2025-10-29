/**
 * Cryptographically Secure Random Generator
 * Replaces Math.random() for security-critical operations
 */

import { randomBytes } from 'crypto';

/**
 * Generate cryptographically secure random string
 * @param length - Length of string
 * @param charset - Characters to use (default: alphanumeric lowercase)
 * @returns Random string
 */
export function generateSecureRandomString(
  length: number = 16,
  charset: string = 'abcdefghijklmnopqrstuvwxyz0123456789'
): string {
  const randomValues = randomBytes(length);
  let result = '';

  for (let i = 0; i < length; i++) {
    result += charset.charAt(randomValues[i] % charset.length);
  }

  return result;
}

/**
 * Generate secure license key
 * Format: XXXX-XXXX-XXXX-XXXX
 */
export function generateLicenseKey(): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = 4;
  const segmentLength = 4;

  const parts: string[] = [];
  for (let i = 0; i < segments; i++) {
    parts.push(generateSecureRandomString(segmentLength, charset));
  }

  return parts.join('-');
}

/**
 * Generate secure token for password reset, email verification, etc.
 * @param length - Token length in bytes (default: 32)
 * @returns Hex string token
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Generate secure random number in range [min, max)
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (exclusive)
 * @returns Random number
 */
export function generateSecureRandomNumber(min: number, max: number): number {
  const range = max - min;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const randomValue = randomBytes(bytesNeeded).readUIntBE(0, bytesNeeded);

  return min + (randomValue % range);
}

/**
 * Generate secure random alphanumeric ID
 * Suitable for order IDs, transaction IDs, etc.
 */
export function generateOrderId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = generateSecureRandomString(8, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
  return `${timestamp}-${random}`;
}
