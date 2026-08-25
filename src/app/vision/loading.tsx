import { FormSkeleton } from '@/components/Skeletons';

export default function Loading() {
  return (
    <main className="flex-1 max-w-lg mx-auto px-4 py-8">
      <div className="h-8 w-48 shimmer rounded mb-2" />
      <div className="h-4 w-64 max-w-full shimmer rounded mb-6" />
      <FormSkeleton />
    </main>
  );
}
