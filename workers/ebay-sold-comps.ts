/**
 * Free eBay Sold Comps Scraper
 * 
 * No API key needed — scrapes public eBay sold listing pages.
 * Use this instead of paying for PriceCharting, WatchCharts, etc.
 * 
 * Run: npx ts-node --skip-project workers/ebay-sold-comps.ts
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9',
};

// Cache to avoid re-scraping same item
const priceCache = new Map<string, { price: number; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

/**
 * Get average sold price for an item from eBay sold listings.
 * Returns average sold price in USD, or null if insufficient data.
 */
export async function getEbaySoldPrice(query: string): Promise<number | null> {
  // Check cache
  const cached = priceCache.get(query);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.price;
  }

  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}&LH_Sold=1&LH_Complete=1&_ipg=60`;

    console.log(`  🔍 eBay: "${query.slice(0, 50)}"`);

    const response = await axios.get(url, {
      headers: HEADERS,
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const prices: number[] = [];

    // Parse sold prices from eBay search results
    // Each result has a price in .s-item__price or span.s-item__price
    $('span.s-item__price').each((_i, el) => {
      const text = $(el).text().trim();
      // Extract dollar amount — handles "$1,234.56", "$123.45 to $456.78", etc.
      const matches = text.match(/\$[\d,]+\.?\d*/g);
      if (matches) {
        // For ranges like "$100 to $200", take the average
        const nums = matches.map(m => parseFloat(m.replace(/[$,]/g, ''))).filter(n => !isNaN(n));
        if (nums.length > 0) {
          prices.push(nums.reduce((a, b) => a + b, 0) / nums.length);
        }
      }
    });

    if (prices.length < 3) {
      console.log(`    ⚠️  Only ${prices.length} results — unreliable`);
      return null;
    }

    // Remove outliers: throw out prices more than 2x the median
    const sorted = [...prices].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const filtered = sorted.filter(p => p <= median * 2 && p >= median * 0.5);

    if (filtered.length < 3) {
      return null;
    }

    const average = filtered.reduce((a, b) => a + b, 0) / filtered.length;
    const rounded = Math.round(average);

    // Cache result
    priceCache.set(query, { price: rounded, timestamp: Date.now() });

    console.log(`    ✅ Avg sold: $${rounded} (from ${filtered.length} sales, range $${Math.min(...filtered)}-$${Math.max(...filtered)})`);
    return rounded;
  } catch (err: any) {
    console.error(`    ❌ Error: ${err.message}`);
    return null;
  }
}

/**
 * Batch lookup — takes multiple queries, returns a map of query → avg price.
 * Respects rate limits with 2s delay between requests.
 */
export async function batchGetEbayPrices(queries: string[]): Promise<Map<string, number | null>> {
  const results = new Map<string, number | null>();

  for (let i = 0; i < queries.length; i++) {
    const q = queries[i];
    const price = await getEbaySoldPrice(q);
    results.set(q, price);

    // Be polite to eBay servers
    if (i < queries.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return results;
}

// === CLI: Test with a few items ===
async function main() {
  console.log('🛒 eBay Sold Comps — Free Deal Scoring Engine\n');

  const testItems = [
    'Herman Miller Aeron Chair Size B',
    'NVIDIA RTX 4090 Founders Edition',
    'Sony PlayStation 5 Disc Edition',
    'iPhone 15 Pro 256GB Unlocked',
  ];

  const results = await batchGetEbayPrices(testItems);

  console.log('\n📊 Results:');
  for (const [item, price] of results) {
    const display = price ? `$${price}` : 'No data';
    console.log(`  ${display.padEnd(10)} | ${item}`);
  }

  console.log('\n💡 Use in deal scoring:');
  console.log('   import { getEbaySoldPrice } from "./workers/ebay-sold-comps";');
  console.log('   const marketValue = await getEbaySoldPrice(listing.title);');
}

main().catch(console.error);
