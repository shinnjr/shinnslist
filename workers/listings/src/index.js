// Shinnslist — Supabase proxy / listings Worker
// Replaces src/app/api/listings (Next.js API route removed during static build).
//   GET /?lat&lng&radius&limit  ->  runs nearby_listings RPC, returns { listings }
//
// SECURITY:
//  - The public listings read runs against the RPC with the service role (read-only
//    server-side). It is rate limited and its params are clamped.
//  - Generic /rest/v1/*, /rpc/*, /auth/v1/* passthrough is available ONLY to
//    authenticated callers who pass their own user JWT (Authorization header), or
//    to internal callers who present the ADMIN_API_SECRET. The service role key is
//    NEVER auto-injected for arbitrary public requests.

const ALLOWED_ORIGIN = 'https://shinnslist.com';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'apikey, Authorization, Content-Type, x-admin-secret, x-internal-secret',
  'Vary': 'Origin',
};

// Sliding-window in-memory rate limiter (per-isolate).
const buckets = new Map();
function rateLimit(ip, { limit, windowSeconds }) {
  const now = Date.now();
  const key = ip || 'unknown';
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    if (buckets.size > 10000) {
      const t = now;
      for (const [k, v] of buckets) if (v.resetAt <= t) buckets.delete(k);
    }
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }
  b.count += 1;
  if (b.count > limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  return { ok: true, remaining: limit - b.count, retryAfter: 0 };
}

function clientIp(request) {
  const cf = request.headers.get('CF-Connecting-IP');
  if (cf) return cf;
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return 'unknown';
}

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...extraHeaders },
  });
}

function safeSecretEq(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function serviceAuth(env) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };
}

function clampInt(value, fallback, min, max) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function mapListing(row) {
  return {
    id: row.id,
    source: row.source,
    sourceUrl: row.source_url || '',
    title: row.title,
    description: row.description || '',
    photos: row.photos || [],
    price: parseFloat(String(row.price || 0)),
    estimatedValue: row.estimated_value ? parseFloat(String(row.estimated_value)) : null,
    category: row.category || '',
    condition: row.condition || 'unknown',
    flags: row.flags || [],
    location: {
      lat: row.lat ?? null,
      lng: row.lng ?? null,
      city: row.city || 'Denver',
      state: row.state || 'CO',
    },
    postedAt: row.posted_at ? new Date(row.posted_at).getTime() : null,
    expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : null,
  };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (!supabaseUrl) {
      return json({ error: 'Supabase not configured (NEXT_PUBLIC_SUPABASE_URL)' }, 500);
    }

    // ---- Public listings endpoint ----
    if (path === '/' || path === '/api/listings') {
      // 60 req/min/IP for public scraping.
      const rl = rateLimit(clientIp(request), { limit: 60, windowSeconds: 60 });
      const rlHeaders = {
        'X-RateLimit-Remaining': String(rl.remaining),
        ...(rl.retryAfter ? { 'Retry-After': String(rl.retryAfter) } : {}),
      };
      if (!rl.ok) {
        return json({ error: 'Too many requests' }, 429, rlHeaders);
      }
      if (request.method !== 'GET') {
        return json({ error: 'Method not allowed' }, 405, rlHeaders);
      }
      if (!env.SUPABASE_SERVICE_ROLE_KEY) {
        return json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, 500, rlHeaders);
      }

      const lat = clampInt(url.searchParams.get('lat'), 39.7392, -90, 90);
      const lng = clampInt(url.searchParams.get('lng'), -104.9903, -180, 180);
      const radius = clampInt(url.searchParams.get('radius'), 25, 1, 200);
      const limit = clampInt(url.searchParams.get('limit'), 50, 1, 100);

      try {
        const resp = await fetch(`${supabaseUrl}/rest/v1/rpc/nearby_listings`, {
          method: 'POST',
          headers: serviceAuth(env),
          body: JSON.stringify({ lng, lat, radius_miles: radius, result_limit: limit }),
        });
        const data = await resp.json();
        if (!resp.ok) {
          return json({ error: 'Failed to fetch listings', detail: data }, 502, rlHeaders);
        }
        return json({ listings: (data || []).map(mapListing) }, 200, rlHeaders);
      } catch (e) {
        return json({ error: 'Internal server error', detail: String(e) }, 500, rlHeaders);
      }
    }

    // ---- Generic Supabase passthrough (REST / RPC / Auth) ----
    // Must NOT auto-escalate to the service role for public, unauthenticated requests.
    if (path.startsWith('/rest/') || path.startsWith('/rpc/') || path.startsWith('/auth/')) {
      const callerAuth = request.headers.get('Authorization');
      const internalSecret = request.headers.get('x-internal-secret');
      const isInternal = env.ADMIN_API_SECRET && safeSecretEq(internalSecret, env.ADMIN_API_SECRET);

      // Public callers must supply their own user JWT.
      if (!callerAuth && !isInternal) {
        return json({ error: 'Unauthorized: provide an Authorization token' }, 401);
      }

      const target = `${supabaseUrl}${url.pathname}${url.search}`;
      const headers = new Headers(request.headers);
      if (isInternal) {
        // Internal service-to-service calls may use the service role.
        headers.set('apikey', env.SUPABASE_SERVICE_ROLE_KEY);
        headers.set('Authorization', `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`);
      } else {
        // Forward the caller's own (user) JWT unchanged — never inject service role.
        headers.set('apikey', callerAuth.replace(/^Bearer\s+/i, ''));
      }
      const resp = await fetch(target, {
        method: request.method,
        headers,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      });
      const body = await resp.arrayBuffer();
      return new Response(body, {
        status: resp.status,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': resp.headers.get('Content-Type') || 'application/json',
        },
      });
    }

    return json({ error: 'Not found' }, 404);
  },
};
