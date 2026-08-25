import { MapSkeleton } from '@/components/Skeletons';

export default function Loading() {
  return (
    <main className="flex-1 flex flex-col">
      <div className="max-w-7xl mx-auto w-full px-4 pt-6 pb-3">
        <div className="h-8 w-40 shimmer rounded" />
        <div className="h-4 w-64 max-w-full shimmer rounded mt-2" />
      </div>
      <div className="flex-1 px-4">
        <MapSkeleton />
      </div>
    </main>
  );
}
