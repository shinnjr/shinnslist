import { getStripe, priceIdFor } from '../_lib/stripe';
import { userIdFromRequest, serviceClient } from '../_lib/supabase';
import { PRICES, TIER_BUNDLED_ADDONS, appUrl } from '../_lib/config';
import { rateLimit, rateLimitedResponse } from '../_lib/rate-limit';

interface PagesContext {
  request: Request;
  env: Record<string, unknown>;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const MAX_BODY_BYTES = 16 * 1024;

/**
 * Create a Stripe Checkout Session (subscription) for the signed-in user.
 * Body: { tier: 'pro'|'flipper', addons: string[] }
 * Returns: { url } to redirect the browser to Stripe hosted checkout.
 */
export async function onRequestPost(context: PagesContext): Promise<Response> {
  const { request, env } = context;

  // Cheap reject before reading the body or touching Stripe/Supabase.
  const rl = rateLimit(request, { limit: 20, windowSeconds: 60, keyPrefix: 'checkout' });
  if (!rl.ok) return rateLimitedResponse(rl);

  let body: { tier?: string; addons?: string[] } = {};
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return json({ error: 'payload_too_large' }, 413);
    }
    body = raw ? JSON.parse(raw) : {};
  } catch {
    body = {};
  }

  const tier = body.tier === 'flipper' ? 'flipper' : 'pro';
  const requestedAddons = Array.isArray(body.addons)
    ? body.addons.filter((a): a is string => typeof a === 'string')
    : [];

  // 1. Identify the signed-in user.
  const user = await userIdFromRequest(request, env);
  if (!user?.id) {
    return json({ error: 'unauthorized', url: '/login' }, 401);
  }

  const stripe = getStripe(env);

  // 2. Line items: tier + add-ons not already bundled with that tier.
  const bundled = TIER_BUNDLED_ADDONS[tier] ?? [];
  const tierDef = PRICES.find((p) => p.kind === 'tier' && p.tier === tier)!;
  const lineItems = [{ price: await priceIdFor(stripe, env, tierDef.lookupKey), quantity: 1 }];

  const paidAddons: string[] = [];
  for (const addon of requestedAddons) {
    const def = PRICES.find((p) => p.kind === 'addon' && p.addon === addon);
    if (!def || bundled.includes(addon)) continue;
    lineItems.push({ price: await priceIdFor(stripe, env, def.lookupKey), quantity: 1 });
    paidAddons.push(addon);
  }

  // 3. Ensure a Stripe Customer exists for this user.
  const sb = serviceClient(env);
  let customerId: string | undefined;
  const { data: row } = await sb
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle();
  if (row?.stripe_customer_id) {
    customerId = row.stripe_customer_id;
  } else {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await sb.from('users').update({ stripe_customer_id: customer.id }).eq('id', user.id);
  }

  // 4. Create the Checkout Session.
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: user.id,
    line_items: lineItems,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    success_url: `${appUrl(env)}/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl(env)}/pricing`,
    metadata: { user_id: user.id, tier },
    subscription_data: {
      metadata: { user_id: user.id, tier, addons: JSON.stringify(paidAddons) },
    },
  });

  if (!session.url) return json({ error: 'Could not create checkout session.' }, 500);
  return json({ url: session.url });
}
