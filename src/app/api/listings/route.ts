export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { Listing, ListingFlag } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') || '39.7392');
  const lng = parseFloat(searchParams.get('lng') || '-104.9903');
  const radius = parseInt(searchParams.get('radius') || '25');
  const limit = parseInt(searchParams.get('limit') || '50');
  const tab = searchParams.get('tab') || 'latest';

  try {
    const supabase = createServiceClient();

    let query = supabase.rpc('nearby_listings', {
      lng,
      lat,
      radius_miles: radius,
      result_limit: limit,
    });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching listings:', error);
      return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
    }

    const listings: Listing[] = (data || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      source: row.source as Listing['source'],
      sourceUrl: (row.source_url as string) || '',
      title: row.title as string,
      description: (row.description as string) || '',
      photos: (row.photos as string[]) || [],
      price: parseFloat(String(row.price || 0)),
      estimatedValue: row.estimated_value ? parseFloat(String(row.estimated_value)) : null,
      category: (row.category as string) || '',
      condition: (row.condition as Listing['condition']) || 'unknown',
      flags: (row.flags as ListingFlag[] | null) || [],
      location: {
        lat,
        lng,
        city: (row.city as string) || 'Denver',
        state: (row.state as string) || 'CO',
      },
      postedAt: new Date(row.posted_at as string).getTime(),
      expiresAt: row.expires_at ? new Date(row.expires_at as string).getTime() : null,
    }));

    return NextResponse.json({ listings });
  } catch (e) {
    console.error('Listings API error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
