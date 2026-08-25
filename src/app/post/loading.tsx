import { FormSkeleton } from '@/components/Skeletons';

export default function Loading() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <FormSkeleton />
      </div>
    </main>
  );
}
