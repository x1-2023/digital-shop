/**
 * Simple In-Memory Rate Limiter
 * Suitable for single-instance deployments (e.g., Docker container)
 * For multi-instance, use Redis (e.g., @upstash/ratelimit)
 */

interface RateLimitConfig {
  interval: number; // Time window in ms
  uniqueTokenPerInterval: number; // Max unique users per window
}

export class RateLimiter {
  private tokens: Map<string, number[]>;
  private interval: number;

  constructor(config: RateLimitConfig) {
    this.tokens = new Map();
    this.interval = config.interval;
  }

  /**
   * Check if action is allowed
   * @param key - Unique identifier (e.g., IP or User ID)
   * @param limit - Max requests allowed in the interval
   * @returns true if allowed, false if limited
   */
  async check(key: string, limit: number): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - this.interval;

    let timestamps = this.tokens.get(key) || [];

    // Filter out old timestamps
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= limit) {
      this.tokens.set(key, timestamps); // Update cleanup
      return false;
    }

    timestamps.push(now);
    this.tokens.set(key, timestamps);

    // Periodic cleanup (naive/lazy) - could be improved
    if (this.tokens.size > 10000) {
      this.tokens.clear(); // Safety valve to prevent memory leaks
    }

    return true;
  }
}

// Global instance for API routes
export const apiRateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute window by default
  uniqueTokenPerInterval: 500
});
