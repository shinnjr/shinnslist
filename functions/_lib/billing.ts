// Persist subscription state to Supabase for Cloudflare Pages Functions.
import { serviceClient } from './supabase';
import { TIER_BUNDLED_ADDONS } from './config';

export type BillingStatus =
  | 'none'
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'unpaid'
  | 'canceled';

const ADDON_COLUMN: Record<string, string> = {
  instant: 'addon_instant',
  state: 'addon_state',
  research: 'addon_research',
  export: 'addon_export',
  digest: 'addon_digest',
  country: 'addon_country',
  roadtrip: 'addon_roadtrip',
};

export async function applySubscriptionToUser(
  env: Record<string, unknown>,
  userId: string,
  state: {
    tier: 'free' | 'pro' | 'flipper';
    addons: string[];
    status: BillingStatus;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  }
): Promise<{ error: string | null }> {
  const sb = serviceClient(env);
  const addonSet = new Set<string>([
    ...state.addons,
    ...(TIER_BUNDLED_ADDONS[state.tier] ?? []),
  ]);

  const updates: Record<string, unknown> = {
    subscription: state.tier,
    subscription_status: state.status,
    updated_at: new Date().toISOString(),
  };
  if (state.stripeCustomerId) updates.stripe_customer_id = state.stripeCustomerId;
  if (state.stripeSubscriptionId) updates.stripe_subscription_id = state.stripeSubscriptionId;
  for (const key of Object.keys(ADDON_COLUMN)) {
    updates[ADDON_COLUMN[key]] = addonSet.has(key);
  }

  const { error } = await sb.from('users').update(updates).eq('id', userId);
  return { error: error?.message ?? null };
}

export async function getUserByStripeCustomer(
  env: Record<string, unknown>,
  customerId: string
): Promise<{ id: string } | null> {
  const { data } = await serviceClient(env)
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  return data ?? null;
}
