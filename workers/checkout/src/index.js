// Shinnslist — Stripe Checkout Worker
// GET ?tier=pro|pro-flipper        ->  Pro/Flipper subscription checkout (302 redirect to Stripe)
// GET ?vertical=<slug>             ->  $1/week per-vertical unlock checkout (price found by lookup_key)
// POST /dfy/checkout  {email, items} -> DFY cart checkout session (bundle + membership trial)
// POST /dfy/confirm   {session_id, items} -> verify payment, record dfy_orders in Supabase
//
// DFY model (James's spec): first order per email = flat $29 bundle for the whole
// cart + membership subscription with 30-day trial ($19/mo, then 75% off listed).
// Later orders: members pay 25% of listed, non-members pay listed.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://shinnslist.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Vary': 'Origin',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SAFE_EMAIL_RE = /^[a-zA-Z0-9@._+-]+$/;
const MAX_ITEMS = 12;
const CAPS = { 'class-action': 7900, grant: 49900 };
const FLOOR_CENTS = 900;
const FIRST_BUNDLE_CENTS = 2900;
const MEMBER_MONTHLY_CENTS = 1900;
const MEMBER_TRIAL_DAYS = 30;
const MEMBER_PAY_PCT = 25;
const MEMBER_LOOKUP_KEY = 'dfy-member-monthly';
const PAID_STATUSES = ['paid', 'filed', 'done'];

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function clampItem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const kind = typeof raw.kind === 'string' ? raw.kind : '';
  if (!(kind in CAPS)) return null;
  const slug = String(raw.slug ?? '').slice(0, 180);
  const name = String(raw.name ?? '').slice(0, 200);
  if (!slug || !name) return null;
  const listed = Number.isFinite(raw.listedCents) ? Math.round(raw.listedCents) : 0;
  const mins = Number.isFinite(raw.estMinutes) ? Math.round(raw.estMinutes) : 0;
  return {
    kind,
    slug,
    name,
    listedCents: Math.min(CAPS[kind], Math.max(FLOOR_CENTS, listed)),
    estMinutes: Math.min(600, Math.max(1, mins)),
    ...(raw.answers && typeof raw.answers === 'object' ? { answers: raw.answers } : {}),
  };
}

function memberPay(listed) {
  return Math.max(100, Math.round((listed * MEMBER_PAY_PCT) / 100));
}

// ---------- Stripe REST helpers ----------
function stripeAuth(env) {
  return { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` };
}

async function stripeJson(env, path, init = {}) {
  const resp = await fetch(`https://api.stripe.com/v1${path}`, {
    ...init,
    headers: { ...stripeAuth(env), ...(init.headers || {}) },
  });
  const data = await resp.json().catch(() => ({}));
  return { ok: resp.ok, status: resp.status, data };
}

// ---------- Supabase helpers ----------
function sbHeaders(env) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function sbCountOrders(env, email) {
  const url = `${env.SUPABASE_URL}/rest/v1/dfy_orders?select=id&email=eq.${encodeURIComponent(email)}&status=in.(paid,filed,done)`;
  const resp = await fetch(url, {
    headers: { ...sbHeaders(env), Prefer: 'count=exact', Range: '0-0' },
  });
  const range = resp.headers.get('Content-Range') || '';
  return parseInt(range.split('/').pop() || '0', 10);
}

async function sbInsertOrders(env, rows) {
  const resp = await fetch(`${env.SUPABASE_URL}/rest/v1/dfy_orders`, {
    method: 'POST',
    headers: { ...sbHeaders(env), Prefer: 'return=minimal' },
    body: JSON.stringify(rows),
  });
  return resp.ok;
}

async function ensureMemberPriceId(env) {
  const lookup = await stripeJson(
    env,
    `/prices?lookup_keys[]=${encodeURIComponent(MEMBER_LOOKUP_KEY)}&limit=1`
  );
  if (lookup.ok && lookup.data.data?.[0]?.id) return lookup.data.data[0].id;

  const product = await stripeJson(env, '/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      name: 'Shinnslist Member — 75% off done-for-you filings',
      'metadata[lookup_key]': MEMBER_LOOKUP_KEY,
    }).toString(),
  });
  if (!product.ok || !product.data.id) {
    throw new Error(`product create failed: ${product.data?.error?.message || 'unknown'}`);
  }
  const price = await stripeJson(env, '/prices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      currency: 'usd',
      unit_amount: String(MEMBER_MONTHLY_CENTS),
      'recurring[interval]': 'month',
      product: product.data.id,
      lookup_key: MEMBER_LOOKUP_KEY,
    }).toString(),
  });
  if (!price.ok || !price.data.id) {
    throw new Error(`price create failed: ${price.data?.error?.message || 'unknown'}`);
  }
  return price.data.id;
}

async function isActiveMember(env, email) {
  const found = await stripeJson(
    env,
    `/customers/search?query=${encodeURIComponent(`email:'${email}'`)}&limit=1`
  );
  const customer = found.data?.data?.[0];
  if (!customer) return false;
  const subs = await stripeJson(
    env,
    `/subscriptions?customer=${customer.id}&status=active&limit=5`
  );
  for (const sub of subs.data?.data ?? []) {
    const full = await stripeJson(env, `/subscriptions/${sub.id}?expand[]=items.data.price`);
    const items = full.data?.items?.data ?? [];
    if (items.some((li) => li.price?.lookup_key === MEMBER_LOOKUP_KEY)) return true;
  }
  return false;
}

// ---------- DFY handlers ----------
async function dfyCheckout(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  const email = String(body?.email ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || !SAFE_EMAIL_RE.test(email)) {
    return json({ error: 'valid email required' }, 400);
  }
  const items = (Array.isArray(body.items) ? body.items : []).map(clampItem).filter(Boolean);
  if (items.length === 0) return json({ error: 'cart is empty' }, 400);
  if (items.length > MAX_ITEMS) return json({ error: 'too many items' }, 400);

  const firstBundle = (await sbCountOrders(env, email)) === 0;
  let isMember = false;
  if (!firstBundle) {
    try {
      isMember = await isActiveMember(env, email);
    } catch {
      isMember = false;
    }
  }

  const appUrl = (env.NEXT_PUBLIC_APP_URL || 'https://shinnslist.com').replace(/\/+$/, '');
  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('customer_email', email);
  params.set('success_url', `${appUrl}/cart?paid=1&session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${appUrl}/cart`);
  params.set('metadata[dfy]', '1');
  params.set('metadata[bundle]', firstBundle ? '1' : '0');
  params.set('metadata[member]', isMember ? '1' : '0');

  if (firstBundle) {
    params.set('line_items[0][quantity]', '1');
    params.set('line_items[0][price_data][currency]', 'usd');
    params.set('line_items[0][price_data][unit_amount]', String(FIRST_BUNDLE_CENTS));
    params.set(
      'line_items[0][price_data][product_data][name]',
      `First-time filing bundle — ${items.length} item${items.length > 1 ? 's' : ''}`
    );
    params.set(
      'line_items[0][price_data][product_data][description]',
      'We prepare and file everything in your cart for one flat price. Filing yourself is always free.'
    );
    // Save the card so the membership subscription can be created after
    // payment (trial_end = +30 days) from the confirm endpoint.
    params.set('payment_intent_data[setup_future_usage]', 'off_session');
  } else {
    items.forEach((it, i) => {
      params.set(`line_items[${i}][quantity]`, '1');
      params.set(`line_items[${i}][price_data][currency]`, 'usd');
      params.set(
        `line_items[${i}][price_data][unit_amount]`,
        String(isMember ? memberPay(it.listedCents) : it.listedCents)
      );
      params.set(
        `line_items[${i}][price_data][product_data][name]`,
        `Done-for-you filing: ${it.name.slice(0, 120)}`
      );
      params.set(
        `line_items[${i}][price_data][product_data][description]`,
        'Convenience fee to prepare and file. Filing yourself is always free.'
      );
    });
  }

  const slugs = items.map((it) => `${it.kind === 'grant' ? 'g' : 'ca'}:${it.slug}`).join(',');
  params.set('metadata[slugs]', slugs.slice(0, 490));

  const resp = await stripeJson(env, '/checkout/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!resp.ok || !resp.data.url) {
    return json(
      { error: 'Failed to create checkout session', detail: resp.data.error?.message || 'unknown' },
      502
    );
  }
  return json({ url: resp.data.url });
}

async function dfyConfirm(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  const sessionId = String(body?.session_id ?? '');
  if (!/^cs_(test|live)_[a-zA-Z0-9]+$/.test(sessionId)) {
    return json({ error: 'invalid session_id' }, 400);
  }
  const session = await stripeJson(env, `/checkout/sessions/${sessionId}`);
  if (!session.ok || !session.data.id) {
    return json({ error: 'session not found', detail: session.data?.error?.message }, 404);
  }
  if (!['paid', 'no_payment_required'].includes(session.data.payment_status)) {
    return json({ error: 'payment not complete', status: session.data.payment_status }, 402);
  }
  if (session.data.metadata?.dfy !== '1') {
    return json({ error: 'not a DFY session' }, 400);
  }
  const email = String(session.data.customer_details?.email ?? '').toLowerCase();
  if (!EMAIL_RE.test(email)) return json({ error: 'missing customer email' }, 400);

  const items = (Array.isArray(body.items) ? body.items : []).map(clampItem).filter(Boolean);
  const sessionSlugs = new Set(
    String(session.data.metadata?.slugs ?? '').split(',').filter(Boolean)
  );
  const wantSlugs = new Set(items.map((it) => `${it.kind === 'grant' ? 'g' : 'ca'}:${it.slug}`));
  const okSlugs =
    sessionSlugs.size > 0 &&
    wantSlugs.size > 0 &&
    [...wantSlugs].every((s) => sessionSlugs.has(s));

  const bundle = session.data.metadata?.bundle === '1';
  const member = session.data.metadata?.member === '1';
  let rows;
  if (bundle) {
    rows = [
      {
        email,
        stripe_session_id: sessionId,
        kind: 'bundle',
        slug: 'first-bundle',
        name: `Bundle — ${items.length} item${items.length > 1 ? 's' : ''}`,
        listed_cents: items.reduce((sum, it) => sum + it.listedCents, 0),
        charged_cents: FIRST_BUNDLE_CENTS,
        status: 'paid',
        items: items,
      },
    ];
  } else {
    rows = items.map((it) => ({
      email,
      stripe_session_id: sessionId,
      kind: it.kind,
      slug: it.slug,
      name: it.name,
      listed_cents: it.listedCents,
      charged_cents: member ? memberPay(it.listedCents) : it.listedCents,
      status: 'paid',
      items: okSlugs ? { answers: it.answers } : null,
    }));
  }
  const inserted = await sbInsertOrders(env, rows);
  if (!inserted) return json({ error: 'order record failed' }, 500);

  // First-bundle buyers get the membership: create the subscription with a
  // 30-day trial on the card saved at checkout (best-effort — the order
  // already succeeded; membership is a bonus, never a blocker).
  let memberFlag = bundle || member;
  if (bundle) {
    try {
      const memberPriceId = await ensureMemberPriceId(env);
      const full = await stripeJson(env, `/checkout/sessions/${sessionId}?expand[]=payment_intent`);
      const paymentMethod = full.data?.payment_intent?.payment_method;
      const customer = full.data?.customer;
      if (paymentMethod && customer && memberPriceId) {
        await stripeJson(env, '/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            customer,
            'items[0][price]': memberPriceId,
            default_payment_method: paymentMethod,
            trial_end: String(Math.floor(Date.now() / 1000) + MEMBER_TRIAL_DAYS * 86400),
            'metadata[dfy]': '1',
            'metadata[plan]': MEMBER_LOOKUP_KEY,
          }).toString(),
        });
      }
    } catch {
      // membership creation is best-effort
    }
  }
  return json({ ok: true, member: memberFlag, items: rows.length });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (request.method === 'POST' && path === '/dfy/checkout') {
      if (!env.STRIPE_SECRET_KEY) return json({ error: 'STRIPE_SECRET_KEY not configured' }, 500);
      if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        return json({ error: 'Supabase not configured' }, 500);
      }
      try {
        return await dfyCheckout(request, env);
      } catch (e) {
        return json({ error: 'internal_error', detail: String(e) }, 500);
      }
    }

    if (request.method === 'POST' && path === '/dfy/confirm') {
      if (!env.STRIPE_SECRET_KEY) return json({ error: 'STRIPE_SECRET_KEY not configured' }, 500);
      if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        return json({ error: 'Supabase not configured' }, 500);
      }
      try {
        return await dfyConfirm(request, env);
      } catch (e) {
        return json({ error: 'internal_error', detail: String(e) }, 500);
      }
    }

    if (request.method === 'POST') {
      return json({ error: 'Not found' }, 404);
    }

    if (path !== '/' && path !== '/api/checkout') {
      return json({ error: 'Not found' }, 404);
    }

    const tier = url.searchParams.get('tier');
    const vertical = url.searchParams.get('vertical');
    const userId = url.searchParams.get('userId');

    if (!env.STRIPE_SECRET_KEY) {
      return json({ error: 'STRIPE_SECRET_KEY not configured' }, 500);
    }
    if (tier && vertical) {
      return json({ error: 'Pick either a tier or a vertical, not both' }, 400);
    }
    if (!tier && !vertical) {
      return json({ error: "Missing param — use ?tier=pro|pro-flipper or ?vertical=<slug>" }, 400);
    }

    const appUrl = (env.NEXT_PUBLIC_APP_URL || 'https://shinnslist.pages.dev').replace(/\/+$/, '');
    const auth = { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` };

    let priceId = null;
    let planKey = tier || `vertical-${vertical}`;
    if (tier) {
      priceId = tier === 'pro-flipper' ? env.STRIPE_FLIPPER_PRICE_ID : env.STRIPE_PRO_PRICE_ID;
      if (!priceId) return json({ error: `No price configured for tier '${tier}'` }, 400);
    } else {
      try {
        const lookup = await fetch(
          `https://api.stripe.com/v1/prices?lookup_keys[]=vertical-${vertical}&expand[]=data.product`,
          { headers: auth }
        );
        const data = await lookup.json();
        if (!lookup.ok || !data.data?.[0]?.id) {
          return json({ error: `Unknown vertical '${vertical}'`, detail: data.error?.message || 'no price found' }, 400);
        }
        priceId = data.data[0].id;
      } catch (e) {
        return json({ error: 'Price lookup failed', detail: String(e) }, 502);
      }
    }

    const params = new URLSearchParams();
    params.set('mode', 'subscription');
    params.set('line_items[0][price]', priceId);
    params.set('line_items[0][quantity]', '1');
    params.set('success_url', `${appUrl}/top-deals?subscribed=1&plan=${planKey}${vertical ? `&v=${vertical}` : ''}`);
    params.set('cancel_url', `${appUrl}/pricing${vertical ? `?v=${vertical}` : ''}`);
    params.set('metadata[tier]', tier || 'free');
    if (vertical) params.set('metadata[vertical]', vertical);
    if (userId) params.set('client_reference_id', userId);

    try {
      const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      const data = await resp.json();

      if (!resp.ok || !data.url) {
        return json(
          { error: 'Failed to create checkout session', detail: data.error?.message || data },
          502
        );
      }

      return new Response(null, {
        status: 302,
        headers: { Location: data.url, ...CORS_HEADERS },
      });
    } catch (e) {
      return json({ error: 'Internal error', detail: String(e) }, 500);
    }
  },
};
