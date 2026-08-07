import { DealFeedSkeleton } from '@/components/Skeletons';

export default function Loading() {
  return (
    <main className="flex-1">
      <section className="max-w-7xl mx-auto px-4 pt-8 pb-4">
        <div className="mb-6">
          <div className="h-8 bg-zinc-800 rounded w-64 animate-pulse" />
          <div className="h-4 bg-zinc-800 rounded w-48 mt-2 animate-pulse" />
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <DealFeedSkeleton count={6} />
      </section>
    </main>
  );
}
