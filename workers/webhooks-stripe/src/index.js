// Shinnslist — Stripe Webhook Worker
// Replaces src/app/api/webhooks/stripe (Next.js API route removed during static build).
// POST /  ->  verify Stripe signature, handle subscription events, sync to Supabase.

import { createHmac, timingSafeEqual } from 'node:crypto';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://shinnslist.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
  'Vary': 'Origin',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

// Stripe signature header: "t=<timestamp>,v1=<hex>"
function verifySignature(payload, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;
  const parts = signatureHeader.split(',').map((p) => p.trim());
  let timestamp = '';
  let v1Sig = '';
  for (const part of parts) {
    const [k, v] = part.split('=');
    if (k === 't') timestamp = v;
    else if (k === 'v1') v1Sig = v;
  }
  if (!timestamp || !v1Sig) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expected = createHmac('sha256', secret).update(signedPayload).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(v1Sig);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    if (!verifySignature(body, signature, env.STRIPE_WEBHOOK_SECRET || '')) {
      return json({ error: 'Invalid signature' }, 400);
    }

    let event;
    try {
      event = JSON.parse(body);
    } catch {
      return json({ error: 'Invalid payload' }, 400);
    }

    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseHeaders = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    };

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          const userId = session.client_reference_id || session.metadata?.userId;
          if (userId && supabaseUrl && serviceKey) {
            await fetch(`${supabaseUrl}/rest/v1/users`, {
              method: 'POST',
              headers: supabaseHeaders,
              body: JSON.stringify({
                id: userId,
                subscription: session.metadata?.tier || 'pro',
                updated_at: new Date().toISOString(),
              }),
            });
          }
          break;
        }
        case 'customer.subscription.deleted': {
          const sub = event.data.object;
          const userId = sub.metadata?.userId;
          if (userId && supabaseUrl && serviceKey) {
            await fetch(
              `${supabaseUrl}/rest/v1/users?id=eq.${encodeURIComponent(userId)}`,
              {
                method: 'PATCH',
                headers: supabaseHeaders,
                body: JSON.stringify({
                  subscription: 'free',
                  updated_at: new Date().toISOString(),
                }),
              }
            );
          }
          break;
        }
        case 'invoice.payment_failed': {
          // Log for now (original behavior).
          console.log('[Webhook] Payment failed for invoice', event.data.object.id);
          break;
        }
        default:
          break;
      }
    } catch (err) {
      console.error('[Webhook] Error:', err);
      return json({ error: 'Processing failed' }, 500);
    }

    return json({ received: true });
  },
};
