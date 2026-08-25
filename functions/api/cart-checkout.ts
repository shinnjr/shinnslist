// DFY cart checkout — proxy to the shinnslist-checkout Worker, which
// owns the real STRIPE_SECRET_KEY secret. Keeps /api/cart-checkout as
// the stable same-origin surface for the client. Server-side proxy:
// no CORS concerns, no key exposure.
import { json, type PagesContext } from '../_lib/http';
import { rateLimit, rateLimitedResponse } from '../_lib/rate-limit';

const WORKER_URL = 'https://shinnslist-checkout.jamesrshinn.workers.dev/dfy/checkout';

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const { request } = context;

  const rl = rateLimit(request, { limit: 10, windowSeconds: 60, keyPrefix: 'cart-checkout' });
  if (!rl.ok) return rateLimitedResponse(rl);

  try {
    const body = await request.text();
    const resp = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const payload = await resp.text();
    return new Response(payload, {
      status: resp.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return json(
      { error: 'checkout_unreachable', detail: e instanceof Error ? e.message : String(e) },
      502
    );
  }
}
