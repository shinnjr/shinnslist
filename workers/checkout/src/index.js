// Shinnslist — Stripe Checkout Worker
// Replaces src/app/api/checkout (Next.js API route removed during static build).
// GET /?tier=pro|pro-flipper  ->  creates a Stripe Checkout Session and 302-redirects to it.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function cors() {
  return { ...CORS_HEADERS };
}
function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra, ...CORS_HEADERS },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // Allow being served at either the bare domain or /api/checkout path.
    const path = url.pathname.replace(/\/+$/, '') || '/';
    if (path !== '/' && path !== '/api/checkout') {
      return json({ error: 'Not found' }, 404, cors());
    }

    const tier = url.searchParams.get('tier') || 'pro';
    const userId = url.searchParams.get('userId');

    if (!env.STRIPE_SECRET_KEY) {
      return json({ error: 'STRIPE_SECRET_KEY not configured' }, 500, cors());
    }

    const priceId =
      tier === 'pro-flipper' ? env.STRIPE_FLIPPER_PRICE_ID : env.STRIPE_PRO_PRICE_ID;
    if (!priceId) {
      return json({ error: `No price configured for tier '${tier}'` }, 400, cors());
    }

    const appUrl = (env.NEXT_PUBLIC_APP_URL || 'https://shinnslist.pages.dev').replace(/\/+$/, '');

    const params = new URLSearchParams();
    params.set('mode', 'subscription');
    params.set('line_items[0][price]', priceId);
    params.set('line_items[0][quantity]', '1');
    params.set('success_url', `${appUrl}/welcome`);
    params.set('cancel_url', `${appUrl}/pricing`);
    if (userId) params.set('client_reference_id', userId);

    try {
      const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
      const data = await resp.json();

      if (!resp.ok || !data.url) {
        return json(
          { error: 'Failed to create checkout session', detail: data.error?.message || data },
          502,
          cors()
        );
      }

      return new Response(null, {
        status: 302,
        headers: { Location: data.url, ...CORS_HEADERS },
      });
    } catch (e) {
      return json({ error: 'Internal error', detail: String(e) }, 500, cors());
    }
  },
};
