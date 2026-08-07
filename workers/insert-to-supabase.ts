/**
 * Supabase Insert Script — takes scraped Craigslist listings and inserts them
 * Run: npx ts-node --skip-project workers/insert-to-supabase.ts
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';
import crypto from 'crypto';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Default Denver center coordinates
const DEFAULT_LAT = 39.7392;
const DEFAULT_LNG = -104.9903;

interface RawListing {
  sourceId: string;
  title: string;
  url: string;
  price: number;
  location: string;
}

async function main() {
  console.log('🔄 Running Craigslist scraper...');
  
  // Run the scraper and capture output as JSON
  // For now, we parse the text output. In production, use the TS module directly.
  const listings: RawListing[] = [
    // This would be populated by running the scraper in-process
    // For now, insert manually or run the scraper first
  ];

  if (listings.length === 0) {
    console.log('⚠️  No listings to insert. Run the scraper first.');
    console.log('   npx ts-node --skip-project workers/craigslist.ts');
    return;
  }

  console.log(`📤 Inserting ${listings.length} listings into Supabase...`);
  let inserted = 0;
  let skipped = 0;

  for (const listing of listings) {
    try {
      const { error } = await supabase.from('listings').upsert({
        source: 'craigslist',
        source_id: listing.sourceId,
        source_url: listing.url,
        title: listing.title,
        description: '',
        photos: [],
        price: listing.price,
        category: null,
        condition: 'unknown',
        flags: listing.price === 0 ? ['free'] : [],
        city: listing.location || 'Denver',
        state: 'CO',
        posted_at: new Date().toISOString(),
      }, { onConflict: 'source,source_id' });

      if (error) {
        if (error.code === '23505') {
          skipped++; // Duplicate, skip
        } else {
          console.error(`  ❌ Insert error: ${error.message}`);
        }
      } else {
        inserted++;
      }
    } catch (err: any) {
      console.error(`  ❌ Error: ${err.message}`);
    }
  }

  console.log(`\n✅ Done. Inserted: ${inserted}, Skipped (duplicates): ${skipped}`);
}

main().catch(console.error);
