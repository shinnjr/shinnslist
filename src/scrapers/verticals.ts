import { VerticalConfig } from './types';

// === 10 Vertical Configs ===
// Each vertical: sources → scraping strategy → parsing rules → deal scoring API

export const VERTICAL_CONFIGS: VerticalConfig[] = [
  // 1. FREE STUFF
  {
    id: 'free-stuff',
    name: 'Free Stuff',
    emoji: '🆓',
    description: 'Everything listed for $0 across all marketplaces',
    sources: [
      {
        name: 'craigslist_free',
        method: 'html',
        proxy: false,
        urls: [
          'https://denver.craigslist.org/search/zip',
          'https://boulder.craigslist.org/search/zip',
          'https://cosprings.craigslist.org/search/zip',
        ],
        scheduleMinutes: 10,
        parseListing: 'craigslist_gallery',
      },
      {
        name: 'facebook_free',
        method: 'browser',
        proxy: true,
        urls: ['https://www.facebook.com/marketplace/denver/free'],
        scheduleMinutes: 15,
        parseListing: 'facebook_marketplace',
      },
      {
        name: 'nextdoor_free',
        method: 'browser',
        proxy: true,
        urls: ['https://nextdoor.com/for_sale/free'],
        scheduleMinutes: 30,
        parseListing: 'nextdoor',
      },
      {
        name: 'offerup_free',
        method: 'browser',
        proxy: false,
        urls: ['https://offerup.com/explore/s/?deliveryParam=all&maxPrice=0&radius=25'],
        scheduleMinutes: 15,
        parseListing: 'offerup',
      },
      {
        name: 'trashnothing',
        method: 'html',
        proxy: false,
        urls: ['https://trashnothing.com/denver/posts/free'],
        scheduleMinutes: 20,
        parseListing: 'trashnothing',
      },
    ],
    dealScoring: {
      provider: 'msrp_lookup',
      method: 'google_shopping_api',
      inputFields: ['title', 'brand', 'model'],
    },
    normalizationRules: {
      titlePatterns: ['(.*?)(?:-|–|\\().*', '(.*)'],
      priceField: 'price',
      locationField: 'location',
    },
  },

  // 2. TRADING CARDS
  {
    id: 'trading-cards',
    name: 'Trading Cards',
    emoji: '🎴',
    description: 'Pokémon, Magic, Yu-Gi-Oh, sports cards — every marketplace',
    sources: [
      {
        name: 'ebay_cards',
        method: 'html',
        proxy: false,
        urls: ['https://www.ebay.com/sch/Trading-Card-Games/183454/i.html'],
        scheduleMinutes: 5,
        parseListing: 'ebay_search',
      },
      {
        name: 'tcgplayer',
        method: 'html',
        proxy: false,
        urls: ['https://www.tcgplayer.com/search/pokemon'],
        scheduleMinutes: 15,
        parseListing: 'tcgplayer',
      },
      {
        name: 'whatnot',
        method: 'browser',
        proxy: false,
        urls: ['https://www.whatnot.com/category/pokemon'],
        scheduleMinutes: 30,
        parseListing: 'whatnot',
      },
    ],
    dealScoring: {
      provider: 'justtcg',
      method: 'market_price',
      inputFields: ['card_name', 'set', 'condition', 'grade'],
    },
    normalizationRules: {
      titlePatterns: ['(.*?)\\s*-\\s*(.*?)\\s*(PSA|CGC|BGS)?\\s*(\\d+)?.*'],
      priceField: 'price',
      locationField: 'itemLocation',
    },
  },

  // 3. SNEAKERS
  {
    id: 'sneakers',
    name: 'Sneakers',
    emoji: '👟',
    description: 'Jordans, Yeezys, Dunks, Air Max across StockX, GOAT, eBay, FB',
    sources: [
      {
        name: 'ebay_sneakers',
        method: 'html',
        proxy: false,
        urls: ['https://www.ebay.com/sch/Athletic-Shoes/15709/i.html'],
        scheduleMinutes: 5,
        parseListing: 'ebay_search',
      },
      {
        name: 'facebook_sneakers',
        method: 'browser',
        proxy: true,
        urls: ['https://www.facebook.com/marketplace/denver/search?query=sneakers'],
        scheduleMinutes: 15,
        parseListing: 'facebook_marketplace',
      },
    ],
    dealScoring: {
      provider: 'stockx',
      method: 'market_value',
      inputFields: ['sku', 'size', 'condition'],
    },
    normalizationRules: {
      titlePatterns: ['(Nike|Adidas|Jordan|Yeezy|New Balance|ASICS).*(\\d+(\\.5)?).*(DS|VNDS|Used|New)'],
      priceField: 'price',
      locationField: 'itemLocation',
    },
  },

  // 4. WATCHES
  {
    id: 'watches',
    name: 'Watches',
    emoji: '⌚',
    description: 'Rolex, Omega, Seiko, Patek — Chrono24, eBay, r/Watchexchange',
    sources: [
      {
        name: 'ebay_watches',
        method: 'html',
        proxy: false,
        urls: ['https://www.ebay.com/sch/Wristwatches/31387/i.html'],
        scheduleMinutes: 10,
        parseListing: 'ebay_search',
      },
      {
        name: 'reddit_watchexchange',
        method: 'html',
        proxy: false,
        urls: ['https://www.reddit.com/r/Watchexchange/new.json'],
        scheduleMinutes: 5,
        parseListing: 'reddit_json',
      },
    ],
    dealScoring: {
      provider: 'watchcharts',
      method: 'market_price',
      inputFields: ['brand', 'reference_number', 'condition'],
    },
    normalizationRules: {
      titlePatterns: ['\\[WTS\\]\\s*(.*?)(?:\\$|USD|EUR)'],
      priceField: 'price',
      locationField: 'sellerLocation',
    },
  },

  // 5. LEGOS
  {
    id: 'legos',
    name: 'Legos',
    emoji: '🧱',
    description: 'Sets, minifigures, bulk lots — Bricklink, eBay, FB Marketplace',
    sources: [
      {
        name: 'ebay_legos',
        method: 'html',
        proxy: false,
        urls: ['https://www.ebay.com/sch/LEGO/18989/i.html'],
        scheduleMinutes: 10,
        parseListing: 'ebay_search',
      },
      {
        name: 'bricklink',
        method: 'html',
        proxy: false,
        urls: ['https://www.bricklink.com/v2/search.page?q=*'],
        scheduleMinutes: 60,
        parseListing: 'bricklink',
      },
    ],
    dealScoring: {
      provider: 'bricklink',
      method: 'price_guide',
      inputFields: ['set_number', 'condition'],
    },
    normalizationRules: {
      titlePatterns: ['LEGO\\s*(\\d{4,6})[\\s-]*(.*)'],
      priceField: 'price',
      locationField: 'itemLocation',
    },
  },

  // 6. HANDBAGS
  {
    id: 'handbags',
    name: 'Luxury Handbags',
    emoji: '👜',
    description: 'Chanel, Hermès, Louis Vuitton, Gucci — Fashionphile, Rebag, eBay',
    sources: [
      {
        name: 'fashionphile',
        method: 'html',
        proxy: false,
        urls: ['https://www.fashionphile.com/collections/all-bags'],
        scheduleMinutes: 30,
        parseListing: 'fashionphile',
      },
      {
        name: 'ebay_handbags',
        method: 'html',
        proxy: false,
        urls: ['https://www.ebay.com/sch/Designer-Bags/169291/i.html'],
        scheduleMinutes: 10,
        parseListing: 'ebay_search',
      },
    ],
    dealScoring: {
      provider: 'ebay_sold',
      method: 'completed_listings',
      inputFields: ['brand', 'model', 'condition', 'material'],
    },
    normalizationRules: {
      titlePatterns: ['(Chanel|Hermès|Louis Vuitton|Gucci|Dior|Prada|Fendi|Celine|YSL|Bottega).*(Bag|Tote|Flap|Birkin|Kelly)'],
      priceField: 'price',
      locationField: 'itemLocation',
    },
  },

  // 7. ELECTRONICS / GPUs / PHONES
  {
    id: 'electronics',
    name: 'Electronics & GPUs',
    emoji: '💻',
    description: 'RTX 4090s, MacBooks, iPhones — Swappa, eBay, r/hardwareswap',
    sources: [
      {
        name: 'swappa',
        method: 'html',
        proxy: false,
        urls: ['https://swappa.com/mobile'],
        scheduleMinutes: 10,
        parseListing: 'swappa',
      },
      {
        name: 'ebay_electronics',
        method: 'html',
        proxy: false,
        urls: ['https://www.ebay.com/sch/Computers-Tablets-Networking/58058/i.html'],
        scheduleMinutes: 10,
        parseListing: 'ebay_search',
      },
      {
        name: 'reddit_hardwareswap',
        method: 'html',
        proxy: false,
        urls: ['https://www.reddit.com/r/hardwareswap/new.json'],
        scheduleMinutes: 5,
        parseListing: 'reddit_json',
      },
    ],
    dealScoring: {
      provider: 'ebay_sold',
      method: 'completed_listings',
      inputFields: ['model', 'condition', 'specs'],
    },
    normalizationRules: {
      titlePatterns: ['(RTX|GTX|RX)\\s*(\\d{4})\\s*(Ti|Super)?|(iPhone|MacBook|iPad).*(\\d{1,2}(?:th|Pro|Max|Air)?)'],
      priceField: 'price',
      locationField: 'location',
    },
  },

  // 8. CARS
  {
    id: 'cars',
    name: 'Cars',
    emoji: '🚗',
    description: 'FB Marketplace, Craigslist, OfferUp, AutoTrader — KBB deal scores',
    sources: [
      {
        name: 'craigslist_cars',
        method: 'html',
        proxy: false,
        urls: [
          'https://denver.craigslist.org/search/cta',
          'https://denver.craigslist.org/search/cto',
        ],
        scheduleMinutes: 10,
        parseListing: 'craigslist_gallery',
      },
      {
        name: 'facebook_cars',
        method: 'browser',
        proxy: true,
        urls: ['https://www.facebook.com/marketplace/denver/vehicles'],
        scheduleMinutes: 15,
        parseListing: 'facebook_marketplace',
      },
    ],
    dealScoring: {
      provider: 'vehicle_databases',
      method: 'market_value',
      inputFields: ['vin', 'year', 'make', 'model', 'mileage', 'condition'],
    },
    normalizationRules: {
      titlePatterns: ['(\\d{4})\\s*(.*?)(?:\\s|$)'],
      priceField: 'price',
      locationField: 'location',
    },
  },

  // 9. REAL ESTATE / LAND
  {
    id: 'real-estate',
    name: 'Real Estate',
    emoji: '🏠',
    description: 'Homes, condos, raw land — Zillow, Redfin, Realtor.com deal scores',
    sources: [
      {
        name: 'zillow_homes',
        method: 'browser',
        proxy: false,
        urls: ['https://www.zillow.com/denver-co/'],
        scheduleMinutes: 30,
        parseListing: 'zillow',
      },
      {
        name: 'redfin',
        method: 'browser',
        proxy: false,
        urls: ['https://www.redfin.com/city/11602/CO/Denver'],
        scheduleMinutes: 30,
        parseListing: 'redfin',
      },
    ],
    dealScoring: {
      provider: 'zillow',
      method: 'zestimate',
      inputFields: ['address', 'beds', 'baths', 'sqft', 'lot_size'],
    },
    normalizationRules: {
      titlePatterns: ['(.*?),(.*?),(\\d{5})'],
      priceField: 'price',
      locationField: 'address',
    },
  },

  // 10. RENTALS
  {
    id: 'rentals',
    name: 'Rental Apartments',
    emoji: '🏢',
    description: 'Apartments, condos for rent — Zillow, Zumper, PadMapper — below market alerts',
    sources: [
      {
        name: 'zillow_rentals',
        method: 'browser',
        proxy: false,
        urls: ['https://www.zillow.com/denver-co/rentals/'],
        scheduleMinutes: 30,
        parseListing: 'zillow',
      },
      {
        name: 'zumper',
        method: 'html',
        proxy: false,
        urls: ['https://www.zumper.com/apartments-for-rent/denver-co'],
        scheduleMinutes: 30,
        parseListing: 'zumper',
      },
    ],
    dealScoring: {
      provider: 'rent_estimate',
      method: 'comps_per_sqft',
      inputFields: ['beds', 'baths', 'sqft', 'zip', 'amenities'],
    },
    normalizationRules: {
      titlePatterns: ['(.*?),(.*?),(\\d{5})'],
      priceField: 'price',
      locationField: 'address',
    },
  },
];
