import { HeaderSkeleton, FilterSkeleton, DealFeedSkeleton } from '@/components/Skeletons';

export default function Loading() {
  return (
    <main className="flex-1">
      <section className="max-w-7xl mx-auto px-4 pt-8 pb-4">
        <div className="mb-6">
          <HeaderSkeleton />
        </div>
        <FilterSkeleton count={8} />
      </section>
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <DealFeedSkeleton count={6} />
      </section>
    </main>
  );
}
