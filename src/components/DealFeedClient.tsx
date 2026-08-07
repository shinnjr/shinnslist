'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Listing } from '@/types';
import { EmptyState } from './ErrorBoundary';
import { scoreDeal } from '@/lib/deal-scorer';
import { track } from '@/lib/track';

const SUPABASE_URL = 'https://nmisxwzrbsyqihqwnvsx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable__hPy32xbnBwGYQHKNiiw-g_zWrx2bSC';

interface Props {
  initialListings: Listing[];
}

const VERTICALS = [
  { id: 'all', label: 'All Deals', icon: '🏷️' },
  { id: 'free-stuff', label: 'Free Stuff', icon: '🆓' },
  { id: 'trading_cards', label: 'Cards', icon: '🃏' },
  { id: 'sneakers', label: 'Sneakers', icon: '👟' },
  { id: 'watches', label: 'Watches', icon: '⌚' },
  { id: 'legos', label: 'Legos', icon: '🧱' },
  { id: 'handbags', label: 'Handbags', icon: '👜' },
  { id: 'electronics', label: 'Electronics', icon: '💻' },
  { id: 'cars', label: 'Cars', icon: '🚗' },
  { id: 'real-estate', label: 'Homes', icon: '🏠' },
  { id: 'rentals', label: 'Rentals', icon: '🏢' },
  { id: 'instruments', label: 'Instruments', icon: '🎸' },
  { id: 'art', label: 'Art', icon: '🎨' },
  { id: 'sports-outdoor', label: 'Outdoor', icon: '🏔️' },
];

const FILTERS = ['All', 'FREE', '🔥 Hot', '📈 Trending', '✅ Quality', '💎 High Value'];

function timeAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getCategoryEmoji(cat: string): string {
  const map: Record<string, string> = {
    'trading_cards': '🃏', 'sneakers': '👟', 'watches': '⌚',
    'electronics': '💻', 'cars': '🚗', 'legos': '🧱',
    'handbags': '👜', 'instruments': '🎸', 'real-estate': '🏠',
    'rentals': '🏢', 'free-stuff': '📦', 'art': '🎨',
    'sports-outdoor': '🏔️',
  };
  return map[cat] || '📦';
}

export default function DealFeedClient({ initialListings }: Props) {
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [activeVertical, setActiveVertical] = useState('all');
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastScraped, setLastScraped] = useState<string | null>(null);
  const [sourceCount, setSourceCount] = useState(0);

  // Refresh data client-side periodically
  const fetchListings = useCallback(async () => {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/listings?select=*&order=posted_at.desc&limit=100`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data.length === 0) return;

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
          lat: 39.7392, lng: -104.9903,
          city: row.city || 'Denver', state: row.state || 'CO',
        },
        postedAt: new Date(row.posted_at).getTime(),
        expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : null,
      }));

      setListings(mapped);
      setSourceCount(new Set(mapped.map(l => l.source)).size);
      setLastScraped(new Date().toLocaleTimeString());
    } catch (e) {
      console.warn('Refresh failed:', e);
    }
  }, []);

  useEffect(() => {
    if (initialListings.length > 0) {
      setSourceCount(new Set(initialListings.map(l => l.source)).size);
      setLastScraped(new Date().toLocaleTimeString());
    }
  }, [initialListings]);

  useEffect(() => {
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchListings, 120000);
    return () => clearInterval(interval);
  }, [fetchListings]);

  const filtered = useMemo(() => {
    let items = listings;

    if (activeVertical !== 'all') {
      items = items.filter(l => l.category === activeVertical);
    }

    if (activeFilter === 'FREE') {
      items = items.filter(l => l.price === 0);
    } else if (activeFilter === '🔥 Hot') {
      items = items.filter(l => scoreDeal({
        title: l.title, description: l.description, price: l.price,
        category: l.category, condition: l.condition, postedAt: l.postedAt,
      }).score >= 70);
    } else if (activeFilter === '📈 Trending') {
      items = [...items].sort((a, b) => b.postedAt - a.postedAt);
    } else if (activeFilter === '✅ Quality') {
      items = items.filter(l => {
        const s = scoreDeal({
          title: l.title, description: l.description, price: l.price,
          category: l.category, condition: l.condition, postedAt: l.postedAt,
        });
        return s.score >= 15 && !s.flags.includes('damaged') && !s.flags.includes('scam');
      });
    } else if (activeFilter === '💎 High Value') {
      items = items.filter(l => (l.estimatedValue || 0) >= 500 || l.price >= 500);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q)
      );
    }

    return items;
  }, [listings, activeVertical, activeFilter, searchQuery]);

  const allFreeCount = listings.filter(l => l.price === 0).length;

  return (
    <main className="flex-1">
      {/* Hero — Freebie Alerts style purple gradient */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'var(--fa-hero-gradient)' }}
      >
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Left: text */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 text-sm text-white/90">
                <span className="text-[var(--fa-gold)]">★</span>
                <span>Best App for Free Stuff</span>
                <span className="text-[var(--fa-gold)]">★</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-4 tracking-tight">
                Get Free Stuff<br />
                <span className="text-[var(--fa-green-bright)]">Before Anyone Else</span>
              </h1>
              <p className="text-lg text-white/70 mb-8 max-w-xl leading-relaxed">
                We scan Facebook Marketplace, Craigslist, OfferUp, Nextdoor &amp; more —
                so you get instant alerts when free items drop near you.
              </p>

              {/* Stats */}
              <div className="flex items-center justify-center lg:justify-start gap-8 mb-8">
                <div className="text-center">
                  <div className="text-4xl font-black text-[var(--fa-green-bright)] tabular-nums">
                    {listings.length.toLocaleString()}
                  </div>
                  <div className="text-sm text-white/60 mt-1">Live deals</div>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div className="text-center">
                  <div className="text-4xl font-black text-[var(--fa-gold)] tabular-nums">
                    {allFreeCount.toLocaleString()}
                  </div>
                  <div className="text-sm text-white/60 mt-1">Free items</div>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div className="text-center">
                  <div className="text-4xl font-black text-white tabular-nums">
                    {sourceCount || 4}+
                  </div>
                  <div className="text-sm text-white/60 mt-1">Sources</div>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <a
                  href="#deals"
                  className="bg-white text-[var(--fa-purple-dark)] px-8 py-3.5 rounded-full font-bold text-base hover:bg-gray-100 transition-all shadow-xl shadow-purple-900/30"
                >
                  Browse Free Deals →
                </a>
                <a
                  href="/pricing"
                  className="border border-white/20 text-white px-8 py-3.5 rounded-full font-medium text-base hover:bg-white/10 transition-all"
                >
                  Go Pro — $5/week
                </a>
              </div>
            </div>

            {/* Right: phone mockup */}
            <div className="flex-1 flex justify-center lg:justify-end">
              <div className="relative w-56 md:w-64">
                <div className="bg-black rounded-[2.5rem] border-[3px] border-zinc-700 p-2.5 shadow-2xl shadow-purple-900/40">
                  <div className="bg-[var(--fa-surface)] rounded-[2.2rem] overflow-hidden aspect-[9/18] relative">
                    <div className="p-2.5 space-y-2 pt-4">
                      {/* Notification header */}
                      <div className="text-[9px] text-zinc-400 text-center mb-1">FREEBIE ALERTS</div>
                      {listings.slice(0, 5).map((l, i) => (
                        <div key={l.id} className="bg-white/5 rounded-lg p-2 flex items-start gap-2 animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                          <span className="text-base mt-0.5">{getCategoryEmoji(l.category)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[9px] text-white leading-tight font-medium line-clamp-2">
                              {l.title}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              {l.price === 0 && (
                                <span className="text-[7px] bg-[var(--fa-green)] text-black px-1.5 py-0.5 rounded font-extrabold">FREE</span>
                              )}
                              <span className="text-[7px] text-zinc-500">{timeAgo(l.postedAt)}</span>
                              <span className="text-[7px] text-zinc-500 ml-auto">{l.location?.city}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {listings.length === 0 && (
                        <div className="flex items-center justify-center h-32 text-zinc-500 text-[10px]">
                          Loading deals...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="absolute -inset-6 bg-purple-500/15 blur-3xl rounded-[3rem] -z-10" />
              </div>
            </div>
          </div>
        </div>

        {/* Decorative cloud/bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[var(--fa-bg)] to-transparent" />
      </section>

      {/* Stats bar */}
      <section className="bg-[var(--fa-bg)] border-b border-[var(--fa-border)]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-[var(--fa-muted)] flex-wrap">
            <span className="flex items-center gap-1">
              <span>🏷️</span>
              <span className="text-white font-semibold">{listings.length.toLocaleString()}</span>
              <span>Live deals</span>
            </span>
            <span className="flex items-center gap-1">
              <span>🔍</span>
              <span className="text-white font-semibold">{sourceCount || '4'}+</span>
              <span>Sources</span>
            </span>
            <span className="flex items-center gap-1 border-l border-[var(--fa-border)] pl-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--fa-green-bright)] pulse-dot" />
              Updated {lastScraped || 'just now'}
            </span>
          </div>
        </div>
      </section>

      {/* Search + Filters */}
      <section id="deals" className="max-w-7xl mx-auto px-4 pt-6 pb-4">
        {/* Search bar */}
        <form onSubmit={(e) => e.preventDefault()} className="w-full max-w-2xl mx-auto mb-6">
          <div className="flex items-center gap-2 bg-[var(--fa-surface)] border border-[var(--fa-border)] rounded-xl px-4 py-3 transition-all focus-within:border-[var(--fa-purple)]">
            <span className="text-lg">🔍</span>
            <input
              type="text"
              placeholder="Search deals... (e.g. 'sofa', 'PlayStation', 'Rolex')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-zinc-600 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-zinc-500 hover:text-white text-sm"
              >
                ✕
              </button>
            )}
          </div>
        </form>

        {/* Filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`min-h-[40px] touch-target text-xs px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${
                activeFilter === f
                  ? 'bg-[var(--fa-green)] border-[var(--fa-green)] text-black font-bold'
                  : 'border-[var(--fa-border)] text-[var(--fa-muted)] hover:border-zinc-500 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
          {lastScraped && (
            <span className="flex items-center gap-1.5 text-xs text-[var(--fa-green-bright)] ml-2 shrink-0">
              <span className="w-2 h-2 rounded-full bg-[var(--fa-green-bright)] pulse-dot" />
              Live
            </span>
          )}
        </div>

        {/* Vertical pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
          {VERTICALS.map(v => (
            <button
              key={v.id}
              onClick={() => { setActiveVertical(v.id); if (v.id !== 'all') track('vertical_select', { vertical: v.id }); }}
              className={`flex min-h-[40px] items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeVertical === v.id
                  ? 'bg-[var(--fa-purple)]/30 border border-[var(--fa-purple)]/60 text-[var(--fa-purple)]'
                  : 'border border-[var(--fa-border)] text-[var(--fa-muted)] hover:border-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span className="text-sm">{v.icon}</span>
              {v.label}
            </button>
          ))}
        </div>
      </section>

      {/* Deal grid */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        {filtered.length === 0 ? (
          <EmptyState
            message="No deals found"
            description={searchQuery ? `Nothing matches "${searchQuery}". Try different keywords.` : "Try a different category or check back soon — new deals drop every few minutes."}
            emoji="📦"
            action={{
              label: 'Show all deals',
              onClick: () => { setActiveVertical('all'); setActiveFilter('All'); setSearchQuery(''); },
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((deal, idx) => {
              const catEmoji = getCategoryEmoji(deal.category);
              const isFree = deal.price === 0;
              const dealScore = scoreDeal({
                title: deal.title, description: deal.description,
                price: deal.price, category: deal.category,
                condition: deal.condition, postedAt: deal.postedAt,
              });

              return (
                <motion.a
                  key={deal.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.3) }}
                  href={deal.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('deal_view', { deal_id: deal.id, category: deal.category, price: deal.price })}
                  className="group bg-[var(--fa-surface)] border border-[var(--fa-border)] rounded-2xl overflow-hidden hover:border-[var(--fa-purple)]/60 transition-all hover:shadow-xl hover:shadow-purple-900/10"
                >
                  {/* Image area */}
                  <div className="h-40 bg-gradient-to-br from-[var(--fa-purple-dark)]/20 to-[var(--fa-bg)] flex items-center justify-center relative overflow-hidden">
                    <span className="text-4xl opacity-50 group-hover:scale-110 transition-transform duration-300">
                      {catEmoji}
                    </span>

                    {/* FREE badge */}
                    {isFree && (
                      <div className="absolute top-3 left-3 bg-[var(--fa-green)] text-black text-xs font-extrabold px-3 py-1 rounded-md shadow-lg">
                        FREE
                      </div>
                    )}

                    {/* Deal score badge */}
                    {dealScore.score > 0 && (
                      <div className={`absolute top-3 right-3 px-2 py-1 rounded-md text-xs font-bold ${
                        dealScore.score >= 70 ? 'bg-[var(--fa-green)] text-black' :
                        dealScore.score >= 40 ? 'bg-[var(--fa-gold)]/90 text-black' :
                        'bg-zinc-600/80 text-white'
                      }`}>
                        {dealScore.score}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-white font-semibold text-base leading-snug line-clamp-2 mb-3 group-hover:text-[var(--fa-purple)] transition-colors">
                      {deal.title}
                    </h3>

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-bold text-xl">
                        {isFree ? 'FREE' : `$${deal.price.toLocaleString()}`}
                      </span>
                      <span className="text-xs text-[var(--fa-muted)] bg-[var(--fa-bg)] px-2 py-1 rounded-full">
                        {deal.source}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--fa-muted)] flex items-center gap-1">
                        📍 {deal.location?.city || 'Denver'}
                      </span>
                      <span className="text-[var(--fa-muted)]">
                        {timeAgo(deal.postedAt)}
                      </span>
                    </div>
                  </div>
                </motion.a>
              );
            })}
          </div>
        )}
      </section>

      {/* Bottom CTA — Freebie Alerts style */}
      <section className="bg-[var(--fa-blue)] py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-blue-200 text-sm font-semibold tracking-wider uppercase mb-2">
            Get Shinnslist
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Get free stuff locally
          </h2>
          <p className="text-blue-200 mb-8 text-lg">
            Get notifications of giveaways near you. Be the first to claim them.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/pricing"
              className="bg-white text-[var(--fa-blue)] px-10 py-4 rounded-full font-bold text-sm hover:bg-gray-100 transition-colors shadow-lg"
            >
              Go Pro — $5/week
            </a>
            <a
              href="/zones"
              className="border border-white/30 text-white px-10 py-4 rounded-full font-medium text-sm hover:bg-white/10 transition-colors"
            >
              Set up zones
            </a>
          </div>
          <p className="text-blue-200/70 text-xs mt-4">
            🔒 Cancel anytime. No contracts.
          </p>
        </div>
      </section>
    </main>
  );
}
