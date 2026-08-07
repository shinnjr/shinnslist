'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import type { Listing } from '@/types';
import TopDealCard from '@/components/TopDealCard';
import { EmptyState } from '@/components/ErrorBoundary';
import { analyzeTopDeal, type TopDealAnalysis } from '@/lib/top-deals';
import { categorySlug, getSub, isUnlocked, recordSub } from '@/lib/subscription';
import { DENVER } from '@/lib/geo';
import { track } from '@/lib/track';
import { formatPrice, timeAgo } from '@/lib/utils';

const SUPABASE_URL = 'https://nmisxwzrbsyqihqwnvsx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable__hPy32xbnBwGYQHKNiiw-g_zWrx2bSC';
const BLURRED_COUNT = 5; // top N deals are subscribers-only

export default function TopDealsPage() {
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locResolved, setLocResolved] = useState(false);
  const [lastScraped, setLastScraped] = useState<string | null>(null);

  // Checkout success: ?subscribed=1&v=vertical-slug (or plan=pro) → record entitlement
  useEffect(() => {
    const subscribed = searchParams.get('subscribed');
    if (subscribed === '1') {
      const v = searchParams.get('v');
      const plan = searchParams.get('plan') || (v ? `vertical-${v}` : 'pro');
      recordSub(plan, v);
      track('checkout_success', { plan, vertical: v || undefined });
      // strip params without a reload
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  // Fetch listings
  const fetchListings = useCallback(async () => {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/listings?select=*&order=posted_at.desc&limit=200`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const mapped: Listing[] = data.map((row: any) => ({
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
        flags: row.flags || [],
        location: {
          lat: row.lat ?? 39.7392,
          lng: row.lng ?? -104.9903,
          city: row.city || 'Denver',
          state: row.state || 'CO',
        },
        postedAt: new Date(row.posted_at).getTime(),
        expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : null,
      }));
      setListings(mapped);
      setLastScraped(new Date().toLocaleTimeString());
    } catch (e) {
      console.warn('Supabase fetch failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(fetchListings, 120000);
    return () => clearInterval(interval);
  }, [fetchListings]);

  // Silent geolocation — fallback to Denver (James's market) on timeout/denial
  useEffect(() => {
    if (!('geolocation' in navigator)) { setLocResolved(true); return; }
    const timer = setTimeout(() => { setLocResolved(true); }, 4000);
    navigator.geolocation.getCurrentPosition(
      (pos) => { clearTimeout(timer); setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocResolved(true); },
      () => { clearTimeout(timer); setLocResolved(true); },
      { timeout: 4000, maximumAge: 600000 }
    );
  }, []);

  useEffect(() => {
    if (listings.length > 0) track('page_view', { extra: { page: 'top-deals' } });
  }, [listings.length]);

  // Ranked analyses
  const ranked = useMemo(() => {
    const loc = userLoc ?? (locResolved ? null : DENVER); // Denver default while resolving
    return listings
      .map((deal) => ({ deal, analysis: analyzeTopDeal(deal, loc) }))
      .sort((a, b) => b.analysis.score - a.analysis.score)
      .slice(0, 15);
  }, [listings, userLoc, locResolved]);

  const sub = getSub();
  const allIn = !!sub?.allIn;
  const hero = ranked[0];
  const rest = ranked.slice(1);
  const lockedCount = ranked.slice(0, BLURRED_COUNT).filter(({ deal }) => !allIn && !isUnlocked(categorySlug(deal.category))).length;

  if (loading) {
    return (
      <main className="flex-1 max-w-7xl mx-auto px-4 pt-8 pb-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-zinc-800 rounded-lg w-64" />
          <div className="h-4 bg-zinc-800 rounded w-96" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-72 bg-zinc-800/60 rounded-2xl" />)}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <section className="max-w-7xl mx-auto px-4 pt-8 pb-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              🏆 <span className="text-[var(--shinnslist-pink)]">Top Deals</span> of the Day
            </h1>
            <p className="text-[var(--shinnslist-muted)] mt-1 text-sm">
              Ranked by value gap × FBM speed × how close they are to you{lastScraped ? ` · refreshed ${lastScraped}` : ''}
            </p>
          </div>
          {lockedCount > 0 && (
            <div className="flex items-center gap-2 text-xs bg-[var(--shinnslist-pink)]/10 border border-[var(--shinnslist-pink)]/30 text-[var(--shinnslist-pink)] px-3 py-2 rounded-full">
              🔒 {lockedCount} of the top {BLURRED_COUNT} are subscriber-only
            </div>
          )}
        </div>
        <p className="text-[11px] text-[var(--shinnslist-muted)]">
          {userLoc ? 'Ranked to your location' : 'Ranked to Denver by default — allow location for your exact commute'}
        </p>
      </section>

      {ranked.length === 0 ? (
        <section className="max-w-7xl mx-auto px-4 pb-16">
          <EmptyState message="No deals ranked yet" description="Scrapers are filling the feed — check back in a few minutes." emoji="🏆" />
        </section>
      ) : (
        <section className="max-w-7xl mx-auto px-4 pb-16">
          {/* Hero — #1 deal */}
          {hero && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-yellow-400 uppercase tracking-wide">Today&apos;s #1</span>
                <span className="text-[11px] text-[var(--shinnslist-muted)]">{timeAgo(hero.deal.postedAt)}</span>
              </div>
              <TopDealCard
                deal={hero.deal}
                rank={1}
                analysis={hero.analysis}
                locked={!allIn && !isUnlocked(categorySlug(hero.deal.category))}
                onUnlock={(slug) => { window.location.href = `/pricing?v=${slug}`; }}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rest.map(({ deal, analysis }, idx) => (
              <TopDealCard
                key={deal.id}
                deal={deal}
                rank={idx + 2}
                analysis={analysis}
                locked={idx + 1 < BLURRED_COUNT && !allIn && !isUnlocked(categorySlug(deal.category))}
                onUnlock={(slug) => { window.location.href = `/pricing?v=${slug}`; }}
              />
            ))}
          </div>

          {/* Blur CTA band */}
          {!allIn && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 bg-gradient-to-r from-[var(--shinnslist-pink)]/10 via-fuchsia-600/10 to-purple-600/10 border border-[var(--shinnslist-border)] rounded-2xl p-6 max-w-3xl mx-auto text-center"
            >
              <h2 className="text-lg font-bold text-white mb-1">The top 5 deals are blurred for a reason.</h2>
              <p className="text-[var(--shinnslist-muted)] text-sm mb-4">
                By the time you spot them yourself, someone with instant access already messaged the seller.
                Unlock your vertical for <span className="text-[var(--shinnslist-green)] font-bold">$1/week</span> — or everything for $5/week.
              </p>
              <a
                href="/pricing"
                className="inline-flex min-h-[48px] items-center bg-[var(--shinnslist-pink)] text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-fuchsia-600 active:scale-[0.97] transition-all"
              >
                Unlock the top deals →
              </a>
            </motion.div>
          )}
        </section>
      )}
    </main>
  );
}
