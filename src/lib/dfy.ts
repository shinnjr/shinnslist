// ============================================================
// Shinnslist — Done-For-You (DFY) pricing engine
// Single source of truth for time estimates and sliding rates.
// All amounts in cents USD. Pure functions — safe for server
// components, client components, and Cloudflare Functions.
//
// James's model:
//   Price = estimated minutes × rate, and the RATE slides with
//   what the applicant is applying for (their implied hourly
//   worth): someone chasing a $100 settlement pays a low rate;
//   someone applying for a $100k grant pays a high one. Nobody
//   is ever charged more than their time is plausibly worth.
//   First cart = flat $29 bundle (loss leader). Membership
//   $19/mo (first month free) buys 75% off listed prices.
// ============================================================

export type DfyKind = 'class-action' | 'grant';

export interface DfyItem {
  kind: DfyKind;
  slug: string;
  name: string;
  listedCents: number;
  estMinutes: number;
}

export const DFY = {
  floorCents: 900,             // $9 minimum
  capClassActionCents: 7900,   // $79 max
  capGrantCents: 49900,        // $499 max
  firstBundleCents: 2900,      // $29 flat first cart, any size (loss leader)
  memberMonthlyCents: 1900,    // $19/mo membership
  memberTrialDays: 30,         // first month free
  memberPayPct: 25,            // members pay 25% of listed (75% off)
} as const;

export const MEMBER_LOOKUP_KEY = 'dfy-member-monthly';

// --- Sliding scale: rate (cents/min) as a function of the prize ---

/** Parse the biggest dollar figure out of "$1,000–$4,000" / "Up to $300" / "$50 - $5,000". */
export function maxValueFromAmount(s: string | null | undefined): number {
  if (!s) return 0;
  const matches = (s.match(/\$([\d,]+(?:\.\d+)?)/g) || []).map((m) =>
    parseFloat(m.replace(/[$,]/g, ''))
  );
  return matches.length ? Math.max(...matches) : 0;
}

export function classActionRateCentsPerMin(payout: string): number {
  const max = maxValueFromAmount(payout);
  if (max === 0) return 150;          // "Varies" → default
  if (max <= 100) return 100;         // $1.00/min — small claims
  if (max <= 1000) return 150;        // $1.50/min
  return 250;                          // $2.50/min — meaningful money
}

export function grantRateCentsPerMin(amount: string): number {
  const max = maxValueFromAmount(amount);
  if (max === 0) return 200;          // unknown → default
  if (max < 5000) return 150;         // micro-grants — applicants are price-sensitive
  if (max < 25000) return 225;
  if (max < 100000) return 300;
  return 400;                          // $4.00/min — six-figure grants
}

// --- Time estimation (deterministic, no LLM, no drift) ---

export function estimateClassActionMinutes(
  description: string,
  proof: string,
  payout: string
): number {
  const words = (description || '').trim().split(/\s+/).filter(Boolean).length;
  const descMin = Math.min(3, Math.round(words / 45));
  const proofMin = proof && proof !== 'No' && proof !== 'None' ? 4 : 0;
  const payoutMin = /-|to|varies/i.test(payout || '') ? 2 : 1;
  return 6 + descMin + proofMin + payoutMin;
}

export const GRANT_EFFORT_MINUTES: Record<string, number> = {
  Light: 30,
  Moderate: 60,
  Heavy: 120,
};

export function estimateGrantMinutes(effort?: string | null): number {
  return GRANT_EFFORT_MINUTES[effort || 'Moderate'] ?? 60;
}

export function listedPriceCents(kind: DfyKind, minutes: number, rateCentsPerMin: number): number {
  const cap = kind === 'grant' ? DFY.capGrantCents : DFY.capClassActionCents;
  return Math.min(cap, Math.max(DFY.floorCents, Math.round(minutes * rateCentsPerMin)));
}

export function memberPriceCents(listedCents: number): number {
  return Math.max(100, Math.round((listedCents * DFY.memberPayPct) / 100));
}

export function fmtCents(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export function fmtMinutes(mins: number): string {
  return `${mins} min`;
}

// --- Item builders ---

export function classActionDfyItem(
  slug: string,
  name: string,
  description: string,
  proof: string,
  payout: string
): DfyItem {
  const estMinutes = estimateClassActionMinutes(description, proof, payout);
  const rate = classActionRateCentsPerMin(payout);
  return {
    kind: 'class-action',
    slug,
    name,
    estMinutes,
    listedCents: listedPriceCents('class-action', estMinutes, rate),
  };
}

export function grantDfyItem(
  slug: string,
  name: string,
  effort?: string | null,
  amount?: string | null
): DfyItem {
  const estMinutes = estimateGrantMinutes(effort);
  const rate = grantRateCentsPerMin(amount || '');
  return {
    kind: 'grant',
    slug,
    name,
    estMinutes,
    listedCents: listedPriceCents('grant', estMinutes, rate),
  };
}

export function totalListedCents(items: { listedCents: number }[]): number {
  return items.reduce((sum, i) => sum + i.listedCents, 0);
}

export function totalMemberCents(items: { listedCents: number }[]): number {
  return items.reduce((sum, i) => sum + memberPriceCents(i.listedCents), 0);
}
