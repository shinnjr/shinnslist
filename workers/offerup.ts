/**
 * OfferUp Free Stuff Scraper
 * 
 * Scrapes OfferUp's web interface for free listings.
 * Run: npx ts-node --skip-project workers/offerup.ts
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9',
};

const CITIES = [
  { name: 'denver', lat: 39.7392, lng: -104.9903 },
  { name: 'boulder', lat: 40.0150, lng: -105.2705 },
  { name: 'colorado-springs', lat: 38.8339, lng: -104.8214 },
  { name: 'fort-collins', lat: 40.5853, lng: -105.0844 },
];

interface OfferUpListing {
  sourceId: string;
  title: string;
  url: string;
  price: number;
  location: string;
  imageUrl: string | null;
}

async function scrapeCity(city: typeof CITIES[0]): Promise<OfferUpListing[]> {
  // OfferUp's free stuff search URL by city
  const url = `https://offerup.com/explore/k/0/free/${city.name}/`;
  console.log(`  Scraping: ${url}`);

  try {
    const response = await axios.get(url, {
      headers: HEADERS,
      timeout: 15000,
      maxRedirects: 3,
    });

    const $ = cheerio.load(response.data);
    const listings: OfferUpListing[] = [];

    // OfferUp renders listings via JavaScript — the HTML might be sparse
    // Look for listing cards, handles, and embedded JSON data
    $('[data-testid="listing-card"], [class*="item"], [class*="listing"]').each((_i, el) => {
      try {
        const $el = $(el);
        const title = $el.find('[class*="title"], h2, h3').first().text().trim();
        const priceText = $el.find('[class*="price"], [data-testid="listing-card-price"]').first().text().trim();
        const locationText = $el.find('[class*="location"], [data-testid="listing-card-location"]').first().text().trim();
        const link = $el.find('a').first().attr('href') || '';
        const img = $el.find('img').first().attr('src') || null;

        if (!title) return;

        let price = 0;
        const priceMatch = priceText.match(/\$?([\d,]+)/);
        if (priceMatch && !priceText.toLowerCase().includes('free')) {
          price = parseInt(priceMatch[1].replace(/,/g, ''));
        }

        const sourceId = crypto.createHash('md5').update(title + (link || '')).digest('hex').slice(0, 12);

        listings.push({
          sourceId,
          title,
          url: link.startsWith('http') ? link : `https://offerup.com${link}`,
          price,
          location: locationText || city.name,
          imageUrl: img,
        });
      } catch {
        // Skip malformed
      }
    });

    return listings;
  } catch (err: any) {
    console.error(`  ❌ Error: ${err.message}`);
    return [];
  }
}

async function main() {
  console.log('🔄 OfferUp Free Stuff Scraper\n');

  let total = 0;
  const all: OfferUpListing[] = [];

  for (const city of CITIES) {
    console.log(`📍 ${city.name}`);
    const listings = await scrapeCity(city);
    console.log(`   ✅ Found ${listings.length} listings`);

    for (const l of listings) {
      if (!all.find(e => e.sourceId === l.sourceId)) {
        all.push(l);
      }
    }
    total += listings.length;

    if (CITIES.indexOf(city) < CITIES.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log(`\n📊 Total unique: ${all.length}`);
  console.log('\n📋 Sample:');
  all.slice(0, 10).forEach(l => {
    console.log(`  FREE     | ${l.title.slice(0, 60).padEnd(60)} | ${l.location}`);
  });

  console.log('\n💡 Note: OfferUp requires JavaScript rendering. If 0 results, use Playwright.');
  console.log('   npx playwright install && node --import tsx workers/offerup-playwright.ts');
}

main().catch(console.error);
