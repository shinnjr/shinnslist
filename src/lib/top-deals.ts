// Top Deals of the Day scoring engine.
// Ranks deals by: value/asking delta + FBM velocity (how fast the item class moves)
// + proximity (distance from user's location / commute). Zero deps, client-computed.

import { haversineKm, driveMinutes } from './geo';
import { categorySlug } from './subscription';

/** How fast each vertical moves on FBM (0–10). Proxy for sell-through speed. */
export const CATEGORY_VELOCITY: Record<string, number> = {
  'free-stuff': 10,
  'trading-cards': 9,
  sneakers: 8,
  electronics: 8,
  furniture: 8,
  watches: 7,
  handbags: 7,
  legos: 6,
  cars: 6,
  'real-estate': 4,
  rentals: 4,
};

export function velocityFor(category: string): number {
  return CATEGORY_VELOCITY[categorySlug(category)] ?? 5;
}

export function velocityLabel(category: string): { label: string; emoji: string } {
  const v = velocityFor(category);
  if (v >= 9) return { label: 'gone in hours on FBM', emoji: '⚡' };
  if (v >= 7) return { label: 'moves fast on FBM', emoji: '🔥' };
  if (v >= 5) return { label: 'steady seller', emoji: '📈' };
  return { label: 'slow mover', emoji: '🐢' };
}

export interface TopDealAnalysis {
  score: number; // 0–100
  deltaPct: number; // 0..1 (1 = free)
  deltaValue: number; // estimatedValue - price
  velocity: number; // 0–10
  velocityEmoji: string;
  velocityText: string;
  distanceKm: number | null;
  minutes: number | null;
  freshness: 'just-posted' | 'today' | 'this-week' | 'stale';
  reasons: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface DealLike {
  price: number;
  estimatedValue: number | null;
  category: string;
  postedAt: number;
  location?: { lat: number; lng: number; city?: string; state?: string } | null;
}

/** Default when user location is unknown — neutral proximity, no penalty. */
const NEUTRAL_PROXIMITY_SCORE = 15;

export function analyzeTopDeal(
  deal: DealLike,
  userLoc: { lat: number; lng: number } | null
): TopDealAnalysis {
  const price = Math.max(0, deal.price || 0);
  const ev = deal.estimatedValue && deal.estimatedValue > 0 ? deal.estimatedValue : null;
  const reasons: string[] = [];

  // --- Delta (0–40): how far below market value ---
  let deltaPct = 0;
  let deltaValue = 0;
  if (price === 0) {
    deltaPct = 1;
    deltaValue = ev ?? 0;
  } else if (ev) {
    deltaPct = Math.max(0, Math.min(1, (ev - price) / ev));
    deltaValue = ev - price;
  }
  let deltaScore = 0;
  if (price === 0) deltaScore = 40;
  else if (deltaPct >= 0.8) deltaScore = 36;
  else if (deltaPct >= 0.6) deltaScore = 30;
  else if (deltaPct >= 0.4) deltaScore = 22;
  else if (deltaPct >= 0.2) deltaScore = 13;
  else if (deltaPct > 0) deltaScore = Math.round(deltaPct * 55);
  if (deltaValue >= 500) deltaScore = Math.min(40, deltaScore + 4);
  else if (deltaValue >= 200) deltaScore = Math.min(40, deltaScore + 2);
  if (deltaPct >= 0.5) reasons.push(`${Math.round(deltaPct * 100)}% below market`);
  if (deltaValue >= 300) reasons.push(`$${Math.round(deltaValue).toLocaleString()} upside`);

  // --- Velocity (0–30): category sell-through × freshness ---
  const vel = velocityFor(deal.category);
  const hours = (Date.now() - deal.postedAt) / 3600000;
  let freshnessMult = 1;
  let freshness: TopDealAnalysis['freshness'] = 'just-posted';
  if (hours < 1) freshness = 'just-posted';
  else if (hours < 24) { freshness = 'today'; freshnessMult = 0.85; }
  else if (hours < 168) { freshness = 'this-week'; freshnessMult = 0.65; }
  else { freshness = 'stale'; freshnessMult = 0.4; }
  const velocityScore = Math.min(30, Math.round(vel * 3 * freshnessMult));
  if (vel >= 7 && freshnessMult >= 0.85) reasons.push('moves fast on FBM — first to message wins');
  else if (vel >= 7) reasons.push('high-demand category on FBM');
  if (freshness === 'just-posted') reasons.push('just posted');

  // --- Proximity (0–30): how close / how quick the pickup ---
  let proximityScore = NEUTRAL_PROXIMITY_SCORE;
  let distanceKm: number | null = null;
  let minutes: number | null = null;
  if (userLoc && deal.location && Number.isFinite(deal.location.lat) && Number.isFinite(deal.location.lng)) {
    distanceKm = haversineKm(userLoc, { lat: deal.location.lat, lng: deal.location.lng });
    minutes = driveMinutes(distanceKm);
    if (distanceKm <= 2) proximityScore = 30;
    else if (distanceKm <= 5) proximityScore = 26;
    else if (distanceKm <= 10) proximityScore = 20;
    else if (distanceKm <= 20) proximityScore = 12;
    else if (distanceKm <= 40) proximityScore = 6;
    else proximityScore = 2;
    if (distanceKm <= 5) reasons.push(`${minutes} min away — grab it now`);
    else if (distanceKm <= 20) reasons.push(`${minutes} min drive`);
  } else if (!userLoc) {
    reasons.push('share location for proximity ranking');
  }

  const score = Math.min(100, deltaScore + velocityScore + proximityScore);
  const signals = (ev ? 1 : 0) + (deal.location ? 1 : 0) + (deltaPct > 0 ? 1 : 0);
  const confidence = signals >= 3 ? 'high' : signals >= 2 ? 'medium' : 'low';

  return {
    score,
    deltaPct,
    deltaValue,
    velocity: vel,
    velocityEmoji: velocityLabel(deal.category).emoji,
    velocityText: velocityLabel(deal.category).label,
    distanceKm,
    minutes,
    freshness,
    reasons,
    confidence,
  };
}
