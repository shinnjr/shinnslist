#!/usr/bin/env node
/**
 * FACEBOOK MARKETPLACE FREE LISTINGS ENGINE
 * ==========================================
 * Hermes Overnight Mission — 2026-08-07
 *
 * Strategy: FB Marketplace public search endpoint returns JSON embedded
 * in <script type="application/json"> tags. No login required for basic
 * search. Extract MarketplaceProductItem objects, dedupe, score, and
 * produce a notification payload for the Shinnslist web-push pipeline.
 *
 * USAGE:
 *   cd ~/projects/freebie
 *   npx ts-node --skip-project workers/fbm/scraper.ts
 *
 * LIMITATIONS:
 *   - FB blocks aggressive scraping. Rate limit strictly.
 *   - Only returns what FB shows to logged-out users (limited results).
 *   - Full coverage needs residential proxies + Playwright (see Scrapfly).
 *   - The public endpoint is: https://www.facebook.com/marketplace/{city}/?query=
 *
 * WHAT THIS DOES:
 *   1. Fetches FB Marketplace Denver free listings via public endpoint
 *   2. Extracts JSON blobs from page HTML
 *   3. Parses MarketplaceProductItem objects
 *   4. Outputs JSON suitable for Shinnslist notification pipeline
 */

import axios from 'axios';
import * as fs from 'fs';

// === Types ===
interface FBMListing {
  id: string;
  title: string;
  price: string;
  priceValue: number;
  location: string;
  city: string;
  state: string;
  imageUrl: string | null;
  url: string;
  isSold: boolean;
  isPending: boolean;
  categoryId: string | null;
  sellerName: string | null;
  scrapedAt: string;
  source: 'facebook';
}

interface FBJsonListing {
  id?: string;
  marketplace_listing_title?: string;
  formatted_price?: { text?: string };
  listing_price?: { amount?: string };
  location?: { reverse_geocode?: { city?: string; state?: string } };
  primary_listing_photo?: { image?: { uri?: string } };
  is_sold?: boolean;
  is_pending?: boolean;
  marketplace_listing_category_id?: string;
  marketplace_listing_seller?: { name?: string; id?: string };
  creation_time?: number;
}

// === CONFIG ===
const DENVER_MARKETS = [
  {
    name: 'denver',
    url: 'https://www.facebook.com/marketplace/denver/search/?query=free&maxPrice=0&exact=false',
  },
  {
    name: 'boulder',
    url: 'https://www.facebook.com/marketplace/boulder/search/?query=free&maxPrice=0&exact=false',
  },
  {
    name: 'colorado-springs',
    url: 'https://www.facebook.com/marketplace/colorado-springs/search/?query=free&maxPrice=0&exact=false',
  },
];

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
};

const DELAY_MS = 5000; // Be very polite to FB
const MAX_LISTINGS_PER_MARKET = 50;

// === Deep find objects by __typename ===
function findObjectsByTypename(obj: any, typenames: string[]): any[] {
  const results: any[] = [];
  if (!obj || typeof obj !== 'object') return results;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      results.push(...findObjectsByTypename(item, typenames));
    }
  } else {
    if (obj.__typename && typenames.includes(obj.__typename)) {
      results.push(obj);
    }
    for (const key of Object.keys(obj)) {
      if (key === '__typename') continue;
      try {
        results.push(...findObjectsByTypename(obj[key], typenames));
      } catch {
        // Skip circular refs
      }
    }
  }
  return results;
}

// === Parse FB Marketplace JSON from HTML ===
function extractFBListings(html: string): FBJsonListing[] {
  const scripts = html.match(/<script type="application\/json"[^>]*>([\s\S]*?)<\/script>/g);
  if (!scripts) {
    console.log('  No JSON script tags found in HTML');
    return [];
  }

  const allListings: FBJsonListing[] = [];

  for (const script of scripts) {
    const jsonContent = script.replace(/<script type="application\/json"[^>]*>/, '').replace(/<\/script>/, '');
    try {
      // FB often wraps JSON in a function call like: for (;;);{"__ar":1,...}
      let cleaned = jsonContent;
      if (cleaned.startsWith('for (;;);')) {
        cleaned = cleaned.slice(9);
      }
      const data = JSON.parse(cleaned);
      const found = findObjectsByTypename(data, [
        'MarketplaceProductItem',
        'GroupCommerceProductItem',
        'MarketplaceFeedUnit',
      ]);
      allListings.push(...found);
    } catch (e) {
      // Skip unparseable scripts
      continue;
    }
  }

  return allListings;
}

// === Normalize a raw FB listing ===
function normalizeListing(raw: FBJsonListing, marketName: string): FBMListing | null {
  const id = raw.id;
  if (!id) return null;

  const title = raw.marketplace_listing_title || 'Untitled';
  const priceText = raw.formatted_price?.text || raw.listing_price?.amount || 'Free';
  const priceValue = parseFloat(raw.listing_price?.amount || '0') || 0;

  const geo = raw.location?.reverse_geocode || {};
  const city = geo.city || marketName;
  const state = geo.state || 'CO';

  const imageUrl = raw.primary_listing_photo?.image?.uri || null;

  return {
    id,
    title,
    price: priceText,
    priceValue,
    location: `${city}, ${state}`,
    city,
    state,
    imageUrl,
    url: `https://www.facebook.com/marketplace/item/${id}`,
    isSold: raw.is_sold || false,
    isPending: raw.is_pending || false,
    categoryId: raw.marketplace_listing_category_id || null,
    sellerName: raw.marketplace_listing_seller?.name || null,
    scrapedAt: new Date().toISOString(),
    source: 'facebook',
  };
}

// === Scrape one market ===
async function scrapeMarket(market: { name: string; url: string }): Promise<FBMListing[]> {
  console.log(`\n📍 Scraping FB Marketplace: ${market.name}`);
  console.log(`   URL: ${market.url}`);

  try {
    const response = await axios.get(market.url, {
      headers: HEADERS,
      timeout: 15000,
      maxRedirects: 3,
    });

    const html = response.data;
    console.log(`   Response: ${response.status}, ${html.length} chars`);

    // Check if FB is serving a login wall
    if (html.includes('"__isLoggedIn":false') || html.includes('login_form')) {
      console.log('   ⚠️  FB returned login wall — scraping blocked');
      return [];
    }

    // Check for rate limiting
    if (html.includes('rate_limit') || html.includes('captcha')) {
      console.log('   ⚠️  FB rate limited or captcha — try proxy');
      return [];
    }

    const rawListings = extractFBListings(html);
    console.log(`   Found ${rawListings.length} raw MarketplaceProductItem objects`);

    const listings = rawListings
      .map((raw) => normalizeListing(raw, market.name))
      .filter((l): l is FBMListing => l !== null)
      .filter((l) => !l.isSold) // Skip already-sold items
      .slice(0, MAX_LISTINGS_PER_MARKET);

    console.log(`   Normalized ${listings.length} active listings`);
    return listings;
  } catch (error: any) {
    console.error(`   ❌ Error scraping ${market.name}:`, error.message);
    return [];
  }
}

// === Deduplication ===
function dedupeListings(all: FBMListing[]): FBMListing[] {
  const seen = new Set<string>();
  const unique: FBMListing[] = [];
  for (const listing of all) {
    if (!seen.has(listing.id)) {
      seen.add(listing.id);
      unique.push(listing);
    }
  }
  return unique;
}

// === Simple keyword-based deal scoring ===
const HIGH_VALUE_KEYWORDS = [
  'herman miller', 'aeron', 'dyson', 'macbook', 'iphone', 'rtx', 'playstation',
  'ps5', 'xbox', 'nintendo switch', 'dji', 'canon', 'sony', 'bose', 'sonos',
  'peloton', 'nordictrack', 'patio furniture', 'sectional', 'leather couch',
  'yeti', 'kitchenaid', 'vitamix', 'breville', 'espresso', 'nespresso',
  'dewalt', 'milwaukee', 'snap-on', 'rolex', 'omega', 'louis vuitton', 'gucci',
  'tiffany', 'cartier', 'diamond', 'gold', 'silver', 'wedding dress',
  'designer', 'antique', 'vintage', 'mid-century', 'eames',
];

function scoreListing(listing: FBMListing): number {
  let score = 0;
  const title = listing.title.toLowerCase();

  // Free items get base score of 70
  if (listing.priceValue === 0) score += 70;

  // High-value keywords boost score
  for (const kw of HIGH_VALUE_KEYWORDS) {
    if (title.includes(kw)) score += 10;
  }

  // Has photo = more likely real listing
  if (listing.imageUrl) score += 5;

  // Has seller name = more likely real
  if (listing.sellerName) score += 3;

  return Math.min(score, 100);
}

// === Generate notification payload ===
function generateNotificationPayload(listings: FBMListing[]): {
  total: number;
  topDeals: FBMListing[];
  allListings: FBMListing[];
  notificationText: string;
  generatedAt: string;
} {
  const scored = listings.map((l) => ({ ...l, _score: scoreListing(l) }));
  scored.sort((a, b) => b._score - a._score);

  const topDeals = scored.filter((l) => l._score >= 80).slice(0, 5);
  const topTitles = topDeals.map((l) => l.title).join(', ');

  return {
    total: listings.length,
    topDeals: topDeals.map(({ _score, ...l }) => l),
    allListings: scored.map(({ _score, ...l }) => ({ ...l, dealScore: _score })),
    notificationText: topDeals.length > 0
      ? `🆓 ${topDeals.length} hot free items: ${topTitles.slice(0, 120)}...`
      : `${listings.length} free items found — tap to browse`,
    generatedAt: new Date().toISOString(),
  };
}

// === MAIN ===
async function main() {
  console.log('═'.repeat(60));
  console.log('🆓 SHINNSLIST — FACEBOOK MARKETPLACE FREE STUFF ENGINE');
  console.log('═'.repeat(60));
  console.log(`Started: ${new Date().toISOString()}`);
  console.log(`Markets: ${DENVER_MARKETS.length} (CO Front Range)`);
  console.log('');

  const allListings: FBMListing[] = [];

  for (const market of DENVER_MARKETS) {
    const listings = await scrapeMarket(market);
    allListings.push(...listings);

    if (market !== DENVER_MARKETS[DENVER_MARKETS.length - 1]) {
      console.log(`   ⏳ Waiting ${DELAY_MS / 1000}s before next market...`);
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  const unique = dedupeListings(allListings);
  const payload = generateNotificationPayload(unique);

  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESULTS');
  console.log('═'.repeat(60));
  console.log(`Total raw listings: ${allListings.length}`);
  console.log(`After dedup: ${unique.length}`);
  console.log(`Top deals (score ≥ 80): ${payload.topDeals.length}`);
  console.log(`Notification: "${payload.notificationText}"`);

  // Output full payload as JSON for pipeline consumption
  const outputFile = `/Users/jamesshinn/projects/freebie/workers/fbm/output-${Date.now()}.json`;
  fs.writeFileSync(outputFile, JSON.stringify(payload, null, 2));
  console.log(`\n💾 Full payload saved to: ${outputFile}`);

  console.log('\n✅ Done. Pipe this payload to the Shinnslist push notification system.');

  // Print top deals
  if (payload.topDeals.length > 0) {
    console.log('\n🏆 TOP DEALS:');
    for (const deal of payload.topDeals) {
      console.log(`   ${deal.title} — ${deal.price} — ${deal.location} — ${deal.url}`);
    }
  }
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
