import type { NextRequest, NextResponse } from 'next/server';

/**
 * Sliding-window in-memory rate limiter for edge API routes.
 *
 * NOTE: This state is per-isolate. On Cloudflare Pages / Workers each isolate
 * keeps its own Map, so this guards against burst abuse within a single
 * runtime instance but is NOT a global quota. For strict global rate limiting,
 * enforce limits in the Cloudflare WAF (Rate Limiting Rules) or use Cloudflare
 * KV / Durable Objects. This limiter is a lightweight first line of defense.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

// Simple FIFO cleanup so the map can't grow unbounded.
const store = new Map<string, Bucket>();
const MAX_ENTRIES = 10_000;

function ipFrom(req: NextRequest): string {
  const cf = req.headers.get('CF-Connecting-IP');
  if (cf) return cf.trim();
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0].trim();
    if (first) return first;
  }
  return 'unknown';
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(
  req: NextRequest,
  opts: { limit: number; windowSeconds: number; keyPrefix: string }
): RateLimitResult {
  const now = Date.now();
  const windowMs = opts.windowSeconds * 1000;
  const key = `${opts.keyPrefix}:${ipFrom(req)}`;

  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    if (!existing) {
      // opportunistic cleanup
      if (store.size >= MAX_ENTRIES) {
        const expired = [...store.entries()].filter(([, b]) => b.resetAt <= now);
        expired.forEach(([k]) => store.delete(k));
      }
    }
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: opts.limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  if (existing.count > opts.limit) {
    return { ok: false, remaining: 0, retryAfterSeconds };
  }
  return { ok: true, remaining: opts.limit - existing.count, retryAfterSeconds: 0 };
}

/** Attach rate-limit headers to a response. */
export function withRateLimitHeaders(
  res: NextResponse,
  result: RateLimitResult
): NextResponse {
  res.headers.set('RateLimit-Limit', String(result.retryAfterSeconds > 0 ? 0 : 'applied'));
  res.headers.set('X-RateLimit-Limit', 'applied');
  res.headers.set('X-RateLimit-Remaining', String(result.remaining));
  if (result.retryAfterSeconds > 0) {
    res.headers.set('Retry-After', String(result.retryAfterSeconds));
  }
  return res;
}
