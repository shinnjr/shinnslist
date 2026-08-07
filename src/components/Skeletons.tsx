// Loading skeletons for Shinnslist — used across all pages for smooth
// perceived performance. Uses the .shimmer CSS effect.

// A single deal/listing card skeleton
export default function DealCardSkeleton() {
  return (
    <div className="bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] rounded-2xl overflow-hidden">
      <div className="h-48 shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-4 shimmer rounded w-3/4" />
        <div className="h-3 shimmer rounded w-1/2" />
        <div className="h-3 shimmer rounded w-2/3" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 shimmer rounded w-16" />
          <div className="h-3 shimmer rounded w-12" />
        </div>
      </div>
    </div>
  );
}

// Grid of deal cards
export function DealFeedSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
      {Array.from({ length: count }).map((_, i) => (
        <DealCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Horizontal filter rail placeholder (verticals + quick filters)
export function FilterSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="flex items-center gap-2 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-10 w-24 shimmer rounded-full shrink-0"
          style={{ width: 56 + (i % 3) * 24 }}
        />
      ))}
    </div>
  );
}

// Page header / hero placeholder
export function HeaderSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-8 shimmer rounded w-64 max-w-full" />
      <div className="h-4 shimmer rounded w-48 max-w-full" />
    </div>
  );
}

// Form skeleton (auth, post, onboarding) — a card with input lines
export function FormSkeleton() {
  return (
    <div className="bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] rounded-2xl p-6 space-y-4">
      <div className="mx-auto w-16 h-16 shimmer rounded-full" />
      <div className="h-6 shimmer rounded w-48 mx-auto" />
      <div className="h-4 shimmer rounded w-64 max-w-full mx-auto" />
      <div className="h-12 shimmer rounded-xl" />
      <div className="h-12 shimmer rounded-xl" />
      <div className="h-12 shimmer rounded-xl" />
      <div className="h-12 shimmer rounded-xl" />
    </div>
  );
}

// Map / zones skeleton — a big map-shaped block with a toolbar
export function MapSkeleton() {
  return (
    <div className="flex flex-col flex-1 min-h-[60vh]">
      <div className="h-16 shimmer rounded-xl mb-3" />
      <div className="flex-1 shimmer rounded-xl min-h-[50vh]" />
    </div>
  );
}

// Pricing card skeleton
export function PricingCardSkeleton() {
  return (
    <div className="bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] rounded-2xl p-6 space-y-3">
      <div className="h-5 shimmer rounded w-20" />
      <div className="h-8 shimmer rounded w-24" />
      <div className="h-4 shimmer rounded w-3/4" />
      <div className="space-y-2 pt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-3 shimmer rounded w-full" />
        ))}
      </div>
      <div className="h-12 shimmer rounded-full" />
    </div>
  );
}

// Pricing page skeleton
export function PricingSkeleton() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger">
        <PricingCardSkeleton />
        <PricingCardSkeleton />
        <PricingCardSkeleton />
      </div>
    </div>
  );
}
