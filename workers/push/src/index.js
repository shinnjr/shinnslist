// Shinnslist — Push Notifications Worker
// Replaces src/app/api/push (Next.js API route removed during static build).
//   POST { action: 'subscribe'|'unsubscribe'|'send', subscription, ... }
//   GET  -> { ok: true }
//
// Security: subscriptions are in-memory (per-isolate). The VAPID private key
// must come from the Worker secret (VAPID_PRIVATE_KEY). There is deliberately
// NO hardcoded fallback — a missing key fails closed. `send` requires the
// ADMIN_API_SECRET header. CORS is restricted to the site origin.

import webpush from 'web-push';

// In-memory subscription store (per-isolate).
const subscriptions = [];

const ALLOWED_ORIGIN = 'https://shinnslist.com';

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

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-admin-secret',
  'Vary': 'Origin',
};

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

function getWebPush(env) {
  const publicKey =
    env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    'BG80yZAIdz0maw1UoiUebr8ErFrpj8DTxaLMdEjgdgi45hEzT8y6ISnkpt-H-ClLr1OyvzAT54DRi7y6Nq1HnS0';
  const privateKey = env.VAPID_PRIVATE_KEY;
  if (!privateKey) throw new Error('VAPID_PRIVATE_KEY is not configured');
  webpush.setVapidDetails('https://shinnslist.com', publicKey, privateKey);
  return webpush;
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    if (path !== '/' && path !== '/api/push') {
      return json({ error: 'Not found' }, 404);
    }

    // Rate limit all push traffic (30 req/min/IP).
    const rl = rateLimit(clientIp(request), { limit: 30, windowSeconds: 60 });
    const rlHeaders = {
      'X-RateLimit-Remaining': String(rl.remaining),
      ...(rl.retryAfter ? { 'Retry-After': String(rl.retryAfter) } : {}),
    };
    if (!rl.ok) {
      return json({ error: 'Too many requests' }, 429, rlHeaders);
    }

    if (request.method === 'GET') {
      // Don't leak subscriber count publicly.
      return json({ ok: true }, 200, rlHeaders);
    }
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, rlHeaders);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400, rlHeaders);
    }
    const { action, subscription } = body || {};

    try {
      if (action === 'subscribe' || action === 'unsubscribe') {
        const endpoint = typeof subscription?.endpoint === 'string' ? subscription.endpoint : null;
        if (!endpoint || !/^https:\/\//.test(endpoint) || endpoint.length > 2048) {
          return json({ error: 'Invalid subscription' }, 400, rlHeaders);
        }
        if (action === 'subscribe') {
          const exists = subscriptions.find((s) => s.endpoint === endpoint);
          if (!exists) subscriptions.push(subscription);
        } else {
          const idx = subscriptions.findIndex((s) => s.endpoint === endpoint);
          if (idx > -1) subscriptions.splice(idx, 1);
        }
        return json({ success: true, count: subscriptions.length }, 200, rlHeaders);
      }

      if (action === 'send') {
        // Privileged — require shared admin secret.
        if (!env.ADMIN_API_SECRET) {
          return json({ error: 'Not configured' }, 503, rlHeaders);
        }
        if (!safeSecretEq(request.headers.get('x-admin-secret'), env.ADMIN_API_SECRET)) {
          return json({ error: 'Unauthorized' }, 401, rlHeaders);
        }
        const wp = getWebPush(env);
        const { title, body: notifBody, url: notifUrl } = body;
        const payload = JSON.stringify({
          title: title || '🔥 New Deal!',
          body: notifBody || 'A new deal just dropped.',
          url: notifUrl || '/',
        });
        const results = await Promise.allSettled(
          subscriptions.map((sub) =>
            wp.sendNotification(sub, payload).catch((err) => {
              if (err.statusCode === 410 || err.statusCode === 404) {
                const idx = subscriptions.indexOf(sub);
                if (idx > -1) subscriptions.splice(idx, 1);
              }
            })
          )
        );
        const succeeded = results.filter((r) => r.status === 'fulfilled').length;
        return json({ success: true, sent: succeeded, total: subscriptions.length }, 200, rlHeaders);
      }

      return json({ error: 'Invalid action' }, 400, rlHeaders);
    } catch (err) {
      const msg = String(err && err.message ? err.message : err);
      return json(
        { error: msg },
        msg === 'VAPID_PRIVATE_KEY is not configured' ? 503 : 500,
        rlHeaders
      );
    }
  },
};
