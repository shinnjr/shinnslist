'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAggregator, dealScoreLabel } from '@/lib/aggregators-api';
import { INTEREST_CATEGORIES } from '@/data/interestTaxonomy';

const SOURCES = [
  { id: 'craigslist', label: 'Craigslist' },
  { id: 'offerup', label: 'OfferUp' },
  { id: 'facebook', label: 'Facebook Marketplace' },
  { id: 'freecycle', label: 'Freecycle' },
  { id: 'trashnothing', label: 'Trash Nothing' },
  { id: 'nextdoor', label: 'Nextdoor' },
];

const EMOJI_OPTIONS = ['🧿', '🏠', '🚲', '💻', '👶', '🎸', '🛋️', '👟', '⌚', '📦', '🪑', '🖥️', '🐕', '🔧', '📷', '🎮', '📚', '🛹'];

export default function BuilderPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🧿');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>(['craigslist', 'offerup', 'facebook']);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minDealScore, setMinDealScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addKeyword() {
    const parts = keywordInput.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (parts.length === 0) return;
    setKeywords((prev) => [...new Set([...prev, ...parts])]);
    setKeywordInput('');
  }

  function toggleCategory(id: string) {
    setCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function toggleSource(id: string) {
    setSources((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Give your watch a name.'); return; }
    if (keywords.length === 0 && categories.length === 0) {
      setError('Add at least one keyword or category — or leave both empty to watch everything in your price range.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const agg = await createAggregator({
        name: name.trim(),
        emoji,
        keywords,
        categories,
        sources,
        min_price: minPrice ? Number(minPrice) : 0,
        max_price: maxPrice ? Number(maxPrice) : null,
        min_deal_score: minDealScore,
      });
      router.push(`/watch?id=${agg.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'create_failed');
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 pb-24 md:pb-10">
      <button onClick={() => router.push('/dashboard')} className="text-sm text-[var(--shinnslist-muted)] hover:text-white mb-4 touch-target">
        ← Back to My Watches
      </button>

      <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-1">Build a watch</h1>
      <p className="text-sm text-[var(--shinnslist-muted)] mb-8">
        Shinnslist compiles matching listings from every source you pick — your own aggregator.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Name + emoji */}
        <section className="bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] rounded-2xl p-5">
          <h2 className="font-bold text-white mb-4">What do you call it?</h2>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='e.g. "Baby haul", "MTB upgrades", "Gaming PC parts"'
            maxLength={60}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--shinnslist-pink)] transition-colors"
          />
          <div className="flex flex-wrap gap-2 mt-4">
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                aria-label={`Emoji ${e}`}
                className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center border transition-all touch-target ${
                  emoji === e
                    ? 'border-[var(--shinnslist-pink)] bg-[var(--shinnslist-pink)]/10 scale-105'
                    : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </section>

        {/* Keywords */}
        <section className="bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] rounded-2xl p-5">
          <h2 className="font-bold text-white mb-1">Keywords</h2>
          <p className="text-xs text-[var(--shinnslist-muted)] mb-3">Words that must appear in a listing. Comma-separate to add several.</p>
          <div className="flex gap-2">
            <input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addKeyword(); } }}
              placeholder="uppababy, play kitchen, nugget"
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--shinnslist-pink)] transition-colors"
            />
            <button type="button" onClick={addKeyword} className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-4 rounded-xl touch-target">
              Add
            </button>
          </div>
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {keywords.map((k) => (
                <span key={k} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[var(--shinnslist-pink)]/10 text-[var(--shinnslist-pink)] border border-[var(--shinnslist-pink)]/20">
                  “{k}”
                  <button type="button" onClick={() => setKeywords(keywords.filter((x) => x !== k))} aria-label={`Remove ${k}`} className="opacity-60 hover:opacity-100 touch-target">
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Categories */}
        <section className="bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] rounded-2xl p-5">
          <h2 className="font-bold text-white mb-1">Categories</h2>
          <p className="text-xs text-[var(--shinnslist-muted)] mb-3">Or pick whole categories to watch.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {INTEREST_CATEGORIES.map((cat) => {
              const active = categories.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-sm transition-all touch-target ${
                    active
                      ? 'border-[var(--shinnslist-pink)] bg-[var(--shinnslist-pink)]/10 text-white'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span className="truncate">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Sources */}
        <section className="bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] rounded-2xl p-5">
          <h2 className="font-bold text-white mb-3">Sources</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SOURCES.map((s) => {
              const active = sources.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSource(s.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-sm transition-all touch-target ${
                    active
                      ? 'border-[var(--shinnslist-green)] bg-[var(--shinnslist-green)]/10 text-white'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${active ? 'bg-[var(--shinnslist-green)]' : 'bg-zinc-600'}`} />
                  {s.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Price + deal score */}
        <section className="bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] rounded-2xl p-5">
          <h2 className="font-bold text-white mb-4">Price & deal score</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-[var(--shinnslist-muted)]">Min price</span>
              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                className="mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--shinnslist-pink)] transition-colors"
              />
            </label>
            <label className="block">
              <span className="text-xs text-[var(--shinnslist-muted)]">Max price</span>
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="No limit"
                className="mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--shinnslist-pink)] transition-colors"
              />
            </label>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[var(--shinnslist-muted)]">Minimum deal score</span>
              <span className="text-sm font-bold text-[var(--shinnslist-green)]">{dealScoreLabel(minDealScore)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="10"
              value={minDealScore}
              onChange={(e) => setMinDealScore(Number(e.target.value))}
              className="w-full accent-[var(--shinnslist-green)]"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
              <span>Anything</span>
              <span>Good finds</span>
              <span>Hot deals</span>
              <span>Only steals</span>
            </div>
          </div>
        </section>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[var(--shinnslist-pink)] text-black font-bold py-4 rounded-2xl text-base active:scale-[0.99] transition-all disabled:opacity-50 touch-target"
        >
          {submitting ? 'Building…' : 'Build watch'}
        </button>
      </form>
    </div>
  );
}
