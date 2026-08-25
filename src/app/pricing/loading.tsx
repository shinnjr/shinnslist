import { PricingSkeleton } from '@/components/Skeletons';

export default function Loading() {
  return (
    <main className="flex-1">
      <section className="max-w-5xl mx-auto px-4 py-16">
        <PricingSkeleton />
      </section>
    </main>
  );
}
