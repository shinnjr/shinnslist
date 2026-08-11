// Shinnslist — Stripe Checkout Worker
// GET ?tier=pro|pro-flipper  ->  Pro/Flipper subscription checkout (302 redirect to Stripe)
// GET ?vertical=<slug>       ->  $1/week per-vertical unlock checkout (price found by lookup_key)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://shinnslist.pages.dev',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Vary': 'Origin',
};

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
    const path = url.pathname.replace(/\/+$/, '') || '/';
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

    // Resolve the Stripe price id
    let priceId = null;
    let planKey = tier || `vertical-${vertical}`;
    if (tier) {
      priceId = tier === 'pro-flipper' ? env.STRIPE_FLIPPER_PRICE_ID : env.STRIPE_PRO_PRICE_ID;
      if (!priceId) return json({ error: `No price configured for tier '${tier}'` }, 400);
    } else {
      // verticals are found by lookup_key so no per-vertical vars are needed
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
    // success lands on Top Deals with the entitlement recorded client-side
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
