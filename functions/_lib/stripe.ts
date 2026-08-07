// Env-based Stripe client + price resolution for Cloudflare Pages Functions.
import Stripe from 'stripe';
import { PRICE_ID_ENV } from './config';

let _stripe: Stripe | null = null;

export function getStripe(env: Record<string, unknown>): Stripe {
  if (!_stripe) {
    const key = (env.STRIPE_SECRET_KEY as string) || '';
    if (!key) throw new Error('STRIPE_SECRET_KEY not set');
    _stripe = new Stripe(key, { apiVersion: '2026-06-24.dahlia' });
  }
  return _stripe;
}

/** Resolve a price ID from env var first, else lookup_key via the API. */
export async function priceIdFor(
  stripe: Stripe,
  env: Record<string, unknown>,
  lookupKey: string
): Promise<string> {
  const fromEnv = env[PRICE_ID_ENV[lookupKey]] as string | undefined;
  if (fromEnv) return fromEnv;
  const prices = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  const id = prices.data[0]?.id;
  if (!id) throw new Error(`No price for lookup_key "${lookupKey}". Run scripts/setup-stripe.mjs.`);
  return id;
}
