/**
 * Craigslist Free Stuff Scraper
 * 
 * Run: npx ts-node --skip-project workers/craigslist.ts
 * Or:  node --loader ts-node/esm workers/craigslist.ts
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';

// === Types ===
interface CLListing {
  sourceId: string;
  title: string;
  url: string;
  price: number;
  location: string;
  postedAt: string;
  hasImage: boolean;
}

// === Config ===
const CITIES = [
  { name: 'denver', subdomain: 'denver', lat: 39.7392, lng: -104.9903, state: 'CO' },
  { name: 'boulder', subdomain: 'boulder', lat: 40.0150, lng: -105.2705, state: 'CO' },
  { name: 'cosprings', subdomain: 'cosprings', lat: 38.8339, lng: -104.8214, state: 'CO' },
  { name: 'fortcollins', subdomain: 'fortcollins', lat: 40.5853, lng: -105.0844, state: 'CO' },
];

const SECTIONS = ['zip']; // 'zip' = free stuff; add 'hsa', 'ele', 'tla' etc for paid items

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9',
};

const DELAY_MS = 2000; // Be polite to Craigslist servers

// === Scrape one city + section ===
async function scrapeCitySection(
  subdomain: string,
  section: string,
  cityName: string,
): Promise<CLListing[]> {
  const url = `https://${subdomain}.craigslist.org/search/${section}#search=1~list~0~0`;
  console.log(`  Scraping: ${url}`);

  try {
    const response = await axios.get(url, { headers: HEADERS, timeout: 30000 });
    const $ = cheerio.load(response.data);
    const listings: CLListing[] = [];

    // Craigslist static search results — each listing is <li class="cl-static-search-result">
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

        // Clean price — "$0" or "free" → 0
        let price = 0;
        const priceMatch = priceText.match(/\$?([\d,]+)/);
        if (priceMatch && !priceText.toLowerCase().includes('free')) {
          price = parseInt(priceMatch[1].replace(/,/g, ''));
        }

        // Generate deterministic source ID from URL
        const sourceId = crypto.createHash('md5').update(href).digest('hex').slice(0, 12);

        // Check for image
        const hasImage = $el.find('img').length > 0;

        listings.push({
          sourceId,
          title,
          url: href.startsWith('http') ? href : `https://${subdomain}.craigslist.org${href}`,
          price,
          location,
          postedAt: '',
          hasImage,
        });
      } catch (err) {
        // Skip malformed listings
      }
    });

    return listings;
  } catch (err: any) {
    console.error(`  Error scraping ${url}: ${err.message}`);
    return [];
  }
}

// === Main ===
async function main() {
  console.log('🆓 Craigslist Free Stuff Scraper');
  console.log(`   Cities: ${CITIES.length} | Sections: ${SECTIONS.length}`);
  console.log(`   Total URLs: ${CITIES.length * SECTIONS.length}\n`);

  let totalListings = 0;
  const allListings: CLListing[] = [];

  for (const city of CITIES) {
    console.log(`📍 ${city.name} (${city.subdomain}.craigslist.org)`);

    for (const section of SECTIONS) {
      const listings = await scrapeCitySection(city.subdomain, section, city.name);
      console.log(`   ✅ Found ${listings.length} listings`);

      // Deduplicate (in case same item scraped twice)
      for (const listing of listings) {
        if (!allListings.find(l => l.sourceId === listing.sourceId)) {
          allListings.push(listing);
        }
      }

      totalListings += listings.length;

      // Be polite
      if (CITIES.indexOf(city) < CITIES.length - 1 || SECTIONS.indexOf(section) < SECTIONS.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }
  }

  // === Output summary ===
  console.log(`\n📊 Total unique listings: ${allListings.length}`);

  // Top 5 by title (show what we found)
  console.log('\n📋 Sample listings:');
  allListings.slice(0, 10).forEach(l => {
    const priceLabel = l.price === 0 ? 'FREE' : `$${l.price}`;
    console.log(`  ${priceLabel.padEnd(8)} | ${l.title.slice(0, 60).padEnd(60)} | ${l.location}`);
  });

  console.log('\n✅ Done.');
  console.log('\n💡 To insert into Supabase, set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');

  // Export for use by Supabase insert script
  return allListings;
}

main().catch(console.error);
