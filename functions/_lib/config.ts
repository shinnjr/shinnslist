// ============================================================
// Shinnslist — shared config + domain helpers for Cloudflare
// Pages Functions (the live billing backend on the static site).
// Catalog is kept in sync with src/lib/pricing.ts.
// ============================================================

export interface PriceDef {
  lookupKey: string;
  name: string;
  amount: number; // cents/week
  kind: 'tier' | 'addon';
  tier?: 'pro' | 'flipper';
  addon?: string;
  blurb: string;
}

export const PRICES: PriceDef[] = [
  { lookupKey: 'pro-weekly', name: 'Shinnslist Pro', amount: 500, kind: 'tier', tier: 'pro', blurb: 'Every vertical. Every alert.' },
  { lookupKey: 'pro-flipper-weekly', name: 'Pro Flipper', amount: 2000, kind: 'tier', tier: 'flipper', blurb: 'Everything in Pro, unlimited.' },
  { lookupKey: 'addon-instant', name: 'Instant Alerts', amount: 300, kind: 'addon', addon: 'instant', blurb: 'Push notifications instantly.' },
  { lookupKey: 'addon-state', name: 'Additional State', amount: 100, kind: 'addon', addon: 'state', blurb: 'Add one more state.' },
  { lookupKey: 'addon-research', name: 'Research & Comps', amount: 400, kind: 'addon', addon: 'research', blurb: 'Sold price history and comps.' },
  { lookupKey: 'addon-export', name: 'Data Export', amount: 500, kind: 'addon', addon: 'export', blurb: 'CSV downloads.' },
  { lookupKey: 'addon-digest', name: 'Email Digest', amount: 200, kind: 'addon', addon: 'digest', blurb: 'Daily top deals in your inbox.' },
  { lookupKey: 'addon-country', name: 'Whole Country', amount: 800, kind: 'addon', addon: 'country', blurb: 'Monitor the entire US.' },
  { lookupKey: 'addon-roadtrip', name: 'Road Trip', amount: 300, kind: 'addon', addon: 'roadtrip', blurb: 'Route-based alerts.' },
];

/** Add-ons bundled free with each tier. */
export const TIER_BUNDLED_ADDONS: Record<string, string[]> = {
  free: [],
  pro: ['digest'],
  flipper: ['instant', 'digest', 'export', 'research', 'country', 'roadtrip', 'state'],
};

/** lookup_key -> env var that holds its Stripe price ID (from scripts/setup-stripe.mjs). */
export const PRICE_ID_ENV: Record<string, string> = {
  'pro-weekly': 'STRIPE_PRO_PRICE_ID',
  'pro-flipper-weekly': 'STRIPE_FLIPPER_PRICE_ID',
  'addon-instant': 'STRIPE_ADDON_INSTANT_PRICE_ID',
  'addon-state': 'STRIPE_ADDON_STATE_PRICE_ID',
  'addon-research': 'STRIPE_ADDON_RESEARCH_PRICE_ID',
  'addon-export': 'STRIPE_ADDON_EXPORT_PRICE_ID',
  'addon-digest': 'STRIPE_ADDON_DIGEST_PRICE_ID',
  'addon-country': 'STRIPE_ADDON_COUNTRY_PRICE_ID',
  'addon-roadtrip': 'STRIPE_ADDON_ROADTRIP_PRICE_ID',
};

export function tierForLookupKey(key?: string): 'pro' | 'flipper' | undefined {
  return PRICES.find((p) => p.lookupKey === key)?.tier;
}

export function addonForLookupKey(key?: string): string | undefined {
  return PRICES.find((p) => p.lookupKey === key)?.addon;
}

export function appUrl(env: Record<string, unknown>): string {
  return (env.NEXT_PUBLIC_APP_URL as string) || 'https://shinnslist.pages.dev';
}
