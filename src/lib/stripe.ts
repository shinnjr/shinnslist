import type Stripe from 'stripe';

let _stripe: Stripe | null = null;

/**
 * Lazily-initialized Stripe client. Works on both Node and
 * Cloudflare Workers (the SDK auto-selects a fetch-based HTTP
 * client when no Node HTTP client is available).
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not set. Add it to .env.local / Cloudflare env vars.');
    }
    const StripeCtor = require('stripe') as typeof import('stripe').default;
    _stripe = new StripeCtor(key, {
      apiVersion: '2026-06-24.dahlia',
    });
  }
  return _stripe;
}

/** Resolve a price ID from a lookup_key (created by scripts/setup-stripe.mjs). */
export async function resolvePriceId(
  stripe: Stripe,
  lookupKey: string
): Promise<string | null> {
  const prices = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  return prices.data[0]?.id ?? null;
}

/** Resolve (or lazily create) a recurring weekly price by lookup_key. */
export async function ensurePrice(
  stripe: Stripe,
  lookupKey: string,
  name: string,
  amountCents: number
): Promise<string> {
  const existing = await resolvePriceId(stripe, lookupKey);
  if (existing) return existing;

  const product = await stripe.products.create({ name, metadata: { lookup_key: lookupKey } });
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: amountCents,
    currency: 'usd',
    recurring: { interval: 'week' },
    lookup_key: lookupKey,
  });
  return price.id;
}
