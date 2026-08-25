// DFY order confirmation — proxy to the shinnslist-checkout Worker
// (which verifies the Stripe session and records dfy_orders).
import { json, type PagesContext } from '../_lib/http';
import { rateLimit, rateLimitedResponse } from '../_lib/rate-limit';

const WORKER_URL = 'https://shinnslist-checkout.jamesrshinn.workers.dev/dfy/confirm';

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const { request } = context;

  const rl = rateLimit(request, { limit: 30, windowSeconds: 60, keyPrefix: 'dfy-confirm' });
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
      { error: 'confirm_unreachable', detail: e instanceof Error ? e.message : String(e) },
      502
    );
  }
}
