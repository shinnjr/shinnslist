/**
 * Craigslist Scraper → Deal Scorer → Supabase Inserter
 *
 * Run: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx workers/craigslist-scored.ts
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import * as crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { scoreDeal, ScoreInput } from '../src/lib/deal-scorer';

// === Types ===
interface CLListing {
  sourceId: string;
  title: string;
  url: string;
  price: number;
  location: string;
  postedAt: string;
  hasImage: boolean;
  cityName: string;
  cityLat: number;
  cityLng: number;
  state: string;
  source: string;
}

// === Config ===
const CITIES = [
  { name: 'denver', subdomain: 'denver', lat: 39.7392, lng: -104.9903, state: 'CO' },
  { name: 'boulder', subdomain: 'boulder', lat: 40.0150, lng: -105.2705, state: 'CO' },
  { name: 'cosprings', subdomain: 'cosprings', lat: 38.8339, lng: -104.8214, state: 'CO' },
  { name: 'fortcollins', subdomain: 'fortcollins', lat: 40.5853, lng: -105.0844, state: 'CO' },
];

const SECTIONS = ['zip'];

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9',
};

const DELAY_MS = 2000;

// === Supabase ===
function getSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }
  return createClient(url, key);
}

// === Scrape one city + section ===
async function scrapeCitySection(
  subdomain: string,
  section: string,
  cityName: string,
  cityLat: number,
  cityLng: number,
  state: string,
): Promise<CLListing[]> {
  const url = `https://${subdomain}.craigslist.org/search/${section}#search=1~list~0~0`;
  console.log(`  Scraping: ${url}`);

  try {
    const response = await axios.get(url, { headers: HEADERS, timeout: 30000 });
    const $ = cheerio.load(response.data);
    const listings: CLListing[] = [];

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
          cityName,
          cityLat,
          cityLng,
          state,
          source: 'craigslist',
        });
      } catch (_err) {
        // Skip malformed listings
      }
    });

    return listings;
  } catch (err: any) {
    console.error(`  Error scraping ${url}: ${err.message}`);
    return [];
  }
}

// === Score a listing ===
function scoreListing(listing: CLListing) {
  const input: ScoreInput = {
    title: listing.title,
    description: '',
    price: listing.price,
    originalPrice: undefined,
    category: 'free-stuff',
    condition: 'unknown',
    postedAt: Date.now(), // just posted — all are fresh from the scrape
  };
  return scoreDeal(input);
}

// === Insert into Supabase ===
async function insertListings(supabase: SupabaseClient, listings: CLListing[]): Promise<{ inserted: number; scored50plus: number }> {
  let inserted = 0;
  let scored50plus = 0;

  for (const listing of listings) {
    try {
      const scoreResult = scoreListing(listing);
      const isHighScore = scoreResult.score >= 50;
      if (isHighScore) scored50plus++;

      // PostGIS point: SRID 4326, (lng, lat)
      const point = `SRID=4326;POINT(${listing.cityLng} ${listing.cityLat})`;

      const { error } = await supabase
        .from('listings')
        .upsert({
          source: listing.source,
          source_id: listing.sourceId,
          source_url: listing.url,
          title: listing.title,
          description: '',
          photos: [],
          price: listing.price,
          estimated_value: null,
          category: 'free-stuff',
          condition: 'unknown',
          flags: scoreResult.flags,
          location: point,
          city: listing.cityName,
          state: listing.state,
          posted_at: listing.postedAt,
          ai_processed: false,
        }, {
          onConflict: 'source,source_id',
          ignoreDuplicates: false,
        });

      if (error) {
        // 23505 = unique violation (duplicate), expected and fine
        if (error.code === '23505') {
          continue; // already in DB — skip
        }
        console.warn(`  DB error for "${listing.title.slice(0, 50)}": ${error.message}`);
        continue;
      }

      inserted++;
    } catch (err: any) {
      console.warn(`  Error processing "${listing.title.slice(0, 50)}": ${err.message}`);
      continue;
    }
  }

  return { inserted, scored50plus };
}

// === Main ===
async function main() {
  console.log('🆓 Craigslist Scraper → Scorer → Supabase');
  console.log(`   Cities: ${CITIES.length} | Sections: ${SECTIONS.length}`);
  console.log(`   Total URLs: ${CITIES.length * SECTIONS.length}\n`);

  const supabase = getSupabase();
  const allListings: CLListing[] = [];

  for (const city of CITIES) {
    console.log(`📍 ${city.name} (${city.subdomain}.craigslist.org)`);

    for (const section of SECTIONS) {
      const listings = await scrapeCitySection(
        city.subdomain, section, city.name,
        city.lat, city.lng, city.state
      );
      console.log(`   ✅ Found ${listings.length} listings`);

      for (const listing of listings) {
        if (!allListings.find(l => l.sourceId === listing.sourceId)) {
          allListings.push(listing);
        }
      }

      if (section !== SECTIONS[SECTIONS.length - 1] || city !== CITIES[CITIES.length - 1]) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }
  }

  console.log(`\n📊 Total unique listings found: ${allListings.length}`);

  // Score and insert
  console.log('\n📊 Scoring and inserting...');
  const { inserted, scored50plus } = await insertListings(supabase, allListings);

  console.log(`\n═══════════════════════════════════════`);
  console.log(`📊 RESULTS`);
  console.log(`   Total scraped:       ${allListings.length}`);
  console.log(`   Scored ≥ 50/100:     ${scored50plus}`);
  console.log(`   Newly inserted:      ${inserted}`);
  console.log(`   Already in DB:       ${allListings.length - inserted}`);
  console.log(`═══════════════════════════════════════\n`);

  // Show top scored
  if (allListings.length > 0) {
    console.log('🏆 Top 10 by deal score:');
    const scored = allListings.map(l => ({ ...l, score: scoreListing(l).score }));
    scored.sort((a, b) => b.score - a.score);
    scored.slice(0, 10).forEach(l => {
      console.log(`  ${String(l.score).padStart(3)} | ${l.title.slice(0, 60).padEnd(60)} | ${l.cityName}`);
    });
  }

  console.log('\n✅ Done.');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
