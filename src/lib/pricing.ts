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

/** Per-vertical unlock catalog — $1/week each (matches weekly billing cadence). */
export const VERTICAL_SLUGS = [
  'free-stuff',
  'trading-cards',
  'sneakers',
  'watches',
  'legos',
  'handbags',
  'electronics',
  'cars',
  'real-estate',
  'furniture',
] as const;

export type VerticalSlug = (typeof VERTICAL_SLUGS)[number];

export const VERTICAL_META: Record<VerticalSlug, { label: string; icon: string; blurb: string }> = {
  'free-stuff': { label: 'Free Stuff', icon: '🆓', blurb: 'The best free pickups first' },
  'trading-cards': { label: 'Cards', icon: '🃏', blurb: 'Pokémon, sports, TCG lots' },
  sneakers: { label: 'Sneakers', icon: '👟', blurb: 'Deadstock and grails' },
  watches: { label: 'Watches', icon: '⌚', blurb: 'Rolex, Omega, Seiko finds' },
  legos: { label: 'Legos', icon: '🧱', blurb: 'Sets and bulk bricks' },
  handbags: { label: 'Handbags', icon: '👜', blurb: 'Luxury bags at garage prices' },
  electronics: { label: 'Electronics', icon: '💻', blurb: 'GPUs, consoles, MacBooks' },
  cars: { label: 'Cars', icon: '🚗', blurb: 'Flippable vehicles' },
  'real-estate': { label: 'Homes', icon: '🏠', blurb: 'Land and property' },
  furniture: { label: 'Furniture', icon: '🛋️', blurb: 'Designer pieces, fast movers' },
};

export const VERTICAL_PRICE_CENTS = 100; // $1/week per vertical

export function verticalLookupKey(slug: string): string {
  return `vertical-${slug}`;
}

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
