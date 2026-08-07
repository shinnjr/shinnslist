/**
 * Shinnslist Data Pipeline — Unified Scraper → Scorer → Supabase
 *
 * Run: npx ts-node --skip-project workers/pipeline.ts
 *
 * Scrapes Craigslist free stuff for 4 CO cities, scores listings
 * heuristically, upserts into Supabase with retry logic.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// ============================================================
// CONFIG
// ============================================================

const CITIES = [
  { name: 'denver', subdomain: 'denver', lat: 39.7392, lng: -104.9903, state: 'CO' },
  { name: 'boulder', subdomain: 'boulder', lat: 40.0150, lng: -105.2705, state: 'CO' },
  { name: 'cosprings', subdomain: 'cosprings', lat: 38.8339, lng: -104.8214, state: 'CO' },
  { name: 'fortcollins', subdomain: 'fortcollins', lat: 40.5853, lng: -105.0844, state: 'CO' },
];

const SECTIONS = ['zip']; // free stuff
const DELAY_MS = 2000;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9',
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// ============================================================
// TYPES
// ============================================================

interface RawListing {
  sourceId: string;
  title: string;
  url: string;
  price: number;
  location: string;
  postedAt: string;
  hasImage: boolean;
  // Tagged during scraping — NOT inferred from URL
  scrapedFromCity: string;
  scrapedFromLat: number;
  scrapedFromLng: number;
  scrapedFromState: string;
}

interface ScoredListing {
  sourceId: string;
  title: string;
  url: string;
  price: number;
  location: string;
  score: number;
  breakdown: { priceScore: number; urgencyScore: number; rarityScore: number; qualityScore: number };
  flags: string[];
  confidence: string;
  cityName: string;
  cityLat: number;
  cityLng: number;
  state: string;
}

// ============================================================
// HEURISTIC SCORING
// ============================================================

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

function keywordScore(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  let matches = 0;
  for (const kw of keywords) {
    if (lower.includes(kw)) matches++;
  }
  return matches;
}

function scoreListing(listing: RawListing): ScoredListing {
  const { title, price } = listing;
  const text = title.toLowerCase();
  const flags: string[] = [];

  let priceScore = 0;
  if (price === 0) {
    priceScore = 40;
    flags.push('FREE');
  } else if (keywordScore(text, FREE_KEYWORDS) > 0) {
    priceScore = 40;
    flags.push('FREE');
  }

  const dropMatches = keywordScore(text, PRICE_DROP_KEYWORDS);
  if (dropMatches > 0) {
    priceScore += dropMatches * 5;
    flags.push('Price dropped');
  }

  const belowMarketHits = keywordScore(text, BELOW_MARKET_KEYWORDS);
  priceScore += belowMarketHits * 3;

  const motivatedHits = keywordScore(text, MOTIVATED_SELLER_KEYWORDS);
  priceScore += motivatedHits * 2;

  priceScore = Math.min(priceScore, 40);
  if (priceScore === 0 && price > 0) {
    priceScore = 5;
  }

  let urgencyScore = 10;
  const urgencyHits = keywordScore(text, ['today only', 'this weekend', "won't last", 'going fast', 'first come', 'act fast']);
  urgencyScore += urgencyHits * 5;
  urgencyScore = Math.min(urgencyScore, 30);

  const rarityHits = keywordScore(text, RARITY_KEYWORDS);
  let rarityScore = Math.min(rarityHits * 4, 20);

  let qualityScore = 5;
  qualityScore += keywordScore(text, QUALITY_KEYWORDS) * 2;
  qualityScore -= keywordScore(text, DAMAGE_KEYWORDS) * 3;
  qualityScore = Math.max(0, Math.min(qualityScore, 10));

  const score = Math.min(priceScore + urgencyScore + rarityScore + qualityScore, 100);
  const signalCount = flags.length;
  const confidence = signalCount >= 4 ? 'high' : signalCount >= 2 ? 'medium' : 'low';

  return {
    sourceId: listing.sourceId,
    title,
    url: listing.url,
    price,
    location: listing.location,
    score,
    breakdown: { priceScore, urgencyScore, rarityScore, qualityScore },
    flags,
    confidence,
    cityName: listing.scrapedFromCity,
    cityLat: listing.scrapedFromLat,
    cityLng: listing.scrapedFromLng,
    state: listing.scrapedFromState,
  };
}

// ============================================================
// SCRAPER
// ============================================================

async function scrapeCitySection(
  subdomain: string,
  section: string,
  cityName: string,
  cityLat: number,
  cityLng: number,
  state: string,
): Promise<RawListing[]> {
  const url = `https://${subdomain}.craigslist.org/search/${section}#search=1~list~0~0`;
  console.log(`  🌐 Scraping: ${url}`);

  try {
    const response = await axios.get(url, { headers: HEADERS, timeout: 30000 });
    const $ = cheerio.load(response.data);
    const listings: RawListing[] = [];

    $('li.cl-static-search-result').each((_i, el) => {
      try {
        const $el = $(el);
        const titleEl = $el.find('div.title');
        const linkEl = $el.find('a');
        const priceEl = $el.find('div.price');
        const locationEl = $el.find('div.location');

        const title = titleEl.text().trim();
        const href = linkEl.attr('href') || '';
        const priceText = priceEl.text().trim() || '$0';
        const location = locationEl.text().trim() || cityName;

        if (!title || !href) return;

        let price = 0;
        const priceMatch = priceText.match(/\$?([\d,]+)/);
        if (priceMatch && !priceText.toLowerCase().includes('free')) {
          price = parseInt(priceMatch[1].replace(/,/g, ''));
        }

        const sourceId = crypto.createHash('md5').update(href).digest('hex').slice(0, 12);
        const hasImage = $el.find('img').length > 0;

        listings.push({
          sourceId,
          title,
          url: href.startsWith('http') ? href : `https://${subdomain}.craigslist.org${href}`,
          price,
          location,
          postedAt: new Date().toISOString(),
          hasImage,
          // Tag with source city info directly
          scrapedFromCity: cityName,
          scrapedFromLat: cityLat,
          scrapedFromLng: cityLng,
          scrapedFromState: state,
        });
      } catch (_err) {
        // Skip malformed
      }
    });

    return listings;
  } catch (err: any) {
    console.error(`  ❌ Error scraping ${url}: ${err.message}`);
    return scrapeFallback(subdomain, section, cityName, cityLat, cityLng, state);
  }
}

// Alternative parsing — try gallery view or different selectors
async function scrapeFallback(
  subdomain: string,
  section: string,
  cityName: string,
  cityLat: number,
  cityLng: number,
  state: string,
): Promise<RawListing[]> {
  const url = `https://${subdomain}.craigslist.org/search/${section}?sort=date#search=1~gallery~0~0`;
  console.log(`  🔄 Fallback: ${url}`);

  try {
    const response = await axios.get(url, { headers: HEADERS, timeout: 30000 });
    const $ = cheerio.load(response.data);
    const listings: RawListing[] = [];

    $('li.cl-search-result, li.result-row, div.result-info').each((_i, el) => {
      try {
        const $el = $(el);
        const linkEl = $el.find('a.posting-title, a.result-title, h3 a').first();
        const priceEl = $el.find('span.priceinfo, span.result-price, div.price').first();
        const locationEl = $el.find('span.result-hood, span.location, div.location').first();
        const title = linkEl.text().trim();
        const href = linkEl.attr('href') || '';

        if (!title || !href) return;

        let price = 0;
        const priceText = priceEl.text().trim() || '$0';
        const priceMatch = priceText.match(/\$?([\d,]+)/);
        if (priceMatch && !priceText.toLowerCase().includes('free')) {
          price = parseInt(priceMatch[1].replace(/,/g, ''));
        }

        const location = locationEl.text().trim() || cityName;
        const sourceId = crypto.createHash('md5').update(href).digest('hex').slice(0, 12);

        listings.push({
          sourceId,
          title,
          url: href.startsWith('http') ? href : `https://${subdomain}.craigslist.org${href}`,
          price,
          location,
          postedAt: new Date().toISOString(),
          hasImage: $el.find('img').length > 0,
          scrapedFromCity: cityName,
          scrapedFromLat: cityLat,
          scrapedFromLng: cityLng,
          scrapedFromState: state,
        });
      } catch (_err) {
        // Skip
      }
    });

    return listings;
  } catch (err: any) {
    console.error(`  ❌ Fallback also failed: ${err.message}`);
    return [];
  }
}

// ============================================================
// SUPABASE INSERT WITH RETRY
// ============================================================

async function insertListing(
  supabase: SupabaseClient,
  listing: ScoredListing,
  maxRetries: number = 3,
): Promise<{ inserted: boolean; skipped: boolean; error?: string }> {
  const baseDelay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { error } = await supabase.from('listings').upsert({
        source: 'craigslist',
        source_id: listing.sourceId,
        source_url: listing.url,
        title: listing.title,
        description: '',
        photos: [],
        price: listing.price,
        estimated_value: null,
        category: null,
        brand: null,
        model: null,
        condition: 'unknown',
        flags: listing.flags,
        location: `SRID=4326;POINT(${listing.cityLng} ${listing.cityLat})`,
        city: listing.cityName,
        state: listing.state,
        posted_at: new Date().toISOString(),
        ai_processed: false,
      }, { onConflict: 'source,source_id', ignoreDuplicates: false });

      if (error) {
        if (error.code === '23505') {
          return { inserted: false, skipped: true };
        }
        throw error;
      }

      return { inserted: true, skipped: false };
    } catch (err: any) {
      console.error(`  ⚠️  Insert attempt ${attempt}/${maxRetries} failed for "${listing.title.slice(0, 40)}": ${err.message || err.code || err}`);
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`     Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  return { inserted: false, skipped: false, error: `Failed after ${maxRetries} retries` };
}

// ============================================================
// MAIN PIPELINE
// ============================================================

async function main() {
  console.log('🆓 Shinnslist Data Pipeline');
  console.log(`   ⏰ ${new Date().toISOString()}`);
  console.log(`   📍 Cities: ${CITIES.map(c => c.name).join(', ')}`);
  console.log(`   🗂️  Sections: ${SECTIONS.join(', ')}`);
  console.log('');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log(`🔌 Supabase: ${SUPABASE_URL}\n`);

  // === PHASE 1: SCRAPE ===
  console.log('📡 PHASE 1: Scraping Craigslist...\n');
  const allListings: RawListing[] = [];
  const cityCounts: Record<string, number> = {};

  for (let ci = 0; ci < CITIES.length; ci++) {
    const city = CITIES[ci];
    console.log(`📍 ${city.name} (${city.subdomain}.craigslist.org)`);

    for (let si = 0; si < SECTIONS.length; si++) {
      const section = SECTIONS[si];
      let listings = await scrapeCitySection(
        city.subdomain, section, city.name,
        city.lat, city.lng, city.state
      );
      console.log(`   ✅ Found ${listings.length} listings`);

      // Count and deduplicate
      let cityAdded = 0;
      for (const listing of listings) {
        if (!allListings.find(l => l.sourceId === listing.sourceId)) {
          allListings.push(listing);
          cityAdded++;
        }
      }
      cityCounts[city.name] = (cityCounts[city.name] || 0) + cityAdded;

      if (ci < CITIES.length - 1 || si < SECTIONS.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }
  }

  console.log(`\n📊 Total scraped (unique): ${allListings.length}`);

  // === PHASE 2: SCORE ===
  console.log('\n🧠 PHASE 2: Scoring listings...\n');
  const scored: ScoredListing[] = [];

  for (const listing of allListings) {
    const scoredListing = scoreListing(listing);
    scored.push(scoredListing);
  }

  scored.sort((a, b) => b.score - a.score);

  console.log('🔥 Top scored listings:');
  scored.slice(0, 10).forEach(l => {
    const bar = '█'.repeat(Math.round(l.score / 5)) + '░'.repeat(20 - Math.round(l.score / 5));
    console.log(`  ${bar} ${l.score}/100 · ${l.flags.join(' · ') || 'no flags'}`);
    console.log(`    ${l.title.slice(0, 70)}`);
    console.log(`    ${l.price === 0 ? 'FREE' : '$' + l.price} · ${l.cityName}, ${l.state}`);
  });

  const highDeals = scored.filter(s => s.score >= 70).length;
  const mediumDeals = scored.filter(s => s.score >= 40 && s.score < 70).length;
  const lowDeals = scored.filter(s => s.score < 40).length;
  console.log(`\n📊 Score distribution: 🔥 ${highDeals} high (70+) | ⭐ ${mediumDeals} medium (40-69) | 💤 ${lowDeals} low (<40)\n`);

  // === PHASE 3: INSERT ===
  console.log('💾 PHASE 3: Inserting into Supabase...\n');

  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < scored.length; i++) {
    const listing = scored[i];
    const result = await insertListing(supabase, listing, 3);

    if (result.inserted) {
      inserted++;
    } else if (result.skipped) {
      skipped++;
    } else {
      failed++;
      console.error(`  ❌ Failed to insert: ${listing.title.slice(0, 50)} — ${result.error}`);
    }

    if ((i + 1) % 50 === 0) {
      console.log(`  ... ${i + 1}/${scored.length} processed (${inserted} inserted, ${skipped} skipped, ${failed} failed)`);
    }
  }

  // City breakdown from what we just inserted
  console.log('\n📊 City breakdown (this run):');
  for (const [city, count] of Object.entries(cityCounts)) {
    console.log(`  ${city}: ${count}`);
  }

  // === SUMMARY ===
  console.log('\n═══════════════════════════════════════');
  console.log('📊 PIPELINE COMPLETE');
  console.log('═══════════════════════════════════════');
  console.log(`   Scraped:  ${allListings.length} listings from ${CITIES.length} cities`);
  console.log(`   Scored:   ${scored.length} listings`);
  console.log(`   Inserted: ${inserted} new`);
  console.log(`   Skipped:  ${skipped} duplicates`);
  console.log(`   Failed:   ${failed} errors`);
  console.log(`   ⏰        ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════\n');
}

main().catch(err => {
  console.error('💥 Pipeline crashed:', err);
  process.exit(1);
});
