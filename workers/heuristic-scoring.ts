/**
 * Heuristic Deal Scoring Engine
 *
 * Zero API keys. Works across all verticals. Gets smarter with data.
 *
 * Scores listings 0-100 based on:
 * - Price signals (FREE, price drops, below-market keywords)
 * - Urgency signals (time on market, seller motivation)
 * - Rarity signals (limited editions, vintage, deadstock)
 * - Quality signals (condition, completeness)
 */

export interface DealScoreInput {
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor' | 'unknown';
  postedAt: number; // timestamp
  sourceAge?: number; // seconds since posted
}

export interface DealScoreOutput {
  score: number;           // 0-100 overall
  breakdown: {
    priceScore: number;    // 0-40 — how good is the price
    urgencyScore: number;  // 0-30 — how fast will this disappear
    rarityScore: number;   // 0-20 — how unique/special
    qualityScore: number;  // 0-10 — condition
  };
  flags: string[];         // human-readable signals
  confidence: 'high' | 'medium' | 'low';
}

// === Price Signals ===
const FREE_KEYWORDS = ['free', 'gratis', 'no cost', '$0', 'giving away'];
const PRICE_DROP_KEYWORDS = ['price drop', 'reduced', 'lowered', 'was $', 'originally $', 'marked down'];
const MOTIVATED_SELLER_KEYWORDS = [
  'must sell', 'moving', 'need gone', 'priced to sell', 'obo', 'make offer',
  'motivated', 'urgent', 'today only', 'this weekend', 'take it away',
  'first come', "won't last", 'going fast',
];
const BELOW_MARKET_KEYWORDS = [
  'below market', 'under market', 'below retail', 'cheaper than', 'best price',
  'lowest price', 'steal', 'bargain', 'deal', 'half off', '50% off',
];
const RARITY_KEYWORDS = [
  'limited edition', 'rare', 'vintage', 'discontinued', 'out of print',
  'collector', 'deadstock', 'og', 'original', 'first edition', '1 of',
  'signed', 'numbered', 'exclusive', 'collab', 'prototype',
];
const QUALITY_KEYWORDS = [
  'mint', 'brand new', 'never worn', 'never used', 'sealed', 'unopened',
  'with tags', 'nwt', 'box and papers', 'complete', 'original packaging',
];
const DAMAGE_KEYWORDS = [
  'damaged', 'broken', 'cracked', 'stained', 'torn', 'missing parts',
  'as-is', 'for parts', 'not working', 'needs repair', 'fixer',
  'project', 'rough', 'worn', 'heavily used',
];

// === Vertical-specific value floors (minimum price considered "good") ===
const VALUE_FLOORS: Record<string, number> = {
  'trading-cards': 50,
  'trading_cards': 50,
  'sneakers': 100,
  'watches': 500,
  'electronics': 200,
  'cars': 5000,
  'legos': 50,
  'handbags': 200,
  'free-stuff': 0,
  'free_stuff': 0,
  'real-estate': 50000,
  'rentals': 500,
  'furniture': 100,
};

function keywordScore(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  let matches = 0;
  for (const kw of keywords) {
    if (lower.includes(kw)) matches++;
  }
  return matches;
}

function extractOriginalPrice(description: string, title: string): number | null {
  const text = `${title} ${description}`;
  const match = text.match(/(?:was|originally|listed at|retails? for)\s*\$?([\d,]+)/i);
  if (match) return parseInt(match[1].replace(/,/g, ''));
  return null;
}

export function scoreDeal(input: DealScoreInput): DealScoreOutput {
  const { title, description, price, category, condition, postedAt } = input;
  const text = `${title} ${description}`.toLowerCase();
  const flags: string[] = [];

  // ===== PRICE SCORE (0-40) =====
  let priceScore = 0;

  // Free = perfect price
  if (price === 0) {
    priceScore = 40;
    flags.push('FREE');
  } else if (keywordScore(text, FREE_KEYWORDS) > 0) {
    priceScore = 40;
    flags.push('FREE');
  }

  // Price drop = seller is adjusting down
  const dropMatches = keywordScore(text, PRICE_DROP_KEYWORDS);
  if (dropMatches > 0) {
    priceScore += dropMatches * 5;
    flags.push('Price dropped');
  }

  // Original price comparison
  const originalPrice = extractOriginalPrice(description, title);
  if (originalPrice && originalPrice > 0) {
    const discount = ((originalPrice - price) / originalPrice) * 100;
    if (discount > 50) {
      priceScore += 20;
      flags.push(`${Math.round(discount)}% off retail`);
    } else if (discount > 30) {
      priceScore += 12;
      flags.push(`${Math.round(discount)}% off retail`);
    } else if (discount > 10) {
      priceScore += 5;
    }
  }

  // Below-market language
  const belowMarketHits = keywordScore(text, BELOW_MARKET_KEYWORDS);
  priceScore += belowMarketHits * 3;

  // Motivated seller = better deal likely
  const motivatedHits = keywordScore(text, MOTIVATED_SELLER_KEYWORDS);
  priceScore += motivatedHits * 2;

  // Cap price score
  priceScore = Math.min(priceScore, 40);
  if (priceScore === 0 && price > 0) {
    // Default: item has a price but no special signals
    priceScore = 5;
  }

  // ===== URGENCY SCORE (0-30) =====
  let urgencyScore = 0;

  // Time on market — newer = more urgent
  const ageMins = (Date.now() - postedAt) / 60000;
  if (ageMins < 5) {
    urgencyScore = 30;
    flags.push('Just posted');
  } else if (ageMins < 30) {
    urgencyScore = 22;
  } else if (ageMins < 60) {
    urgencyScore = 15;
  } else if (ageMins < 120) {
    urgencyScore = 8;
  } else {
    urgencyScore = 3;
  }

  // Urgency keywords
  const urgencyHits = keywordScore(text, ['today only', 'this weekend', "won't last", 'going fast', 'first come', 'act fast']);
  urgencyScore += urgencyHits * 3;

  // High-value items in popular categories = gone fast
  const floor = VALUE_FLOORS[category] || 100;
  if (price > 0 && price < floor * 0.5) {
    urgencyScore += 5;
    flags.push('Under market floor');
  }

  urgencyScore = Math.min(urgencyScore, 30);

  // ===== RARITY SCORE (0-20) =====
  let rarityScore = 0;
  const rarityHits = keywordScore(text, RARITY_KEYWORDS);
  rarityScore = Math.min(rarityHits * 4, 20);

  if (condition === 'new' || condition === 'like-new') {
    rarityScore += 3;
  }

  // ===== QUALITY SCORE (0-10) =====
  let qualityScore = 0;

  switch (condition) {
    case 'new': qualityScore = 10; break;
    case 'like-new': qualityScore = 8; break;
    case 'good': qualityScore = 5; break;
    case 'fair': qualityScore = 3; break;
    case 'poor': qualityScore = 1; break;
    default: qualityScore = 5;
  }

  // Quality keywords boost
  qualityScore += keywordScore(text, QUALITY_KEYWORDS) * 2;
  // Damage keywords reduce
  qualityScore -= keywordScore(text, DAMAGE_KEYWORDS) * 3;

  qualityScore = Math.max(0, Math.min(qualityScore, 10));

  // ===== COMPUTE TOTAL =====
  const score = Math.min(priceScore + urgencyScore + rarityScore + qualityScore, 100);

  // Confidence
  const signalCount = flags.length + (originalPrice ? 1 : 0) + (condition !== 'unknown' ? 1 : 0);
  const confidence = signalCount >= 4 ? 'high' : signalCount >= 2 ? 'medium' : 'low';

  return {
    score,
    breakdown: { priceScore, urgencyScore, rarityScore, qualityScore },
    flags,
    confidence,
  };
}

// === CLI Test ===
async function main() {
  console.log('🧠 Heuristic Deal Scoring Engine\n');

  const tests: DealScoreInput[] = [
    {
      title: 'Nike Air Jordan 1 Retro High OG Chicago — Deadstock',
      description: 'Size 11. Never worn. Originally paid $180. Must sell today.',
      price: 150, category: 'sneakers', condition: 'new', postedAt: Date.now() - 120000,
    },
    {
      title: 'Moving Sale — FREE Leather Couch',
      description: 'Need gone by Sunday. Like new condition, no pets.',
      price: 0, category: 'furniture', condition: 'like-new', postedAt: Date.now() - 600000,
    },
    {
      title: 'RTX 4090 — Open Box',
      description: 'Used for 3 months. Works perfectly.',
      price: 900, category: 'electronics', condition: 'good', postedAt: Date.now() - 3600000,
    },
    {
      title: 'Vintage 1998 Rolex Datejust — Box and Papers',
      description: 'Serviced January. Rare two-tone dial.',
      price: 4200, category: 'watches', condition: 'good', postedAt: Date.now() - 7200000,
    },
    {
      title: 'PSA 10 Charizard VMAX — Rare Pull',
      description: 'Perfect centering. POP 230. Below market value.',
      price: 180, category: 'trading_cards', condition: 'new', postedAt: Date.now() - 60000,
    },
    {
      title: 'Broken iPhone 15 — For Parts',
      description: 'Cracked screen. As-is. No returns.',
      price: 200, category: 'electronics', condition: 'poor', postedAt: Date.now() - 86400000,
    },
  ];

  for (const test of tests) {
    const result = scoreDeal(test);
    const bar = '█'.repeat(Math.round(result.score / 5)) + '░'.repeat(20 - Math.round(result.score / 5));
    console.log(`${bar}`);
    console.log(`  ${result.score}/100 · ${result.confidence} confidence`);
    console.log(`  ${test.title}`);
    console.log(`  Price: ${test.price === 0 ? 'FREE' : '$' + test.price} · ${test.condition} · ${test.category}`);
    console.log(`  Flags: ${result.flags.join(' · ')}`);
    console.log(`  Breakdown: 💰${result.breakdown.priceScore} ⏰${result.breakdown.urgencyScore} 💎${result.breakdown.rarityScore} ✅${result.breakdown.qualityScore}`);
    console.log();
  }
}

main().catch(console.error);
