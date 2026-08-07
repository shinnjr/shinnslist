import { Listing, ListingFlag } from '@/types';

interface Props {
  listing: Listing;
}

function formatPrice(price: number): string {
  if (price === 0) return 'FREE';
  return `$${price}`;
}

function timeAgo(timestamp: number): string {
  const mins = Math.floor((Date.now() - timestamp) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
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
    'scam': '⚠️ Scam likely',
    'damaged': '🔧 Needs repair',
    'free': 'FREE',
    'undervalued': '💎 Undervalued',
    'high-value': '💰 High value',
    'expiring-soon': '⏰ Ending soon',
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${colors[flag]}`}>
      {labels[flag]}
    </span>
  );
}

export default function ListingCard({ listing }: Props) {
  const isFree = listing.price === 0;
  const hasValue = listing.estimatedValue && listing.estimatedValue > 0;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
      {/* Thumbnail area */}
      <div className="h-48 bg-zinc-800 flex items-center justify-center relative">
        {listing.photos.length > 0 ? (
          <img
            src={listing.photos[0]}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-4xl">📦</span>
        )}

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

      {/* Content */}
      <div className="p-4">
        <h3 className="text-white font-semibold text-lg leading-snug mb-1">
          {listing.title}
        </h3>

        {listing.description && (
          <p className="text-zinc-400 text-sm mb-3 line-clamp-2">
            {listing.description}
          </p>
        )}

        {/* Value estimate */}
        {hasValue && isFree && (
          <div className="mb-2">
            <span className="text-yellow-400 text-sm font-medium">
              ~${listing.estimatedValue!.toLocaleString()} MSRP
            </span>
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
          <span>
            📍 {listing.location.city}, {listing.location.state}
          </span>
          <span>{timeAgo(listing.postedAt)}</span>
        </div>

        {/* Flags */}
        {listing.flags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {listing.flags
              .filter(f => f !== 'free')
              .map(flag => (
                <FlagBadge key={flag} flag={flag} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
