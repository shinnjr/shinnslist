/**
 * Heuristic Deal Scorer — shared library
 *
 * Used by: Next.js app (deal feed), cron workers (batch scoring)
 * Zero dependencies. Zero API keys. Works across all 10 verticals.
 */

export interface ScoreInput {
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor' | 'unknown';
  postedAt: number;
}

export interface ScoreOutput {
  score: number;
  breakdown: { priceScore: number; urgencyScore: number; rarityScore: number; qualityScore: number };
  flags: string[];
  confidence: 'high' | 'medium' | 'low';
}

const KW = {
  free: ['free', 'gratis', 'giving away', 'no cost', 'curb alert', 'curb find'],
  priceDrop: ['price drop', 'reduced', 'lowered', 'was $', 'originally $', 'marked down', 'slash', 'clearance', 'closeout', 'liquidation'],
  motivated: ['must sell', 'moving', 'need gone', 'priced to sell', 'obo', 'make offer', 'motivated', 'urgent', 'divorce', 'estate sale', 'downsizing', 'lost storage', 'eviction'],
  belowMarket: ['below market', 'under market', 'below retail', 'steal', 'bargain', 'deal of', 'half off', 'way under', 'insane deal', 'crazy deal', 'best price', 'lowest price', 'fire sale', 'dirt cheap'],
  rarity: ['limited edition', 'rare', 'vintage', 'discontinued', 'collector', 'deadstock', 'og', 'first edition', 'signed', 'numbered', 'exclusive', 'collab', 'prototype', 'one of a kind', 'custom', 'handmade', 'artisan', 'antique', 'retro', 'throwback', 'grail'],
  quality: ['mint', 'brand new', 'never worn', 'never used', 'sealed', 'unopened', 'with tags', 'nwt', 'like new', 'open box', 'barely used', 'lightly used', 'excellent condition', 'pristine', 'flawless', 'showroom'],
  damage: ['damaged', 'broken', 'cracked', 'stained', 'torn', 'missing parts', 'as-is', 'for parts', 'not working', 'needs repair', 'scratched', 'dented', 'worn', 'faded', 'chipped', 'rusty', 'mold', 'water damage'],
  urgency: ['today only', 'this weekend', "won't last", 'going fast', 'first come', 'act fast', 'last chance', 'ending soon', 'final hours', 'blowout', 'while supplies last'],
  furniture: ['mid century', 'mid-century', 'mcm', 'eames', 'west elm', 'cb2', 'crate barrel', 'pottery barn', 'restoration hardware', 'rh', 'herman miller', 'knoll', 'saarinen', 'nelson', 'barcelona chair', 'chesterfield', 'sectional', 'solid wood', 'hardwood', 'teak', 'walnut', 'mahogany', 'oak'],
  instruments: ['gibson', 'fender', 'martin', 'taylor', 'yamaha', 'steinway', 'roland', 'moog', 'stratocaster', 'telecaster', 'les paul', 'sg', 'jazz bass', 'precision bass', 'acoustic', 'electric guitar', 'grand piano', 'upright piano', 'synthesizer', 'drum set', 'saxophone', 'trumpet', 'violin'],
  artCollectibles: ['original painting', 'oil on canvas', 'watercolor', 'lithograph', 'serigraph', 'print signed', 'numbered print', 'etching', 'sculpture', 'bronze', 'ceramic', 'pottery', 'porcelain', 'crystal', 'silver', 'gold', 'platinum', 'diamond', 'gemstone', 'coin collection', 'stamp collection', 'comic book', 'action figure', 'funko pop', 'hot wheels', 'barbie'],
};

const FLOORS: Record<string, number> = {
  'trading-cards': 50, 'trading_cards': 50, sneakers: 100, watches: 500,
  electronics: 200, cars: 5000, legos: 50, handbags: 200,
  'free-stuff': 0, furniture: 100, 'real-estate': 50000, rentals: 500,
  instruments: 150,
};

function countMatches(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  let n = 0;
  for (const kw of keywords) if (lower.includes(kw)) n++;
  return n;
}

function extractOriginalPrice(title: string, description: string): number | null {
  const m = `${title} ${description}`.match(/(?:was|originally|listed at|retails? for)\s*\$?([\d,]+)/i);
  return m ? parseInt(m[1].replace(/,/g, '')) : null;
}

export function scoreDeal(input: ScoreInput): ScoreOutput {
  const { title, description, price, category, condition, postedAt } = input;
  const text = `${title} ${description}`;
  const flags: string[] = [];

  // Price score (0–40)
  let priceScore = 0;
  if (price === 0 || countMatches(text, KW.free) > 0) { priceScore = 40; flags.push('FREE'); }
  const drops = countMatches(text, KW.priceDrop);
  if (drops > 0) { priceScore += drops * 5; flags.push('Price dropped'); }
  const orig = extractOriginalPrice(title, description);
  if (orig && orig > 0) {
    const d = ((orig - price) / orig) * 100;
    if (d > 50) { priceScore += 20; flags.push(`${Math.round(d)}% off retail`); }
    else if (d > 30) { priceScore += 12; flags.push(`${Math.round(d)}% off retail`); }
    else if (d > 10) priceScore += 5;
  }
  priceScore += countMatches(text, KW.belowMarket) * 3 + countMatches(text, KW.motivated) * 2;
  priceScore = Math.min(priceScore, 40);
  if (priceScore === 0 && price > 0) priceScore = 5;

  // Urgency score (0–30)
  let urgencyScore = 0;
  const mins = (Date.now() - postedAt) / 60000;
  if (mins < 5) { urgencyScore = 30; flags.push('Just posted'); }
  else if (mins < 30) urgencyScore = 22;
  else if (mins < 60) urgencyScore = 15;
  else if (mins < 120) urgencyScore = 8;
  else urgencyScore = 3;
  urgencyScore += countMatches(text, KW.urgency) * 3;
  const floor = FLOORS[category] || 100;
  if (price > 0 && price < floor * 0.5) { urgencyScore += 5; flags.push('Under market floor'); }
  urgencyScore = Math.min(urgencyScore, 30);

  // Rarity score (0–20)
  let rarityScore = Math.min(countMatches(text, KW.rarity) * 4, 20);
  // Bonus for furniture, instruments, art/collectibles that signal value
  rarityScore += countMatches(text, KW.furniture);
  rarityScore += countMatches(text, KW.instruments);
  rarityScore += countMatches(text, KW.artCollectibles);
  rarityScore = Math.min(rarityScore, 20);
  if (condition === 'new' || condition === 'like-new') rarityScore += 3;

  // Quality score (0–10)
  const qMap: Record<string, number> = { new: 10, 'like-new': 8, good: 5, fair: 3, poor: 1, unknown: 5 };
  let qualityScore = qMap[condition] || 5;
  qualityScore += countMatches(text, KW.quality) * 2 - countMatches(text, KW.damage) * 3;
  qualityScore = Math.max(0, Math.min(qualityScore, 10));

  const score = Math.min(priceScore + urgencyScore + rarityScore + qualityScore, 100);
  const signals = flags.length + (orig ? 1 : 0) + (condition !== 'unknown' ? 1 : 0);
  const confidence = signals >= 4 ? 'high' : signals >= 2 ? 'medium' : 'low';

  // False-positive mitigation
  if (condition === 'poor' || countMatches(text, KW.damage) > 0) flags.push('damaged');
  if (confidence === 'low' && score < 15) flags.push('spam');

  return { score, breakdown: { priceScore, urgencyScore, rarityScore, qualityScore }, flags, confidence };
}
