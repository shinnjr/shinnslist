/**
 * Free Multi-Source Deal Scoring Router
 * 
 * Tries free public APIs in priority order for each vertical.
 * Falls back to scraping public pages. No paid API keys needed.
 * 
 * Run: npx ts-node --skip-project workers/multi-source-comps.ts
 */

import axios from 'axios';

interface CompsResult {
  source: string;
  averagePrice: number | null;
  sampleSize: number;
  confidence: 'high' | 'medium' | 'low';
}

// === Source 1: StockX Public API (sneakers) ===
async function stockxComps(query: string): Promise<CompsResult> {
  try {
    const url = `https://stockx.com/api/browse?_search=${encodeURIComponent(query)}`;
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      timeout: 10000,
    });

    const products = res.data?.Products || [];
    if (products.length === 0) return { source: 'stockx', averagePrice: null, sampleSize: 0, confidence: 'low' };

    const prices = products.slice(0, 10).map((p: any) => p.market?.lastSale).filter(Boolean);
    if (prices.length < 2) return { source: 'stockx', averagePrice: null, sampleSize: prices.length, confidence: 'low' };

    const avg = Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length);
    return { source: 'stockx', averagePrice: avg, sampleSize: prices.length, confidence: 'high' };
  } catch {
    return { source: 'stockx', averagePrice: null, sampleSize: 0, confidence: 'low' };
  }
}

// === Source 2: BrickLink Price Guide (Legos) ===
async function bricklinkComps(setNumber: string): Promise<CompsResult> {
  try {
    const url = `https://api.bricklink.com/api/store/v1/items/LEGO/${setNumber}/price`;
    // BrickLink requires OAuth — but the price guide is public via their website
    // For now, return null and fall back to other sources
    return { source: 'bricklink', averagePrice: null, sampleSize: 0, confidence: 'low' };
  } catch {
    return { source: 'bricklink', averagePrice: null, sampleSize: 0, confidence: 'low' };
  }
}

// === Source 3: Scrape TCGPlayer public prices (trading cards) ===
async function tcgplayerComps(cardName: string): Promise<CompsResult> {
  try {
    const url = `https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&q=${encodeURIComponent(cardName)}&view=grid`;
    // TCGPlayer has Cloudflare, needs browser-level scraping
    return { source: 'tcgplayer', averagePrice: null, sampleSize: 0, confidence: 'low' };
  } catch {
    return { source: 'tcgplayer', averagePrice: null, sampleSize: 0, confidence: 'low' };
  }
}

// === Source 4: Swappa pricing (electronics) ===
async function swappaComps(query: string): Promise<CompsResult> {
  try {
    const url = `https://swappa.com/buy/search?q=${encodeURIComponent(query)}`;
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000,
    });

    // Parse Swappa listing prices from the page
    const prices: number[] = [];
    const priceRegex = /\$([\d,]+)/g;
    let match;
    while ((match = priceRegex.exec(res.data)) !== null) {
      prices.push(parseInt(match[1].replace(/,/g, '')));
    }

    if (prices.length < 3) return { source: 'swappa', averagePrice: null, sampleSize: prices.length, confidence: 'low' };

    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    return { source: 'swappa', averagePrice: avg, sampleSize: prices.length, confidence: 'medium' };
  } catch {
    return { source: 'swappa', averagePrice: null, sampleSize: 0, confidence: 'low' };
  }
}

// === Source 5: Chrono24 Public (watches) ===
async function chrono24Comps(refNumber: string): Promise<CompsResult> {
  try {
    const url = `https://www.chrono24.com/search/index.htm?query=${encodeURIComponent(refNumber)}&dosearch=true&searchexplain=1`;
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000,
    });

    // Chrono24 shows prices in format like "$12,345"
    const prices: number[] = [];
    const priceRegex = /\$([\d,]+)/g;
    let match;
    while ((match = priceRegex.exec(res.data)) !== null) {
      prices.push(parseInt(match[1].replace(/,/g, '')));
    }

    if (prices.length < 3) return { source: 'chrono24', averagePrice: null, sampleSize: prices.length, confidence: 'low' };

    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    return { source: 'chrono24', averagePrice: avg, sampleSize: prices.length, confidence: 'medium' };
  } catch {
    return { source: 'chrono24', averagePrice: null, sampleSize: 0, confidence: 'low' };
  }
}

// === Multi-Source Router ===
export async function getMarketValue(
  title: string,
  verticalId: string,
  metadata?: Record<string, string>
): Promise<CompsResult> {
  const results: CompsResult[] = [];

  switch (verticalId) {
    case 'sneakers':
      results.push(await stockxComps(title));
      break;

    case 'legos':
      if (metadata?.setNumber) {
        results.push(await bricklinkComps(metadata.setNumber));
      }
      break;

    case 'trading-cards':
      results.push(await tcgplayerComps(title));
      break;

    case 'electronics':
    case 'cell-phones':
      results.push(await swappaComps(title));
      break;

    case 'watches':
      results.push(await chrono24Comps(metadata?.refNumber || title));
      break;

    case 'free-stuff':
      // Free stuff: value = what the item is worth (use title search across all sources)
      results.push(await swappaComps(title));
      break;

    default:
      // Generic: try Swappa and Chrono24
      results.push(await swappaComps(title));
      break;
  }

  // Return the best result (highest confidence + sample size)
  const best = results
    .filter(r => r.averagePrice !== null)
    .sort((a, b) => {
      const confOrder = { high: 3, medium: 2, low: 1 };
      const aScore = confOrder[a.confidence] * 100 + a.sampleSize;
      const bScore = confOrder[b.confidence] * 100 + b.sampleSize;
      return bScore - aScore;
    })[0];

  return best || { source: 'none', averagePrice: null, sampleSize: 0, confidence: 'low' };
}

// === CLI Test ===
async function main() {
  console.log('🔄 Multi-Source Deal Scoring Router\n');

  const tests = [
    { title: 'Nike Air Jordan 1 Retro High', vertical: 'sneakers' },
    { title: 'iPhone 15 Pro 256GB', vertical: 'electronics' },
    { title: 'Rolex Submariner 16610', vertical: 'watches', metadata: { refNumber: '16610' } },
  ];

  for (const test of tests) {
    console.log(`\n🔍 "${test.title}" [${test.vertical}]`);
    const result = await getMarketValue(test.title, test.vertical, test.metadata as any);
    console.log(`  Source: ${result.source} | Price: $${result.averagePrice ?? 'N/A'} | Samples: ${result.sampleSize} | Confidence: ${result.confidence}`);
    // Rate limit
    await new Promise(r => setTimeout(r, 2000));
  }
}

main().catch(console.error);
