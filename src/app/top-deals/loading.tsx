import { HeaderSkeleton, DealFeedSkeleton } from '@/components/Skeletons';

export default function Loading() {
  return (
    <main className="flex-1 max-w-7xl mx-auto px-4 pt-8 pb-16">
      <HeaderSkeleton />
      <div className="mt-6">
        <DealFeedSkeleton count={6} />
      </div>
    </main>
  );
}
