'use client';

// Global error boundary — catches errors thrown in the ROOT layout itself
// (error.tsx can't catch its parent layout). Must render its own <html>/<body>.
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body style={{ background: '#0F0A1A', color: '#F5F0EB', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: '1rem' }}>
          <div style={{ fontSize: 48, marginBottom: '1rem' }}>🔧</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 0.5rem' }}>Shinnslist hit a snag</h1>
          <p style={{ color: '#8B7BA8', fontSize: 14, margin: '0 0 1.5rem' }}>
            Something went wrong while loading the app. Tap retry — or come back in a few minutes.
          </p>
          <button
            onClick={() => unstable_retry()}
            style={{
              minHeight: 48,
              minWidth: 48,
              padding: '0.75rem 2rem',
              borderRadius: 9999,
              border: 'none',
              background: '#22C55E',
              color: '#000',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
