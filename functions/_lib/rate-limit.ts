// In-memory sliding-window rate limiter for Cloudflare Pages Functions.
//
// NOTE: State is per-isolate. Cloudflare keeps each isolate's Map private, so
// this guards against burst abuse within a single runtime instance but is NOT
// a global quota. The real global enforcement is the Cloudflare WAF (Rate
// Limiting Rules). This limiter is a lightweight first line of defense —
// cheap, zero-dependency, and consistent with workers/listings.

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();
const MAX_ENTRIES = 10_000;

/** Best-effort client IP. CF-Connecting-IP is set by Cloudflare and trusted. */
export function clientIp(request: Request): string {
  const cf = request.headers.get('CF-Connecting-IP');
  if (cf) return cf.trim();
  const xff = request.headers.get('x-forwarded-for');
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
  request: Request,
  opts: { limit: number; windowSeconds: number; keyPrefix: string }
): RateLimitResult {
  const now = Date.now();
  const windowMs = opts.windowSeconds * 1000;
  const key = `${opts.keyPrefix}:${clientIp(request)}`;

  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    // opportunistic cleanup when the map is large
    if (store.size >= MAX_ENTRIES) {
      const expired = [...store.entries()].filter(([, b]) => b.resetAt <= now);
      expired.forEach(([k]) => store.delete(k));
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

/** 429 response with standard rate-limit headers. */
export function rateLimitedResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({ error: 'rate_limited', retryAfterSeconds: result.retryAfterSeconds }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfterSeconds),
        'X-RateLimit-Limit': 'applied',
        'X-RateLimit-Remaining': '0',
      },
    }
  );
}
