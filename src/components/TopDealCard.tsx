'use client';

import { motion } from 'framer-motion';
import type { Listing } from '@/types';
import type { TopDealAnalysis } from '@/lib/top-deals';
import { categorySlug } from '@/lib/subscription';
import { track } from '@/lib/track';

interface Props {
  deal: Listing;
  rank: number;
  analysis: TopDealAnalysis;
  locked: boolean;
  onUnlock: (slug: string) => void;
}

const RANK_STYLE: Record<number, string> = {
  1: 'bg-gradient-to-br from-yellow-400 to-amber-600 text-black',
  2: 'bg-gradient-to-br from-zinc-200 to-zinc-400 text-black',
  3: 'bg-gradient-to-br from-orange-400 to-amber-700 text-black',
};

export default function TopDealCard({ deal, rank, analysis, locked, onUnlock }: Props) {
  const slug = categorySlug(deal.category);
  const photo = deal.photos && deal.photos.length > 0 ? deal.photos[0] : null;
  const pct = Math.round(analysis.deltaPct * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(rank * 0.05, 0.5) }}
      className={`relative bg-[var(--shinnslist-surface)] border rounded-2xl overflow-hidden transition-all ${
        rank === 1 ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/10' : 'border-[var(--shinnslist-border)]'
      }`}
    >
      {/* Rank badge */}
      <div
        className={`absolute top-3 left-3 z-20 min-w-[44px] h-9 px-2 rounded-full flex items-center justify-center font-black text-sm shadow-lg ${
          RANK_STYLE[rank] || 'bg-zinc-700 text-white'
        }`}
      >
        #{rank}
      </div>

      {/* Deal score */}
      <div className="absolute top-3 right-3 z-20 bg-black/70 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1">
        <span className={`text-xs font-bold ${analysis.score >= 70 ? 'text-[var(--shinnslist-green)]' : analysis.score >= 45 ? 'text-yellow-400' : 'text-zinc-400'}`}>
          {analysis.score}
        </span>
        <span className="text-[10px] text-zinc-400">TOP</span>
      </div>

      {/* Media */}
      <div className={`h-48 relative ${locked ? 'select-none' : ''}`}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={deal.title}
            className={`w-full h-full object-cover ${locked ? 'blur-xl scale-110' : ''}`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
            <span className={`text-6xl opacity-40 ${locked ? 'blur-md' : ''}`}>
              {deal.category === 'trading_cards' || deal.category === 'trading-cards' ? '🃏'
                : deal.category === 'sneakers' ? '👟'
                : deal.category === 'watches' ? '⌚'
                : deal.category === 'electronics' ? '💻'
                : deal.category === 'cars' ? '🚗'
                : deal.category === 'legos' ? '🧱'
                : deal.category === 'handbags' ? '👜'
                : deal.category === 'real-estate' ? '🏠'
                : deal.category === 'furniture' ? '🛋️'
                : '📦'}
            </span>
          </div>
        )}

        {/* Lock overlay for subscribers-only deals */}
        {locked && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/40">
            <div className="w-14 h-14 rounded-full bg-[var(--shinnslist-surface)]/90 border border-[var(--shinnslist-border)] flex items-center justify-center text-2xl shadow-xl">
              🔒
            </div>
            <div className="text-center px-6">
              <p className="text-white font-bold text-sm">Subscriber-only deal</p>
              <p className="text-[var(--shinnslist-muted)] text-[11px] mt-0.5">
                {pct > 0 ? `${pct}% below market — this one's gone in minutes` : 'Unlocks the hottest finds first'}
              </p>
            </div>
            <button
              onClick={() => { track('unlock_click', { category: slug, deal_id: deal.id }); onUnlock(slug); }}
              className="min-h-[48px] bg-[var(--shinnslist-pink)] text-black text-sm font-bold px-6 py-2.5 rounded-full hover:bg-emerald-600 active:scale-[0.97] transition-all shadow-lg shadow-[var(--shinnslist-pink)]/25"
            >
              Unlock this vertical — $1/wk
            </button>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 flex-1">{deal.title}</h3>
        </div>

        {/* Delta + velocity + proximity chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {pct >= 10 && (
            <span className="text-[11px] font-bold bg-[var(--shinnslist-green)]/15 text-[var(--shinnslist-green)] px-2 py-1 rounded-full">
              {pct}% below market
            </span>
          )}
          <span className="text-[11px] bg-orange-500/15 text-orange-400 px-2 py-1 rounded-full">
            {analysis.velocityEmoji} {analysis.velocityText}
          </span>
          {analysis.minutes !== null && (
            <span className="text-[11px] bg-blue-500/15 text-blue-400 px-2 py-1 rounded-full">
              📍 {analysis.minutes} min away
            </span>
          )}
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-white font-bold text-lg">
            {deal.price === 0 ? 'FREE' : `$${deal.price.toLocaleString()}`}
          </span>
          {deal.estimatedValue ? (
            <span className="text-[var(--shinnslist-muted)] text-xs">
              <span className="line-through">${deal.estimatedValue.toLocaleString()}</span>
              {analysis.deltaValue >= 50 && (
                <span className="text-[var(--shinnslist-green)] ml-1.5 font-bold">
                  +${Math.round(analysis.deltaValue).toLocaleString()}
                </span>
              )}
            </span>
          ) : null}
        </div>

        {analysis.reasons.length > 0 && !locked && (
          <p className="text-[11px] text-[var(--shinnslist-muted)] mt-2 leading-relaxed">
            {analysis.reasons.slice(0, 3).join(' · ')}
          </p>
        )}

        {!locked && (
          <a
            href={deal.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('deal_view', { deal_id: deal.id, category: slug, price: deal.price, estimated_value: deal.estimatedValue ?? undefined, city: deal.location?.city })}
            className="mt-3 block w-full text-center min-h-[48px] bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] text-white text-sm font-semibold py-2.5 rounded-full hover:border-[var(--shinnslist-pink)] hover:text-[var(--shinnslist-pink)] active:scale-[0.98] transition-all"
          >
            Message seller →
          </a>
        )}
      </div>
    </motion.div>
  );
}
