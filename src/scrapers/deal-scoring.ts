// === Deal Scoring Pipeline ===
// Takes a raw listing + vertical config → calculates deal score
// Uses real APIs where available, fallback scraping where not

import { ScrapedListing } from './types';

export interface DealScoreResult {
  listingId: string;
  verticalId: string;
  marketValue: number | null;
  dealScore: number;           // 0-100, higher = better deal
  pctBelowMarket: number;      // percentage below market value
  confidence: number;           // 0-1, how confident we are in the market value
  comps: number;                // number of comparable sales found
  source: 'api' | 'scrape' | 'msrp' | 'free';  // how we determined market value
  scoredAt: string;
}

// PriceCharting API for cards, games
async function fetchPriceCharting(searchTerm: string): Promise<number | null> {
  try {
    const url = `https://www.pricecharting.com/api/products?t=${encodeURIComponent(searchTerm)}&type=json`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Shinnslist/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.products?.[0]) {
      // Use loose price (used condition) as market value baseline
      return parseFloat(data.products[0]['loose-price'] || '0') || null;
    }
    return null;
  } catch {
    return null;
  }
}

// KBB alternative - Vehicle Databases API
async function fetchVehicleValue(params: {
  year: number; make: string; model: string; mileage?: number;
}): Promise<number | null> {
  // Vehicle Databases API — requires API key
  // For now, use a simple market average lookup
  // In production: integrate with KBB developer portal or Vehicle Databases
  console.log(`[DealScore] Fetching vehicle value for ${params.year} ${params.make} ${params.model}`);
  return null; // Stub — replace with real API call
}

// WatchCharts API
async function fetchWatchValue(brand: string, referenceNumber: string): Promise<number | null> {
  // WatchCharts API — $600+/mo
  // Free tier only shows basic data
  console.log(`[DealScore] Fetching watch value for ${brand} ${referenceNumber}`);
  return null; // Stub — replace with real API call
}

// BrickLink Price Guide API
async function fetchLegoValue(setNumber: string, condition: string): Promise<number | null> {
  try {
    const url = `https://api.bricklink.com/v3/item/price_guide?item_no=${setNumber}&type=set&condition=${condition}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Shinnslist/1.0',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    // Average of last 6 months sold price
    if (data?.data?.avg_price) {
      return parseFloat(data.data.avg_price);
    }
    return null;
  } catch {
    return null;
  }
}

// eBay sold listings — scrape completed listings for comps
async function fetchEbaySold(searchTerm: string): Promise<{ avgPrice: number; count: number } | null> {
  console.log(`[DealScore] Fetching eBay sold comps for "${searchTerm}"`);
  // eBay Finding API or browse completed listings
  // Requires eBay developer app key
  return null; // Stub — replace with real eBay API integration
}

// Free stuff — look up MSRP
async function fetchMSRP(title: string, brand?: string, model?: string): Promise<number | null> {
  // Google Shopping API or scrape product pages
  // For free stuff, any non-zero MSRP = deal score 100
  console.log(`[DealScore] Looking up MSRP for "${brand || ''} ${model || ''} ${title}"`);
  return null; // Stub — replace with real MSRP API
}

// === Main Deal Score Calculator ===

export async function calculateDealScore(
  listing: ScrapedListing,
  verticalId: string,
): Promise<DealScoreResult> {
  const now = new Date().toISOString();
  const base: DealScoreResult = {
    listingId: listing.sourceId,
    verticalId,
    marketValue: null,
    dealScore: 0,
    pctBelowMarket: 0,
    confidence: 0,
    comps: 0,
    source: 'api',
    scoredAt: now,
  };

  // Free stuff: MSRP lookup. Anything free with an MSRP = perfect score.
  if (verticalId === 'free-stuff' && listing.price === 0) {
    const msrp = await fetchMSRP(listing.title, listing.rawBrand, listing.rawModel);
    if (msrp && msrp > 0) {
      return {
        ...base,
        marketValue: msrp,
        dealScore: 100,
        pctBelowMarket: 100,
        confidence: 0.5, // MSRP is retail, not market. Medium confidence.
        comps: 1,
        source: 'msrp',
      };
    }
    // Free but couldn't determine MSRP — still a deal
    return {
      ...base,
      dealScore: 80, // It's free, probably a deal
      pctBelowMarket: 100,
      confidence: 0.1,
      source: 'free',
    };
  }

  // Non-free items: compare listing price to market value
  try {
    let marketValue: number | null = null;

    switch (verticalId) {
      case 'trading-cards':
        marketValue = await fetchPriceCharting(listing.title);
        break;
      case 'sneakers':
        marketValue = null; // StockX API call
        break;
      case 'watches':
        marketValue = await fetchWatchValue(listing.rawBrand || '', listing.rawModel || '');
        break;
      case 'legos':
        marketValue = await fetchLegoValue(listing.rawModel || '', listing.condition);
        break;
      case 'handbags': {
        const ebayComps = await fetchEbaySold(listing.title);
        if (ebayComps) marketValue = ebayComps.avgPrice;
        break;
      }
      case 'electronics': {
        const ebayComps = await fetchEbaySold(listing.title);
        if (ebayComps) marketValue = ebayComps.avgPrice;
        break;
      }
      case 'instruments':
      case 'art':
      case 'sports-outdoor':
      case 'baby-kids': {
        const ebayComps = await fetchEbaySold(listing.title);
        if (ebayComps) marketValue = ebayComps.avgPrice;
        break;
      }
      case 'cars':
        marketValue = await fetchVehicleValue({
          year: parseInt(listing.title.match(/\d{4}/)?.[0] || '0'),
          make: listing.rawBrand || '',
          model: listing.rawModel || '',
        });
        break;
      case 'real-estate':
      case 'rentals':
        marketValue = null; // Zillow Zestimate API
        break;
    }

    if (marketValue && marketValue > 0 && listing.price > 0) {
      const pctBelow = ((marketValue - listing.price) / marketValue) * 100;
      return {
        ...base,
        marketValue,
        dealScore: Math.min(Math.round(pctBelow), 99),
        pctBelowMarket: Math.round(pctBelow),
        confidence: 0.7, // API-derived, good confidence
        comps: 1,
        source: 'api',
      };
    }
  } catch (err) {
    console.error(`[DealScore] Error scoring listing ${listing.sourceId}:`, err);
  }

  // Fallback: no market data available
  return {
    ...base,
    dealScore: listing.price === 0 ? 80 : 0,
    pctBelowMarket: 0,
    confidence: 0,
    source: 'api',
  };
}

// === Batch deal scoring ===

export async function scoreListings(
  listings: ScrapedListing[],
  verticalId: string,
  concurrency = 3,
): Promise<DealScoreResult[]> {
  const results: DealScoreResult[] = [];
  
  // Process in batches to respect API rate limits
  for (let i = 0; i < listings.length; i += concurrency) {
    const batch = listings.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(listing => calculateDealScore(listing, verticalId))
    );
    
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error('[DealScore] Batch scoring failed:', result.reason);
      }
    }

    // Rate limit: wait 1 second between batches
    if (i + concurrency < listings.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}
