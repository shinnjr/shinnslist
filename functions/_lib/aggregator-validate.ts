// Shared validation for aggregator create/update payloads.

/** Category ids copied from src/data/interestTaxonomy.ts INTEREST_CATEGORIES. */
export const KNOWN_CATEGORY_IDS = [
  'furniture',
  'electronics',
  'appliances',
  'baby-kids',
  'clothing',
  'home-decor',
  'kitchen',
  'sports-equipment',
  'bikes-cycling',
  'camping-outdoors',
  'outdoor-recreation',
  'musical-instruments',
  'tools-diy',
  'automotive',
  'toys-games',
  'books-media',
  'pet-supplies',
  'garden-outdoor',
  'antiques-collectibles',
  'free-events',
] as const;

export const ALLOWED_SOURCES = ['craigslist', 'offerup', 'facebook', 'freecycle'] as const;

export type AllowedSource = (typeof ALLOWED_SOURCES)[number];

export interface AggregatorInput {
  name: string;
  emoji: string;
  keywords: string[];
  categories: string[];
  sources: string[];
  min_price: number;
  max_price: number | null;
  min_deal_score: number;
  zone_id: string | null;
  active: boolean;
}

export type ValidationResult =
  | { ok: true; value: AggregatorInput }
  | { ok: false; error: string };

const MAX_BODY_BYTES = 32 * 1024;

export async function readJsonBody(request: Request): Promise<
  { ok: true; body: Record<string, unknown> } | { ok: false; error: string; status: number }
> {
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return { ok: false, error: 'payload_too_large', status: 413 };
    }
    if (!raw) return { ok: true, body: {} };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, error: 'invalid_json', status: 400 };
    }
    return { ok: true, body: parsed as Record<string, unknown> };
  } catch {
    return { ok: false, error: 'invalid_json', status: 400 };
  }
}

function asStringArray(value: unknown, maxItems: number, maxLen: number): string[] | null {
  if (value == null) return [];
  if (!Array.isArray(value)) return null;
  if (value.length > maxItems) return null;
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') return null;
    const trimmed = item.trim();
    if (!trimmed) continue;
    if (trimmed.length > maxLen) return null;
    out.push(trimmed);
  }
  return out;
}

/**
 * Validate a create/update body. For PATCH, pass `partial=true` and merge with existing row first
 * (or only validate provided fields). This function expects a full candidate shape after merge.
 */
export function validateAggregatorInput(
  body: Record<string, unknown>,
  opts: { requireName?: boolean } = {}
): ValidationResult {
  const requireName = opts.requireName !== false;

  const nameRaw = body.name;
  if (requireName || nameRaw !== undefined) {
    if (typeof nameRaw !== 'string' || !nameRaw.trim()) {
      return { ok: false, error: 'name is required' };
    }
    if (nameRaw.trim().length > 60) {
      return { ok: false, error: 'name must be ≤ 60 characters' };
    }
  }

  let emoji = '🛍️';
  if (body.emoji !== undefined) {
    if (typeof body.emoji !== 'string') return { ok: false, error: 'emoji must be a string' };
    // Emoji can be multi-codepoint; cap by UTF-16 length loosely (≤4 "chars" of graphemes ~ 16 code units)
    if ([...body.emoji].length > 4) {
      return { ok: false, error: 'emoji must be ≤ 4 characters' };
    }
    emoji = body.emoji || '🛍️';
  }

  const keywords = asStringArray(body.keywords ?? [], 50, 60);
  if (keywords === null) {
    return { ok: false, error: 'keywords: max 50 strings, each ≤ 60 chars' };
  }

  const categories = asStringArray(body.categories ?? [], 50, 60);
  if (categories === null) {
    return { ok: false, error: 'categories must be an array of strings' };
  }
  const known = new Set<string>(KNOWN_CATEGORY_IDS);
  for (const c of categories) {
    if (!known.has(c)) {
      return { ok: false, error: `unknown category: ${c}` };
    }
  }

  let sources = asStringArray(
    body.sources ?? ['craigslist', 'offerup', 'facebook'],
    10,
    40
  );
  if (sources === null) {
    return { ok: false, error: 'sources must be an array of strings' };
  }
  if (sources.length === 0) {
    sources = ['craigslist', 'offerup', 'facebook'];
  }
  const allowed = new Set<string>(ALLOWED_SOURCES);
  for (const s of sources) {
    if (!allowed.has(s)) {
      return { ok: false, error: `invalid source: ${s}` };
    }
  }

  let min_price = 0;
  if (body.min_price !== undefined && body.min_price !== null) {
    const n = Number(body.min_price);
    if (Number.isNaN(n) || n < 0) {
      return { ok: false, error: 'min_price must be ≥ 0' };
    }
    min_price = n;
  }

  let max_price: number | null = null;
  if (body.max_price !== undefined) {
    if (body.max_price === null || body.max_price === '') {
      max_price = null;
    } else {
      const n = Number(body.max_price);
      if (Number.isNaN(n)) {
        return { ok: false, error: 'max_price must be a number or null' };
      }
      max_price = n;
    }
  }
  if (max_price != null && max_price <= min_price) {
    return { ok: false, error: 'max_price must be greater than min_price' };
  }

  let min_deal_score = 0;
  if (body.min_deal_score !== undefined && body.min_deal_score !== null) {
    const n = Number(body.min_deal_score);
    if (Number.isNaN(n) || n < 0 || n > 100) {
      return { ok: false, error: 'min_deal_score must be 0–100' };
    }
    min_deal_score = Math.round(n);
  }

  let zone_id: string | null = null;
  if (body.zone_id !== undefined) {
    if (body.zone_id === null || body.zone_id === '') {
      zone_id = null;
    } else if (typeof body.zone_id !== 'string') {
      return { ok: false, error: 'zone_id must be a string or null' };
    } else {
      zone_id = body.zone_id;
    }
  }

  let active = true;
  if (body.active !== undefined) {
    if (typeof body.active !== 'boolean') {
      return { ok: false, error: 'active must be a boolean' };
    }
    active = body.active;
  }

  return {
    ok: true,
    value: {
      name: typeof nameRaw === 'string' ? nameRaw.trim() : '',
      emoji,
      keywords,
      categories,
      sources,
      min_price,
      max_price,
      min_deal_score,
      zone_id,
      active,
    },
  };
}
