import { Listing, ListingFlag } from '@/types';
import { createServiceClient } from '@/lib/supabase/service';
import DealFeedClient from '@/components/DealFeedClient';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Mock data fallback — shown when Supabase isn't configured yet
const MOCK_DEALS: Listing[] = [
  {
    id: '1', source: 'facebook', sourceUrl: '#', title: 'Herman Miller Aeron Chair — Size B',
    description: 'Fully loaded with lumbar support. Minor scuff on base.', photos: [],
    price: 50, estimatedValue: 650, category: 'furniture', condition: 'good',
    flags: ['undervalued'], location: { lat: 39.7392, lng: -104.9903, city: 'Denver', state: 'CO' },
    postedAt: Date.now() - 1200000, expiresAt: null,
  },
  {
    id: '2', source: 'craigslist', sourceUrl: '#', title: 'RTX 4090 Founders Edition — Open Box',
    description: 'Used for 3 months. Still has warranty. Original box included.', photos: [],
    price: 900, estimatedValue: 1600, category: 'electronics', condition: 'like-new',
    flags: ['undervalued', 'high-value'], location: { lat: 39.7392, lng: -104.9903, city: 'Denver', state: 'CO' },
    postedAt: Date.now() - 3600000, expiresAt: null,
  },
  {
    id: '3', source: 'nextdoor', sourceUrl: '#', title: 'Moving Sale — Free Sectional Couch',
    description: 'Dark gray, 3 years old. No pets, no stains. Must pick up tonight.', photos: [],
    price: 0, estimatedValue: 800, category: 'furniture', condition: 'good',
    flags: ['free', 'expiring-soon'], location: { lat: 39.7392, lng: -104.9903, city: 'Denver', state: 'CO' },
    postedAt: Date.now() - 600000, expiresAt: null,
  },
  {
    id: '4', source: 'ebay', sourceUrl: '#', title: 'PSA 10 Charizard VMAX — Shining Fates',
    description: 'Perfect centering. Just graded. POP 230.', photos: [],
    price: 180, estimatedValue: 320, category: 'trading_cards', condition: 'new',
    flags: ['undervalued'], location: { lat: 39.7392, lng: -104.9903, city: 'Denver', state: 'CO' },
    postedAt: Date.now() - 2400000, expiresAt: null,
  },
  {
    id: '5', source: 'offerup', sourceUrl: '#', title: 'Nike Air Jordan 1 Retro High OG — Deadstock',
    description: 'Size 11. Never worn. Original box and receipt.', photos: [],
    price: 220, estimatedValue: 380, category: 'sneakers', condition: 'new',
    flags: ['high-value'], location: { lat: 39.7392, lng: -104.9903, city: 'Denver', state: 'CO' },
    postedAt: Date.now() - 1800000, expiresAt: null,
  },
  {
    id: '6', source: 'facebook', sourceUrl: '#', title: 'Rolex Datejust 16233 — Two Tone',
    description: '1998 model. Box and papers. Serviced January 2026.', photos: [],
    price: 4200, estimatedValue: 6200, category: 'watches', condition: 'good',
    flags: ['undervalued', 'high-value'], location: { lat: 39.7392, lng: -104.9903, city: 'Denver', state: 'CO' },
    postedAt: Date.now() - 7200000, expiresAt: null,
  },
];

async function getListings(): Promise<Listing[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && supabaseUrl.length > 10) {
    try {
      const supabase = createServiceClient();
      const { data } = await supabase
        .from('listings')
        .select('*')
        .order('posted_at', { ascending: false })
        .limit(50);

      if (data && data.length > 0) {
        return (data as any[]).map((row: Record<string, unknown>): Listing => ({
          id: row.id as string,
          source: (row.source as Listing['source']) || 'craigslist',
          sourceUrl: (row.source_url as string) || '#',
          title: row.title as string,
          description: (row.description as string) || '',
          photos: (row.photos as string[]) || [],
          price: (row.price as number) || 0,
          estimatedValue: null,
          category: (row.category as string) || 'free-stuff',
          condition: (row.condition as Listing['condition']) || 'unknown',
          flags: (row.price === 0 ? ['free'] : []) as ListingFlag[],
          location: { lat: 39.7392, lng: -104.9903, city: (row.city as string) || 'Denver', state: 'CO' },
          postedAt: new Date(row.posted_at as string).getTime(),
          expiresAt: null,
        }));
      }
    } catch {
      // Supabase not configured or unreachable — use mock data
    }
  }
  return MOCK_DEALS;
}

export default async function HomePage() {
  const listings = await getListings();
  return (
    <ErrorBoundary label="The deal feed">
      <DealFeedClient initialListings={listings} />
    </ErrorBoundary>
  );
}
