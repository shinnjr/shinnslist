import { createServiceClient } from './supabase/service';
import { TIER_BUNDLED_ADDONS, type AddonKey, type Tier } from './pricing';

export type BillingStatus =
  | 'none'
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'unpaid'
  | 'canceled';

export interface SubscriptionState {
  tier: Tier;
  addons: AddonKey[];
  status: BillingStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

const ADDON_COLUMN: Record<AddonKey, string> = {
  instant: 'addon_instant',
  state: 'addon_state',
  research: 'addon_research',
  export: 'addon_export',
  digest: 'addon_digest',
  country: 'addon_country',
  roadtrip: 'addon_roadtrip',
};

/**
 * Persist a user's full subscription state on the users row.
 * `activeAddons` should be the complete set the user should have
 * (bundled + paid), so stale flags get cleared.
 */
export async function applySubscriptionToUser(
  userId: string,
  state: SubscriptionState
): Promise<{ error: string | null }> {
  const sb = createServiceClient();
  const addonSet = new Set<AddonKey>([...state.addons, ...TIER_BUNDLED_ADDONS[state.tier]]);

  const updates: Record<string, unknown> = {
    subscription: state.tier,
    subscription_status: state.status,
    updated_at: new Date().toISOString(),
  };
  if (state.stripeCustomerId) updates.stripe_customer_id = state.stripeCustomerId;
  if (state.stripeSubscriptionId) updates.stripe_subscription_id = state.stripeSubscriptionId;
  for (const key of Object.keys(ADDON_COLUMN) as AddonKey[]) {
    updates[ADDON_COLUMN[key]] = addonSet.has(key);
  }

  const { error } = await sb.from('users').update(updates).eq('id', userId);
  return { error: error?.message ?? null };
}

export async function getUserByStripeCustomer(
  customerId: string
): Promise<{ id: string; email?: string } | null> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from('users')
    .select('id, email')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function getUserByEmail(email: string): Promise<{ id: string } | null> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}
