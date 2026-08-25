/**
 * Craigslist Free Stuff → Supabase pipeline
 * Scrapes, scores, deduplicates, inserts.
 *
 * Run: npx tsx workers/craigslist-scrape-and-insert.ts
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { scoreDeal } from '../src/lib/deal-scorer';

// ============================================================
// Config
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nmisxwzrbsyqihqwnvsx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const CITIES = [
  { name: 'denver', subdomain: 'denver', lat: 39.7392, lng: -104.9903, state: 'CO' },
  { name: 'boulder', subdomain: 'boulder', lat: 40.015, lng: -105.2705, state: 'CO' },
  { name: 'cosprings', subdomain: 'cosprings', lat: 38.8339, lng: -104.8214, state: 'CO' },
  { name: 'fortcollins', subdomain: 'fortcollins', lat: 40.5853, lng: -105.0844, state: 'CO' },
];

const SECTIONS = ['zip'];

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9',
};

const DELAY_MS = 2000;

// ============================================================
// Types
// ============================================================

interface CLRawListing {
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
}

// ============================================================
// Scrape one city
// ============================================================

async function scrapeCity(
  city: (typeof CITIES)[number],
): Promise<CLRawListing[]> {
  const url = `https://${city.subdomain}.craigslist.org/search/${SECTIONS[0]}#search=1~list~0~0`;
  console.log(`  Scraping: ${url}`);

  try {
    const response = await axios.get(url, { headers: HEADERS, timeout: 30000 });
    const $ = cheerio.load(response.data);
    const listings: CLRawListing[] = [];

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
        const location = locationEl.text().trim() || city.name;

        if (!title || !href) return;

        let price = 0;
        const priceMatch = priceText.match(/\$?([\d,]+)/);
        if (priceMatch && !priceText.toLowerCase().includes('free')) {
          price = parseInt(priceMatch[1].replace(/,/g, ''));
        }

        const sourceId = crypto
          .createHash('md5')
          .update(href)
          .digest('hex')
          .slice(0, 12);

        const hasImage = $el.find('img').length > 0;

        listings.push({
          sourceId,
          title,
          url: href.startsWith('http')
            ? href
            : `https://${city.subdomain}.craigslist.org${href}`,
          price,
          location,
          postedAt: '',
          hasImage,
          cityName: city.name,
          cityLat: city.lat,
          cityLng: city.lng,
          state: city.state,
        });
      } catch {
        // Skip malformed listings
      }
    });

    return listings;
  } catch (err: unknown) {
    console.error(`  ✗ Error scraping ${url}: ${(err as Error).message}`);
    return [];
  }
}

// ============================================================
// Main
// ============================================================

async function main() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set.');
    process.exit(1);
  }

  console.log('🆓 Craigslist Free Stuff → Supabase Pipeline');
  console.log(`   Cities: ${CITIES.length} | Supabase: ${SUPABASE_URL}\n`);

  // ---- Step 1: Scrape ----
  const allListings: CLRawListing[] = [];
  let totalScraped = 0;

  for (let ci = 0; ci < CITIES.length; ci++) {
    const city = CITIES[ci];
    console.log(`📍 ${city.name} (${city.subdomain}.craigslist.org)`);
    const listings = await scrapeCity(city);
    console.log(`   ✅ ${listings.length} listings`);
    totalScraped += listings.length;

    for (const listing of listings) {
      if (!allListings.find((l) => l.sourceId === listing.sourceId)) {
        allListings.push(listing);
      }
    }

    if (ci < CITIES.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  console.log(`\n📊 Total scraped: ${totalScraped} | Unique: ${allListings.length}`);

  if (allListings.length === 0) {
    console.log('No listings found. Exiting.');
    return;
  }

  // ---- Step 2: Score ----
  console.log('\n🎯 Scoring listings...');
  const scored = allListings.map((raw) => {
    const result = scoreDeal({
      title: raw.title,
      description: '',
      price: raw.price,
      category: 'free-stuff',
      condition: 'unknown',
      postedAt: Date.now(), // Treat as "just found"
    });
    return { raw, score: result };
  });

  // stats
  const above50 = scored.filter((s) => s.score.score >= 50);
  const above70 = scored.filter((s) => s.score.score >= 70);
  console.log(
    `   Scored ≥50: ${above50.length} | ≥70: ${above70.length} | Max: ${Math.max(
      ...scored.map((s) => s.score.score),
    )}`,
  );

  // ---- Step 3: Insert into Supabase ----
  console.log('\n💾 Inserting into Supabase...');
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const { raw, score } of scored) {
    try {
      // Build the listing row
      const row = {
        source: 'craigslist',
        source_url: raw.url,
        source_id: raw.sourceId,
        title: raw.title,
        description: null,
        photos: raw.hasImage ? [] : [],
        price: raw.price,
        estimated_value: null,
        category: 'free-stuff',
        brand: null,
        model: null,
        condition: 'unknown',
        flags: score.flags.length > 0 ? score.flags : [],
        // PostGIS: ST_SetSRID(ST_MakePoint(lng, lat), 4326)
        location: `SRID=4326;POINT(${raw.cityLng} ${raw.cityLat})`,
        city: raw.cityName,
        state: raw.state,
        zip: null,
        posted_at: new Date().toISOString(),
        expires_at: null,
        ai_processed: false,
      };

      const { error } = await supabase
        .from('listings')
        .upsert(row, {
          onConflict: 'source, source_id',
          ignoreDuplicates: false,
        });

      if (error) {
        // Duplicate — this is expected for existing listings
        if (error.message?.includes('duplicate') || error.code === '23505') {
          skipped++;
        } else {
          console.error(`  ✗ Insert error for "${raw.title.slice(0, 50)}": ${error.message}`);
          errors++;
        }
      } else {
        inserted++;
      }
    } catch (err: unknown) {
      console.error(`  ✗ Exception for "${raw.title.slice(0, 50)}": ${(err as Error).message}`);
      errors++;
    }
  }

  // ---- Report ----
  console.log('\n═══════════════════════════════════════');
  console.log('📋 FINAL REPORT');
  console.log('═══════════════════════════════════════');
  console.log(`   Scraped:      ${totalScraped}`);
  console.log(`   Unique:       ${allListings.length}`);
  console.log(`   Scored ≥50:   ${above50.length}`);
  console.log(`   Scored ≥70:   ${above70.length}`);
  console.log(`   Inserted:     ${inserted}`);
  console.log(`   Duplicates:   ${skipped}`);
  console.log(`   Errors:       ${errors}`);
  console.log('═══════════════════════════════════════');

  if (inserted === 0 && above50.length === 0) {
    console.log('\n💤 No new high-value listings found.');
  }

  // Show top 10
  if (above50.length > 0) {
    console.log('\n🏆 Top scored listings:');
    scored
      .filter((s) => s.score.score >= 50)
      .sort((a, b) => b.score.score - a.score.score)
      .slice(0, 10)
      .forEach(({ raw, score }) => {
        console.log(
          `   ${String(score.score).padStart(3)} | ${raw.title.slice(0, 55).padEnd(55)} | ${raw.cityName}`,
        );
        if (score.flags.length) {
          console.log(`        Flags: ${score.flags.join(', ')}`);
        }
      });
  }

  return { totalScraped, unique: allListings.length, above50: above50.length, inserted, skipped, errors };
}

main()
  .then(() => {
    console.log('\n✅ Pipeline complete.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Fatal:', err);
    process.exit(1);
  });
