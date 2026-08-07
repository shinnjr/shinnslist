// ============================================================
// Shinnslist — canonical product & price catalog
// Single source of truth for Stripe products/prices and how each
// one maps to a user's subscription tier / add-on flags.
// Amounts are in cents (USD), billed weekly (recurring).
// ============================================================

export type Tier = 'free' | 'pro' | 'flipper';

export type AddonKey =
  | 'instant'
  | 'state'
  | 'research'
  | 'export'
  | 'digest'
  | 'country'
  | 'roadtrip';

export interface PriceDef {
  /** Unique Stripe price lookup_key (stable, idempotent) */
  lookupKey: string;
  /** Stripe product display name */
  name: string;
  /** Price in cents per week */
  amount: number;
  kind: 'tier' | 'addon';
  tier?: Tier;
  addon?: AddonKey;
  /** Short marketing descriptor shown on the pricing page */
  blurb: string;
}

export const PRICES: PriceDef[] = [
  // --- Subscriptions (tiers) ---
  {
    lookupKey: 'pro-weekly',
    name: 'Shinnslist Pro',
    amount: 500,
    kind: 'tier',
    tier: 'pro',
    blurb: 'Every vertical. Every alert. All 10 categories.',
  },
  {
    lookupKey: 'pro-flipper-weekly',
    name: 'Pro Flipper',
    amount: 2000,
    kind: 'tier',
    tier: 'flipper',
    blurb: 'Everything in Pro, unlimited, no caps.',
  },
  // --- Add-ons ---
  {
    lookupKey: 'addon-instant',
    name: 'Instant Alerts',
    amount: 300,
    kind: 'addon',
    addon: 'instant',
    blurb: 'Push notifications the second a deal drops.',
  },
  {
    lookupKey: 'addon-state',
    name: 'Additional State',
    amount: 100,
    kind: 'addon',
    addon: 'state',
    blurb: 'Add one more state to your search area.',
  },
  {
    lookupKey: 'addon-research',
    name: 'Research & Comps',
    amount: 400,
    kind: 'addon',
    addon: 'research',
    blurb: 'Sold price history, trends, and comps.',
  },
  {
    lookupKey: 'addon-export',
    name: 'Data Export',
    amount: 500,
    kind: 'addon',
    addon: 'export',
    blurb: 'CSV downloads, spreadsheet-ready.',
  },
  {
    lookupKey: 'addon-digest',
    name: 'Email Digest',
    amount: 200,
    kind: 'addon',
    addon: 'digest',
    blurb: 'Daily top deals in your inbox.',
  },
  {
    lookupKey: 'addon-country',
    name: 'Whole Country',
    amount: 800,
    kind: 'addon',
    addon: 'country',
    blurb: 'Monitor the entire US, not just your area.',
  },
  {
    lookupKey: 'addon-roadtrip',
    name: 'Road Trip',
    amount: 300,
    kind: 'addon',
    addon: 'roadtrip',
    blurb: 'Route-based alerts along any drive.',
  },
];

export const TIERS: PriceDef[] = PRICES.filter((p) => p.kind === 'tier');
export const ADDONS: PriceDef[] = PRICES.filter((p) => p.kind === 'addon');

/** Add-ons bundled for free with each tier (display + checkout math). */
export const TIER_BUNDLED_ADDONS: Record<Tier, AddonKey[]> = {
  free: [],
  pro: ['digest'],
  flipper: ['instant', 'digest', 'export', 'research', 'country', 'roadtrip', 'state'],
};

export function priceByLookupKey(key: string): PriceDef | undefined {
  return PRICES.find((p) => p.lookupKey === key);
}

export function tierForLookupKey(key: string): Tier | undefined {
  return PRICES.find((p) => p.lookupKey === key)?.tier;
}

export function addonForLookupKey(key: string): AddonKey | undefined {
  return PRICES.find((p) => p.lookupKey === key)?.addon;
}

/** Human string, e.g. "$5/week" */
export function formatPrice(p: PriceDef): string {
  return `$${(p.amount / 100).toFixed(2).replace(/\.00$/, '')}/week`;
}

export function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2).replace(/\.00$/, '')}`;
}
