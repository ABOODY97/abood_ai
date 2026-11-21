export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export class SlidingWindowRateLimiter {
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly buckets = new Map<string, number[]>();

  constructor(maxRequests = 30, windowMs = 60_000) {
    this.maxRequests = Math.max(1, maxRequests);
    this.windowMs = Math.max(1_000, windowMs);
  }

  check(key: string, now = Date.now()): RateLimitResult {
    const windowStart = now - this.windowMs;
    const existing = this.buckets.get(key) ?? [];
    const recent = existing.filter((ts) => ts > windowStart);

    if (recent.length >= this.maxRequests) {
      const oldestInWindow = recent[0];
      const retryMs = Math.max(1_000, oldestInWindow + this.windowMs - now);
      this.buckets.set(key, recent);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.ceil(retryMs / 1000),
      };
    }

    recent.push(now);
    this.buckets.set(key, recent);

    // Opportunistic cleanup to keep memory bounded under high unique IP traffic
    if (this.buckets.size > 2000) {
      for (const [k, timestamps] of this.buckets.entries()) {
        if (timestamps.length === 0 || timestamps[timestamps.length - 1] <= windowStart) {
          this.buckets.delete(k);
        }
      }
    }

    return {
      allowed: true,
      remaining: Math.max(0, this.maxRequests - recent.length),
      retryAfterSeconds: 0,
    };
  }
}
