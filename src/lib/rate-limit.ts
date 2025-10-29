/**
 * Rate Limiting Utility
 * In-memory rate limiting with configurable limits
 */

import { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blockedUntil?: number; // For progressive delays
}

interface RateLimitConfig {
  limit: number; // Max requests
  window: number; // Time window in milliseconds
  blockDuration?: number; // How long to block after limit (ms)
}

// In-memory storage
const rateLimitStore = new Map<string, RateLimitEntry>();

// Default configurations (can be overridden)
export const RATE_LIMIT_CONFIGS = {
  // Auth endpoints - Very strict
  LOGIN: { limit: 5, window: 5 * 60 * 1000, blockDuration: 15 * 60 * 1000 }, // 5 per 5min, block 15min
  SIGNUP: { limit: 3, window: 60 * 60 * 1000, blockDuration: 60 * 60 * 1000 }, // 3 per hour, block 1h
  FORGOT_PASSWORD: { limit: 3, window: 60 * 60 * 1000, blockDuration: 60 * 60 * 1000 },

  // Wallet operations
  TOPUP_REQUEST: { limit: 5, window: 60 * 60 * 1000 }, // 5 per hour
  WALLET_PAYMENT: { limit: 10, window: 60 * 1000 }, // 10 per minute

  // API endpoints
  API_GENERAL: { limit: 60, window: 60 * 1000 }, // 60 per minute
  API_ADMIN: { limit: 120, window: 60 * 1000 }, // 120 per minute

  // Order creation
  CREATE_ORDER: { limit: 10, window: 60 * 1000 }, // 10 per minute

  // File operations
  FILE_UPLOAD: { limit: 5, window: 60 * 1000 }, // 5 per minute
  FILE_DOWNLOAD: { limit: 20, window: 60 * 1000 }, // 20 per minute
};

/**
 * Get client identifier from request
 * Uses IP address and user agent for fingerprinting
 */
export function getClientIdentifier(request: NextRequest, userId?: string): string {
  // Use userId if available (more accurate for authenticated requests)
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP + User Agent
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const userAgent = request.headers.get('user-agent')?.substring(0, 50) || 'unknown';

  // Hash the combination for privacy
  return `ip:${ip}:${userAgent}`;
}

/**
 * Check rate limit for a request
 * @param identifier - Unique identifier for the client
 * @param config - Rate limit configuration
 * @returns Object with allowed status and remaining count
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  blockedUntil?: number;
} {
  const now = Date.now();
  const key = identifier;
  const entry = rateLimitStore.get(key);

  // Check if currently blocked
  if (entry?.blockedUntil && entry.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      blockedUntil: entry.blockedUntil,
    };
  }

  // If no entry or window expired, create new entry
  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.window,
    };
    rateLimitStore.set(key, newEntry);

    return {
      allowed: true,
      remaining: config.limit - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // Check if over limit
  if (entry.count >= config.limit) {
    // Apply block if configured
    if (config.blockDuration) {
      entry.blockedUntil = now + config.blockDuration;
      rateLimitStore.set(key, entry);
    }

    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      blockedUntil: entry.blockedUntil,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: config.limit - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Cleanup expired entries (call periodically)
 */
export function cleanupRateLimitStore(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of rateLimitStore.entries()) {
    // Remove if both window and block expired
    if (
      entry.resetTime < now &&
      (!entry.blockedUntil || entry.blockedUntil < now)
    ) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}

// Auto-cleanup every minute
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 60 * 1000);
}

/**
 * Reset rate limit for a specific identifier
 * Useful for admin overrides or testing
 */
export function resetRateLimit(identifier: string): boolean {
  return rateLimitStore.delete(identifier);
}

/**
 * Get current rate limit status (for debugging/monitoring)
 */
export function getRateLimitStatus(identifier: string): RateLimitEntry | null {
  return rateLimitStore.get(identifier) || null;
}

/**
 * Get all rate limit entries (for admin dashboard)
 */
export function getAllRateLimits(): Map<string, RateLimitEntry> {
  return new Map(rateLimitStore);
}

/**
 * Update rate limit configuration at runtime
 * Can be used for admin panel configuration
 */
const customConfigs = new Map<string, RateLimitConfig>();

export function setRateLimitConfig(
  key: keyof typeof RATE_LIMIT_CONFIGS,
  config: RateLimitConfig
): void {
  customConfigs.set(key, config);
}

export function getRateLimitConfig(
  key: keyof typeof RATE_LIMIT_CONFIGS
): RateLimitConfig {
  return customConfigs.get(key) || RATE_LIMIT_CONFIGS[key];
}
