// === Shared formatting helpers ===

export function formatPrice(price: number): string {
  if (price === 0) return 'FREE';
  return `$${price.toLocaleString()}`;
}

export function formatValue(value: number | null): string | null {
  if (!value) return null;
  return `$${value.toLocaleString()} MSRP`;
}

export function timeAgo(ts: number): string {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function dealScore(price: number, estimatedValue: number | null): number {
  if (!estimatedValue || estimatedValue <= 0) return 0;
  if (price === 0) return 100;
  return Math.min(Math.round(((estimatedValue - price) / estimatedValue) * 100), 99);
}

export function sourceColor(source: string): string {
  const map: Record<string, string> = {
    facebook: 'bg-blue-600/20 text-blue-400',
    craigslist: 'bg-purple-600/20 text-purple-400',
    offerup: 'bg-green-600/20 text-green-400',
    nextdoor: 'bg-orange-600/20 text-orange-400',
    trashnothing: 'bg-teal-600/20 text-teal-400',
    ebay: 'bg-red-600/20 text-red-400',
  };
  return map[source] || 'bg-gray-600/20 text-gray-400';
}
