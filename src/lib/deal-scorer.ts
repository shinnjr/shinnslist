/**
 * Heuristic Deal Scorer — shared library
 *
 * Used by: Next.js app (deal feed), cron workers (batch scoring)
 * Zero dependencies. Zero API keys. Works across all 15 verticals.
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
  furniture: ['mid century', 'mid-century', 'mcm', 'eames', 'west elm', 'cb2', 'crate barrel', 'pottery barn', 'restoration hardware', 'rh', 'herman miller', 'knoll', 'saarinen', 'nelson', 'barcelona chair', 'chesterfield', 'sectional', 'solid wood', 'hardwood', 'teak', 'walnut', 'mahogany', 'oak', 'dresser', 'buffet', 'credenza', 'armoire', 'chaise', 'ottoman', 'loveseat', 'recliner', 'sleeper sofa', 'daybed', 'murphy bed', 'farmhouse table', 'live edge', 'butcher block', 'coffee table', 'end table', 'nightstand', 'bookshelf', 'bookcase', 'hutch', 'china cabinet', 'dining set', 'patio furniture', 'wicker', 'rattan', 'iron bed', 'brass bed', 'canopy bed', 'loft bed', 'bunk bed'],
  instruments: ['gibson', 'fender', 'martin', 'taylor', 'yamaha', 'steinway', 'roland', 'moog', 'stratocaster', 'telecaster', 'les paul', 'sg', 'jazz bass', 'precision bass', 'acoustic', 'electric guitar', 'grand piano', 'upright piano', 'synthesizer', 'drum set', 'saxophone', 'trumpet', 'violin'],
  artCollectibles: ['original painting', 'oil on canvas', 'watercolor', 'lithograph', 'serigraph', 'print signed', 'numbered print', 'etching', 'sculpture', 'bronze', 'ceramic', 'pottery', 'porcelain', 'crystal', 'silver', 'gold', 'platinum', 'diamond', 'gemstone', 'coin collection', 'stamp collection', 'comic book', 'action figure', 'funko pop', 'hot wheels', 'barbie', 'beanie baby', 'baseball card', 'basketball card', 'pokemon card', 'magic card', 'mtg', 'sports card', 'rookie card', 'autograph', 'graded card', 'psa', 'beckett', 'cib', 'mint in box', 'mib', 'still sealed', 'moc', 'mint on card', 'original box', 'nendoroid', 'figma', 'hot toys', 'sideshow', 'statue', 'figurine', 'bust', 'maquette', 'cel', 'animation cel', 'movie poster', 'concert poster', 'vintage toy', 'diecast', 'matchbox', 'tonka', 'fisher price', 'train set', 'model kit', 'rc car', 'slot car'],
  sportsOutdoor: ['patagonia', "arc'teryx", 'arcteryx', 'the north face', 'north face', 'rei', 'yeti', 'marmot', 'mountain hardwear', 'outdoor research', 'black diamond', 'osprey', 'coleman', 'pelican', 'garmin', 'gopro', 'yeti cooler', 'rooftop tent', 'kayak', 'stand up paddle', 'snowboard', 'skis', 'rossignol', 'burton', 'snowshoes', 'hiking boots', 'merrell', 'salomon', 'keen'],
  babyKids: ['stroller', 'uppababy', 'car seat', 'nuna', 'britax', 'graco', 'chicco', 'crib', 'baby bjorn', 'ergobaby', 'baby jogger', 'bugaboo', 'doona', 'snoo', 'owlet', 'dockatot', 'keekaroo', 'stokke', 'tripp trapp', 'nugget', 'play couch', 'magnatiles', 'play kitchen', 'pikler triangle', 'montessori', 'melissa doug', 'lovevery', 'kiwi co'],
  tools: ['dewalt', 'milwaukee', 'makita', 'bosch', 'ryobi', 'rigid', 'porter cable', 'delta', 'jet', 'powermatic', 'festool', 'sawstop', 'snap-on', 'mac tools', 'matco', 'craftsman', 'husky', 'kobalt', 'table saw', 'miter saw', 'planer', 'jointer', 'bandsaw', 'lathe', 'welder', 'air compressor', 'generator', 'pressure washer', 'chainsaw', 'stihl', 'husqvarna', 'echo'],
  cameraGear: ['canon', 'nikon', 'sony', 'leica', 'fujifilm', 'fuji', 'panasonic', 'olympus', 'sigma', 'tamron', 'zeiss', 'hasselblad', 'pentax', 'dslr', 'mirrorless', 'lens', 'telephoto', 'wide angle', 'prime lens', 'zoom lens', 'gopro hero', 'dji', 'drone', 'mavic', 'tripod', 'gitzo', 'manfrotto', 'profoto', 'speedlight', 'godox'],
  bikes: ['trek', 'specialized', 'cannondale', 'santa cruz', 'giant', 'bianchi', 'colnago', 'pinarello', 'cervelo', 'surly', 'salsa', 'all-city', 'kona', 'yeti cycles', 'ibis', 'evil', 'transition', 'pivot', 'evil', 'electric bike', 'ebike', 'rad power', 'tern', 'brompton', 'carbon frame', 'shimano', 'sram', 'campagnolo', 'enzo', 'fox suspension', 'rockshox'],
  vinylRecords: ['vinyl', 'lp', 'record collection', 'turntable', 'technics', 'audio technica', 'rega', 'pro-ject', 'vpi', 'clear audio', 'ortofon', 'shure', 'first pressing', 'limited vinyl', 'colored vinyl', 'picture disc', 'box set', 'album collection', 'jazz vinyl', 'blues vinyl', 'rock vinyl', 'hip hop vinyl', 'rare vinyl'],
};

const FLOORS: Record<string, number> = {
  'trading-cards': 50, 'trading_cards': 50, sneakers: 100, watches: 500,
  electronics: 200, cars: 5000, legos: 50, handbags: 200,
  'free-stuff': 0, furniture: 100, 'real-estate': 50000, rentals: 500,
  instruments: 150,
  art: 200,
  'sports-outdoor': 75,
  'baby-kids': 30,
  tools: 50,
  'camera-gear': 150,
  bikes: 100,
  'vinyl-records': 20,
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
  // Bonus for high-value categories and brands that signal value
  rarityScore += countMatches(text, KW.furniture);
  rarityScore += countMatches(text, KW.instruments);
  rarityScore += countMatches(text, KW.artCollectibles);
  rarityScore += countMatches(text, KW.sportsOutdoor);
  rarityScore += countMatches(text, KW.babyKids);
  rarityScore += countMatches(text, KW.tools);
  rarityScore += countMatches(text, KW.cameraGear);
  rarityScore += countMatches(text, KW.bikes);
  rarityScore += countMatches(text, KW.vinylRecords);
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
