import DealFeedClient from '@/components/DealFeedClient';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Listing, ListingFlag } from '@/types';

const SUPABASE_URL = 'https://nmisxwzrbsyqihqwnvsx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable__hPy32xbnBwGYQHKNiiw-g_zWrx2bSC';

async function fetchListings(): Promise<Listing[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/listings?select=*&order=posted_at.desc&limit=100`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: 60 }, // ISR: refresh every 60 seconds
      }
    );
    if (!res.ok) return [];
    const data = await res.json();

    return data.map((row: any): Listing => ({
      id: row.id,
      source: row.source || 'unknown',
      sourceUrl: row.source_url || '#',
      title: row.title,
      description: row.description || '',
      photos: row.photos || [],
      price: row.price || 0,
      estimatedValue: row.estimated_value || null,
      category: row.category || 'free-stuff',
      condition: row.condition || 'unknown',
      flags: (row.flags || []) as ListingFlag[],
      location: {
        lat: 39.7392,
        lng: -104.9903,
        city: row.city || 'Denver',
        state: row.state || 'CO',
      },
      postedAt: new Date(row.posted_at).getTime(),
      expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : null,
    }));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const initialListings = await fetchListings();

  return (
    <ErrorBoundary>
      <DealFeedClient initialListings={initialListings} />
    </ErrorBoundary>
  );
}
