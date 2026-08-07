import { Listing, ListingFlag } from '@/types';
import { scoreDeal } from '@/lib/deal-scorer';

interface Props { listing: Listing; }

function formatPrice(price: number): string {
  if (price === 0) return 'FREE';
  return `$${price.toLocaleString()}`;
}

function timeAgo(timestamp: number): string {
  const mins = Math.floor((Date.now() - timestamp) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function FlagBadge({ flag }: { flag: ListingFlag }) {
  const colors: Record<ListingFlag, string> = {
    'scam': 'bg-red-500/10 text-red-400 border-red-500/20',
    'damaged': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'free': 'bg-green-500/10 text-green-400 border-green-500/20',
    'undervalued': 'bg-green-500/10 text-green-400 border-green-500/20',
    'high-value': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'expiring-soon': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
  const labels: Record<ListingFlag, string> = {
    'scam': '⚠️', 'damaged': '🔧', 'free': 'FREE',
    'undervalued': '📉', 'high-value': '💎', 'expiring-soon': '⏰',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${colors[flag] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
      {labels[flag] || flag}
    </span>
  );
}

export default function ListingCard({ listing }: Props) {
  const isFree = listing.price === 0;
  const hasValue = listing.estimatedValue && listing.estimatedValue > 0;
  const deal = scoreDeal({
    title: listing.title, description: listing.description,
    price: listing.price, category: listing.category,
    condition: listing.condition, postedAt: listing.postedAt,
  });
  const savings = hasValue ? listing.estimatedValue! - listing.price : 0;
  const savingsPct = hasValue && listing.estimatedValue! > 0
    ? Math.round((savings / listing.estimatedValue!) * 100) : 0;

  // eBay sold-items search URL
  const ebaySearchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(listing.title)}&LH_Sold=1&LH_Complete=1`;

  return (
    <div className="group bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] rounded-2xl overflow-hidden hover:border-zinc-600 transition-all duration-200 hover:shadow-lg hover:shadow-black/20">
      <div className="relative aspect-[16/10] bg-[var(--shinnslist-bg)] flex items-center justify-center overflow-hidden">
        {listing.photos && listing.photos[0] ? (
          <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-5xl">{['📦','🪑','💻','👟','⌚','🧱','👜','🚗','🏠','🎮'][Math.floor(listing.title.length % 10)]}</span>
        )}

        {/* Deal score badge */}
        <div className={`absolute bottom-3 right-3 px-2 py-1 rounded-lg text-xs font-bold ${
          deal.score >= 70 ? 'bg-green-500 text-black' :
          deal.score >= 40 ? 'bg-yellow-500/80 text-black' :
          'bg-zinc-600/80 text-white'
        }`}>
          {deal.score}/100
        </div>

        {/* Price badge */}
        <div className={`absolute top-3 left-3 px-3 py-1 rounded-lg text-sm font-bold ${
          isFree ? 'bg-green-500 text-black' : 'bg-black/70 text-white'
        }`}>
          {formatPrice(listing.price)}
        </div>

        {/* Source badge */}
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/50 text-xs text-zinc-400 capitalize">
          {listing.source}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-white font-semibold text-lg leading-snug mb-1">
          {listing.title}
        </h3>

        {listing.description && (
          <p className="text-zinc-400 text-sm mb-3 line-clamp-2">
            {listing.description}
          </p>
        )}

        {/* Savings callout */}
        {hasValue && savingsPct > 0 && (
          <div className="mb-2 flex items-center gap-2">
            <span className="text-green-400 text-sm font-bold">
              Save {savingsPct}% (${savings.toLocaleString()})
            </span>
            <span className="text-zinc-500 text-xs">
              MSRP ~${listing.estimatedValue!.toLocaleString()}
            </span>
          </div>
        )}

        {hasValue && isFree && (
          <div className="mb-2">
            <span className="text-yellow-400 text-sm font-medium">
              ~${listing.estimatedValue!.toLocaleString()} MSRP — FREE!
            </span>
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
          <span>📍 {listing.location.city}, {listing.location.state}</span>
          <span>{timeAgo(listing.postedAt)}</span>
        </div>

        {/* eBay lookup link */}
        <a
          href={ebaySearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-[var(--shinnslist-pink)] transition-colors mb-2"
        >
          🔍 Check on eBay →
        </a>

        {/* Flags */}
        {listing.flags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {listing.flags
              .filter(f => f !== 'free')
              .map(flag => <FlagBadge key={flag} flag={flag} />)}
          </div>
        )}

        {/* CTA */}
        <a
          href={listing.sourceUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block w-full text-center bg-[var(--shinnslist-pink)]/10 hover:bg-[var(--shinnslist-pink)]/20 text-[var(--shinnslist-pink)] text-sm font-semibold py-2 rounded-xl transition-colors"
        >
          View deal →
        </a>
      </div>
    </div>
  );
}
