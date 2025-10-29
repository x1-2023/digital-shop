// In-memory rate limiting (no Redis required)
// For production with high traffic, consider using Redis

console.log('[Rate Limiting] Using in-memory store (no Redis)');

// In-memory store for rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries every minute
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 60000);
}

// Rate limiting function
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ success: boolean; remaining: number; resetTime: number }> {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetTime < now) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      success: true,
      remaining: limit - 1,
      resetTime: now + windowMs,
    };
  }
  
  // Increment counter
  entry.count++;
  const remaining = Math.max(0, limit - entry.count);
  
  return {
    success: entry.count <= limit,
    remaining,
    resetTime: entry.resetTime,
  };
}

// Simple check rate limit (returns true if allowed)
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const result = await rateLimit(key, limit, windowSeconds * 1000);
  return result.success;
}

// Stub cache functions (no-op without Redis)
export async function getCache<T>(_key: string): Promise<T | null> {
  return null;
}

export async function setCache(_key: string, _value: unknown, _ttlSeconds = 3600): Promise<void> {
  // No-op
}

export async function deleteCache(_key: string): Promise<void> {
  // No-op
}



