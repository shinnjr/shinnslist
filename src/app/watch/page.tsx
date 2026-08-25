'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getAggregator,
  listAggregatorItems,
  runAggregator,
  patchAggregatorItem,
  timeAgo,
  type Aggregator,
  type AggregatorItem,
  type AggregatorFilter,
} from '@/lib/aggregators-api';
import type { Listing } from '@/types';
import ListingCard from '@/components/ListingCard';

function toListing(item: AggregatorItem): Listing {
  const l = item.listing!;
  return {
    id: l.id,
    source: (l.source as Listing['source']) || 'craigslist',
    sourceUrl: l.source_url || '#',
    title: l.title,
    description: l.description || '',
    photos: l.photos || [],
    price: l.price || 0,
    estimatedValue: l.estimated_value || null,
    category: l.category || 'free-stuff',
    condition: (l.condition as Listing['condition']) || 'unknown',
    flags: (l.flags || []) as Listing['flags'],
    location: {
      lat: 39.7392,
      lng: -104.9903,
      city: l.city || 'Denver',
      state: l.state || 'CO',
    },
    postedAt: l.posted_at ? new Date(l.posted_at).getTime() : Date.now(),
    expiresAt: null,
  };
}

const FILTERS: { id: AggregatorFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'saved', label: 'Saved' },
];

export default function WatchPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';
  const router = useRouter();

  const [aggregator, setAggregator] = useState<Aggregator | null>(null);
  const [items, setItems] = useState<AggregatorItem[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<AggregatorFilter>('all');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (activeFilter: AggregatorFilter = filter) => {
    if (!id) return;
    try {
      const [agg, feed] = await Promise.all([
        getAggregator(id),
        listAggregatorItems(id, { limit: 100, filter: activeFilter }),
      ]);
      setAggregator(agg);
      setItems(feed.items || []);
      setTotal(feed.total || 0);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'load_failed');
    } finally {
      setLoading(false);
    }
  }, [id, filter]);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleRun() {
    if (!id) return;
    setRunning(true);
    setError(null);
    try {
      const result = await runAggregator(id);
      await refresh();
      if (result.inserted === 0) {
        setError('No new matches — try broader keywords or more sources.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'run_failed');
    } finally {
      setRunning(false);
    }
  }

  async function handleToggleSaved(item: AggregatorItem) {
    const next = !item.saved;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, saved: next } : i)));
    try {
      await patchAggregatorItem(id, item.id, { saved: next });
    } catch {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, saved: !next } : i)));
    }
  }

  async function handleMarkSeen() {
    const unseen = items.filter((i) => !i.seen);
    setItems((prev) => prev.map((i) => ({ ...i, seen: true })));
    for (const item of unseen) {
      await patchAggregatorItem(id, item.id, { seen: true }).catch(() => {});
    }
  }

  const unseenCount = useMemo(() => items.filter((i) => !i.seen).length, [items]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="h-8 w-56 bg-zinc-800 rounded-lg animate-pulse mb-4" />
        <div className="h-6 w-72 bg-zinc-900 rounded-lg animate-pulse mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-72 bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!aggregator) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">🔍</p>
        <h1 className="text-xl font-bold text-white mb-2">Watch not found</h1>
        <p className="text-sm text-[var(--shinnslist-muted)] mb-6">{error || 'It may have been deleted.'}</p>
        <button onClick={() => router.push('/dashboard')} className="bg-[var(--shinnslist-pink)] text-black font-bold px-6 py-3 rounded-full text-sm">
          Back to My Watches
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 pb-24 md:pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <button onClick={() => router.push('/dashboard')} className="text-sm text-[var(--shinnslist-muted)] hover:text-white touch-target">
            ← My Watches
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mt-1 flex items-center gap-3">
            <span className="text-3xl">{aggregator.emoji || '🧿'}</span>
            {aggregator.name}
          </h1>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {aggregator.sources.map((s) => (
              <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">{s}</span>
            ))}
            {aggregator.categories.slice(0, 4).map((c) => (
              <span key={c} className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">{c}</span>
            ))}
            {aggregator.keywords.slice(0, 6).map((k) => (
              <span key={k} className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--shinnslist-pink)]/10 text-[var(--shinnslist-pink)] border border-[var(--shinnslist-pink)]/20">“{k}”</span>
            ))}
          </div>
          <p className="text-xs text-[var(--shinnslist-muted)] mt-3">
            {total} finds · last ran {timeAgo(aggregator.last_run_at)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleMarkSeen}
            disabled={unseenCount === 0}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold transition-colors disabled:opacity-40 touch-target"
          >
            Mark {unseenCount} seen
          </button>
          <button
            onClick={handleRun}
            disabled={running}
            className="px-5 py-2.5 rounded-xl bg-[var(--shinnslist-green)] text-black text-sm font-bold transition-all active:scale-[0.97] disabled:opacity-50 touch-target"
          >
            {running ? 'Compiling…' : '▶ Run now'}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 mb-6">{error}</p>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => { setFilter(f.id); setLoading(true); refresh(f.id).finally(() => setLoading(false)); }}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all touch-target ${
              filter === f.id
                ? 'bg-[var(--shinnslist-pink)] text-black'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      {items.length === 0 ? (
        <div className="border border-dashed border-zinc-700 rounded-2xl py-16 px-6 text-center">
          <p className="text-5xl mb-4">📡</p>
          <h2 className="text-lg font-bold text-white mb-2">Nothing compiled yet</h2>
          <p className="text-sm text-[var(--shinnslist-muted)] max-w-sm mx-auto">
            Hit <span className="text-[var(--shinnslist-green)] font-semibold">Run now</span> to scan the sources and pull every listing that matches this watch.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="relative">
              {item.listing && <ListingCard listing={toListing(item)} />}
              <div className="flex items-center justify-between px-3 pt-2 pb-3">
                <span className="text-[11px] text-zinc-500">
                  {item.matched_reason === 'free' ? '🆓 free match' :
                   item.matched_reason === 'keyword' ? '🔑 keyword match' :
                   item.matched_reason === 'category' ? '🏷️ category match' :
                   item.matched_reason === 'all' ? '📡 in range' : 'match'}
                  {' · '}
                  {item.seen ? 'seen' : <span className="text-[var(--shinnslist-pink)] font-semibold">NEW</span>}
                </span>
                <button
                  onClick={() => handleToggleSaved(item)}
                  aria-label={item.saved ? 'Unsave' : 'Save'}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors touch-target ${
                    item.saved
                      ? 'bg-[var(--shinnslist-pink)]/15 text-[var(--shinnslist-pink)]'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {item.saved ? '★ Saved' : '☆ Save'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
