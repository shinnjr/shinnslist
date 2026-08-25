'use client';

import { useEffect } from 'react';

// Route-level error boundary (Next 16 API: error + unstable_retry).
// Catches render errors for every route below the root layout.
export default function RouteError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // Log to console for diagnostics; do NOT leak message in prod UI (Next
    // already strips server error messages to a generic string in prod).
    console.error('[route error]', error);
  }, [error]);

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-sm animate-fade-in">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] text-4xl">
          🔧
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">Something went wrong</h1>
        <p className="text-[var(--shinnslist-muted)] text-sm max-w-xs mx-auto mb-6">
          This page hit an unexpected error. Try again — if it keeps happening, check back in a few minutes.
        </p>
        <button
          onClick={() => unstable_retry()}
          className="touch-target inline-flex items-center gap-2 bg-[var(--shinnslist-pink)] text-black px-8 py-3 rounded-full text-sm font-bold hover:bg-fuchsia-600 active:scale-[0.98] transition-all"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
