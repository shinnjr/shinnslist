// === Multi-Vertical Scraper Engine Types ===

export type ScraperMethod = 'html' | 'browser';

export interface ScraperSource {
  name: string;                    // e.g. 'facebook_marketplace', 'craigslist_free'
  method: ScraperMethod;
  proxy: boolean;
  urls: string[];                  // URLs to scrape
  scheduleMinutes: number;         // how often to scrape
  parseListing: string;            // reference to parser function name
}

export interface VerticalDealScore {
  provider: string;                // API name: 'kbb', 'watchcharts', 'ebay_sold'
  method: string;                  // API endpoint or function
  inputFields: string[];           // what data goes into the scoring function
}

export interface VerticalConfig {
  id: string;                      // e.g. 'cars', 'trading-cards', 'sneakers'
  name: string;
  emoji: string;
  description: string;
  sources: ScraperSource[];
  dealScoring: VerticalDealScore;
  normalizationRules: {
    titlePatterns: string[];       // regex patterns for extracting brand/model from titles
    priceField: string;           // where to find the price in source data
    locationField: string;        // where to find location info
  };
}

export interface RawListing {
  source: string;
  sourceId: string;
  sourceUrl: string;
  rawData: Record<string, unknown>;
  scrapedAt: string;
}

export interface ScrapedListing {
  source: string;                   // normalized source name
  sourceId: string;                 // unique ID from source (for dedup)
  sourceUrl: string;
  title: string;
  description: string;
  photos: string[];
  price: number;
  location: {
    lat: number;
    lng: number;
    city: string;
    state: string;
  };
  postedAt: string;
  verticalId: string;              // which vertical this belongs to
  rawBrand?: string;               // extracted brand name
  rawModel?: string;               // extracted model/SKU
  condition: string;
}
