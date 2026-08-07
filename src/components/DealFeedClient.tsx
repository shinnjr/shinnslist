'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Listing } from '@/types';
import VerticalFilter from './VerticalFilter';
import StatsBar from './StatsBar';
import { EmptyState } from './ErrorBoundary';
import { formatPrice, timeAgo, sourceColor } from '@/lib/utils';
import { scoreDeal } from '@/lib/deal-scorer';

interface Props {
  initialListings: Listing[];
}

export default function DealFeedClient({ initialListings }: Props) {
  const [activeVertical, setActiveVertical] = useState('all');
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = useMemo(() => {
    let items = initialListings;

    // Vertical filter
    if (activeVertical !== 'all') {
      items = items.filter(l => l.category === activeVertical);
    }

    // Quick filters
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
      // Filter out junk: score < 15, or damage keywords, or spam patterns
      items = items.filter(l => {
        const s = scoreDeal({
          title: l.title, description: l.description, price: l.price,
          category: l.category, condition: l.condition, postedAt: l.postedAt,
        });
        return s.score >= 15 && !s.flags.includes('damaged') && !s.flags.includes('spam');
      });
    }

    return items;
  }, [initialListings, activeVertical, activeFilter]);

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 pt-8 pb-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              <span className="text-[var(--shinnslist-pink)]">Shinnslist</span> Deal Feed
            </h1>
            <p className="text-[var(--shinnslist-muted)] mt-1 text-sm md:text-base mb-2">
              <StatsBar
                totalDeals={initialListings.length}
                sourceCount={3}
                verticalCount={10}
                lastScraped="2m ago"
              />
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {['All', 'FREE', '🔥 Hot', '📈 Trending', '✅ Quality'].map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`min-h-[48px] touch-target text-xs px-3 py-1.5 rounded-full border transition-all active:scale-[0.97] ${
                  activeFilter === f
                    ? 'bg-[var(--shinnslist-pink)] border-[var(--shinnslist-pink)] text-white shadow-lg shadow-[var(--shinnslist-pink)]/20'
                    : 'border-[var(--shinnslist-border)] text-[var(--shinnslist-muted)] hover:border-zinc-600 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
            <span className="flex items-center gap-1.5 text-xs text-[var(--shinnslist-green)] ml-2">
              <span className="w-2 h-2 rounded-full bg-[var(--shinnslist-green)] pulse-dot" />
              Live
            </span>
          </div>
        </div>

        {/* Vertical filter */}
        <VerticalFilter active={activeVertical} onChange={setActiveVertical} />
      </section>

      {/* Deal grid */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        {filtered.length === 0 ? (
          <EmptyState
            message="No deals found"
            description="Try a different vertical or expand your search area."
            emoji="📦"
            action={{ label: 'Show all deals', onClick: () => { setActiveVertical('all'); setActiveFilter('All'); } }}
          />
        ) : (
          <div key={`${activeVertical}-${activeFilter}`} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((deal, idx) => {
                const result = scoreDeal({
                  title: deal.title,
                  description: deal.description,
                  price: deal.price,
                  category: deal.category,
                  condition: deal.condition,
                  postedAt: deal.postedAt,
                });
                const score = result.score;
                const scoreColor = score >= 70 ? 'text-[var(--shinnslist-green)]' :
                                  score >= 40 ? 'text-yellow-400' : 'text-zinc-500';

                return (
                  <motion.a
                    key={deal.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.4) }}
                    href={deal.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] rounded-2xl overflow-hidden hover:border-zinc-600 transition-all hover:shadow-lg hover:shadow-[var(--shinnslist-pink)]/5 active:scale-[0.99]"
                  >
                    {/* Image placeholder */}
                    <div className="h-48 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center relative overflow-hidden">
                      <motion.span
                        whileHover={{ scale: 1.08 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className="text-5xl opacity-30"
                      >
                        {deal.category === 'trading_cards' ? '🃏' :
                         deal.category === 'sneakers' ? '👟' :
                         deal.category === 'watches' ? '⌚' :
                         deal.category === 'electronics' ? '💻' :
                         deal.category === 'cars' ? '🚗' :
                         deal.category === 'legos' ? '🧱' :
                         deal.category === 'handbags' ? '👜' :
                         '📦'}
                      </motion.span>
                      {/* Deal score badge */}
                      {score > 0 && (
                        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1">
                          <span className={`text-xs font-bold ${scoreColor}`}>{score}</span>
                          <span className="text-[10px] text-zinc-400">DEAL</span>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 group-hover:text-[var(--shinnslist-pink)] transition-colors">
                          {deal.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${sourceColor(deal.source)}`}>
                          {deal.source}
                        </span>
                        {deal.flags.includes('free') && (
                          <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded-full">FREE</span>
                        )}
                        {deal.flags.includes('undervalued') && (
                          <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-1 rounded-full">UNDER MARKET</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-white font-bold text-lg">
                            {deal.price === 0 ? 'FREE' : `$${deal.price.toLocaleString()}`}
                          </span>
                          {deal.estimatedValue && (
                            <span className="text-[var(--shinnslist-muted)] text-xs ml-2 line-through">
                              ${deal.estimatedValue.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[var(--shinnslist-muted)]">
                          {deal.location ? `${deal.location.city}` : ''}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--shinnslist-border)]">
                        <span className="text-[10px] text-[var(--shinnslist-muted)]">
                          {timeAgo(deal.postedAt)}
                        </span>
                        <span className="text-xs text-[var(--shinnslist-pink)] opacity-0 group-hover:opacity-100 transition-opacity">
                          View deal →
                        </span>
                      </div>
                    </div>
                  </motion.a>
                );
              })}
          </div>
        )}
      </section>

      {/* Bottom CTA — convert free browsers to paid */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-r from-[var(--shinnslist-pink)]/10 via-fuchsia-600/10 to-purple-600/10 border border-[var(--shinnslist-border)] rounded-2xl p-8 max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-bold text-white mb-2">
            These deals are gone in under 20 minutes.
          </h2>
          <p className="text-[var(--shinnslist-muted)] mb-6 text-sm">
            Pro users get <span className="text-[var(--shinnslist-green)] font-bold">instant alerts</span> —
            before anyone else sees the listing.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/pricing"
              className="bg-[var(--shinnslist-pink)] text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-fuchsia-600 transition-colors"
            >
              Go Pro — $5/week
            </a>
            <a
              href="/zones"
              className="border border-[var(--shinnslist-border)] text-white px-8 py-3 rounded-full font-medium text-sm hover:border-zinc-500 transition-colors"
            >
              Set up zones
            </a>
          </div>
          <p className="text-[var(--shinnslist-muted)] text-xs mt-4">
            🔒 Cancel anytime. No contracts. Pause & resume.
          </p>
        </div>
      </section>
    </main>
  );
}
