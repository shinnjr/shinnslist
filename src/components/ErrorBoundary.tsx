// Error boundary wrapper for deal feed
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔧</div>
          <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
          <p className="text-[var(--shinnslist-muted)] mb-4">
            {this.state.error?.message || 'The deal feed couldn\'t load.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="bg-[var(--shinnslist-pink)] text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-fuchsia-600 transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Empty state for no listings
export function EmptyState({ message = 'No deals found' }: { message?: string }) {
  return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">📦</div>
      <h2 className="text-xl font-semibold text-white mb-2">{message}</h2>
      <p className="text-[var(--shinnslist-muted)]">
        Try expanding your search area or checking back later.
      </p>
    </div>
  );
}
