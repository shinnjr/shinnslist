// Loading skeleton for deal cards
export default function DealCardSkeleton() {
  return (
    <div className="bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] rounded-2xl overflow-hidden animate-pulse">
      <div className="h-48 bg-zinc-800" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-zinc-800 rounded w-3/4" />
        <div className="h-3 bg-zinc-800 rounded w-1/2" />
        <div className="h-3 bg-zinc-800 rounded w-2/3" />
      </div>
    </div>
  );
}

export function DealFeedSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <DealCardSkeleton key={i} />
      ))}
    </div>
  );
}
