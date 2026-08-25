// Matching engine for personal aggregators ("watches").
// Pure TS shared by the run + feed endpoints. Zero external deps beyond Supabase client.

import type { SupabaseClient } from '@supabase/supabase-js';

export interface MatchConfig {
  keywords: string[];
  categories: string[];
  min_price: number;
  max_price: number | null;
  min_deal_score: number;
  sources: string[];
}

export interface MatchListingInput {
  source?: string | null;
  title?: string | null;
  description?: string | null;
  category?: string | null;
  price?: number | null;
  estimated_value?: number | null;
}

export interface MatchResult {
  matched: boolean;
  reason: string | null;
  score: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

/** Compute deal score from estimated value vs asking price. */
export function dealScore(price: number, estimatedValue: number | null | undefined): number {
  if (estimatedValue == null || estimatedValue <= 0) return 0;
  return Math.round(((estimatedValue - price) / estimatedValue) * 100);
}

/**
 * Match a listing against an aggregator config.
 * - Source must be in config.sources
 * - Price bounds (min when > 0, max when set)
 * - Deal score must be >= min_deal_score
 * - Free (price==0) always matches; otherwise keyword or category
 */
export function matchListing(config: MatchConfig, listing: MatchListingInput): MatchResult {
  const source = (listing.source || '').toLowerCase();
  const allowed = new Set(config.sources.map((s) => s.toLowerCase()));
  if (!allowed.has(source)) {
    return { matched: false, reason: null, score: 0 };
  }

  const price = typeof listing.price === 'number' ? listing.price : Number(listing.price) || 0;

  if (config.max_price != null && price > config.max_price) {
    return { matched: false, reason: null, score: 0 };
  }
  if (config.min_price > 0 && price < config.min_price) {
    return { matched: false, reason: null, score: 0 };
  }

  const score = dealScore(price, listing.estimated_value);
  if (score < (config.min_deal_score ?? 0)) {
    return { matched: false, reason: null, score };
  }

  // Free items match regardless of keywords/categories.
  if (price === 0) {
    return { matched: true, reason: 'free', score };
  }

  const title = (listing.title || '').toLowerCase();
  const description = (listing.description || '').toLowerCase();
  const keywords = (config.keywords || []).filter(Boolean);

  for (const kw of keywords) {
    const needle = kw.toLowerCase().trim();
    if (!needle) continue;
    if (title.includes(needle) || description.includes(needle)) {
      return { matched: true, reason: 'keyword', score };
    }
  }

  const categories = (config.categories || []).filter(Boolean);
  const listingCat = (listing.category || '').toLowerCase();
  if (listingCat && categories.some((c) => c.toLowerCase() === listingCat)) {
    return { matched: true, reason: 'category', score };
  }

  // Empty filters → match everything that passed source/price/score (useful "score-only" watches).
  if (keywords.length === 0 && categories.length === 0) {
    return { matched: true, reason: 'all', score };
  }

  return { matched: false, reason: null, score };
}

/** Ray-casting point-in-polygon. Polygon is [{lat,lng},...]. */
export function pointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  if (!polygon || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const yi = polygon[i].lat;
    const xi = polygon[i].lng;
    const yj = polygon[j].lat;
    const xj = polygon[j].lng;
    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi + 0.0) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Parse PostGIS/GeoJSON geography into {lat,lng}, or null. */
export function parseListingCoords(location: unknown): LatLng | null {
  if (!location) return null;

  // GeoJSON Point: { type: 'Point', coordinates: [lng, lat] }
  if (typeof location === 'object' && location !== null) {
    const loc = location as { type?: string; coordinates?: number[]; lat?: number; lng?: number };
    if (Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
      const [lng, lat] = loc.coordinates;
      if (typeof lat === 'number' && typeof lng === 'number') return { lat, lng };
    }
    if (typeof loc.lat === 'number' && typeof loc.lng === 'number') {
      return { lat: loc.lat, lng: loc.lng };
    }
  }

  // WKT: POINT(lng lat) or SRID=4326;POINT(lng lat)
  if (typeof location === 'string') {
    const m = location.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (m) {
      const lng = Number(m[1]);
      const lat = Number(m[2]);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
    }
  }

  return null;
}

function normalizePolygon(raw: unknown): LatLng[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p) => {
      if (!p || typeof p !== 'object') return null;
      const obj = p as Record<string, unknown>;
      const lat = Number(obj.lat ?? obj.latitude);
      const lng = Number(obj.lng ?? obj.lon ?? obj.longitude);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
      return { lat, lng };
    })
    .filter((p): p is LatLng => p !== null);
}

/** Expand source filters so freecycle also covers trashnothing listings. */
export function expandSources(sources: string[]): string[] {
  const set = new Set(sources.map((s) => s.toLowerCase()));
  if (set.has('freecycle')) set.add('trashnothing');
  return [...set];
}

interface AggregatorRow {
  id: string;
  keywords: string[] | null;
  categories: string[] | null;
  sources: string[] | null;
  min_price: number | null;
  max_price: number | null;
  min_deal_score: number | null;
  zone_id: string | null;
}

interface ListingRow {
  id: string;
  source: string | null;
  title: string | null;
  description: string | null;
  category: string | null;
  price: number | null;
  estimated_value: number | null;
  location?: unknown;
}

/**
 * Run matching for one aggregator against recent listings.
 * Upserts matches into aggregator_items (ignore on conflict), updates last_run_at.
 */
export async function runAggregator(
  client: SupabaseClient,
  aggregatorId: string
): Promise<{ inserted: number; total: number }> {
  const { data: agg, error: aggErr } = await client
    .from('aggregators')
    .select('id, keywords, categories, sources, min_price, max_price, min_deal_score, zone_id')
    .eq('id', aggregatorId)
    .maybeSingle();

  if (aggErr || !agg) {
    throw new Error(aggErr?.message || 'aggregator_not_found');
  }

  const row = agg as AggregatorRow;
  const sources = expandSources(row.sources || ['craigslist', 'offerup', 'facebook']);
  const config: MatchConfig = {
    keywords: row.keywords || [],
    categories: row.categories || [],
    min_price: Number(row.min_price) || 0,
    max_price: row.max_price == null ? null : Number(row.max_price),
    min_deal_score: Number(row.min_deal_score) || 0,
    sources,
  };

  let polygon: LatLng[] | null = null;
  if (row.zone_id) {
    const { data: zone } = await client
      .from('zones')
      .select('polygon')
      .eq('id', row.zone_id)
      .maybeSingle();
    if (zone?.polygon) {
      polygon = normalizePolygon(zone.polygon);
      if (polygon.length < 3) polygon = null;
    }
  }

  const { data: listings, error: listErr } = await client
    .from('listings')
    .select('id, source, title, description, category, price, estimated_value, location')
    .in('source', sources)
    .order('posted_at', { ascending: false })
    .limit(500);

  if (listErr) {
    throw new Error(listErr.message);
  }

  const matches: {
    aggregator_id: string;
    listing_id: string;
    deal_score: number;
    matched_reason: string | null;
  }[] = [];

  for (const listing of (listings || []) as ListingRow[]) {
    if (polygon) {
      const coords = parseListingCoords(listing.location);
      if (!coords || !pointInPolygon(coords, polygon)) continue;
    }

    const result = matchListing(config, listing);
    if (!result.matched) continue;

    matches.push({
      aggregator_id: aggregatorId,
      listing_id: listing.id,
      deal_score: result.score,
      matched_reason: result.reason,
    });
  }

  let inserted = 0;
  if (matches.length > 0) {
    // Chunk upserts to stay under payload limits
    const chunkSize = 100;
    for (let i = 0; i < matches.length; i += chunkSize) {
      const chunk = matches.slice(i, i + chunkSize);
      const { data, error } = await client
        .from('aggregator_items')
        .upsert(chunk, {
          onConflict: 'aggregator_id,listing_id',
          ignoreDuplicates: true,
        })
        .select('id');

      if (error) {
        throw new Error(error.message);
      }
      inserted += data?.length ?? 0;
    }
  }

  const now = new Date().toISOString();
  await client
    .from('aggregators')
    .update({ last_run_at: now, updated_at: now })
    .eq('id', aggregatorId);

  return { inserted, total: matches.length };
}
