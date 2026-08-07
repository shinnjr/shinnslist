import type Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const StripeCtor = require('stripe') as typeof import('stripe').default;
    _stripe = new StripeCtor(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-06-24.dahlia' as Stripe.LatestApiVersion,
    });
  }
  return _stripe;
}
