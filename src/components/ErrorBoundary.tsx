// Error boundary wrapper + reusable empty state
'use client';

import { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  /** Optional label describing the section being guarded (e.g. "deal feed") */
  label?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <ErrorFallback
          label={this.props.label}
          message={this.state.error?.message}
          onRetry={this.handleRetry}
        />
      );
    }
    return this.props.children;
  }
}

export function ErrorFallback({
  label = 'this section',
  message,
  onRetry,
}: {
  label?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="text-center py-20 px-4 animate-fade-in">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] text-4xl">
        🔧
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">
        {label} couldn&apos;t load
      </h2>
      <p className="text-[var(--shinnslist-muted)] mb-6 text-sm max-w-xs mx-auto">
        {message || 'Something went wrong on our end. Please try again.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="touch-target inline-flex items-center gap-2 bg-[var(--shinnslist-pink)] text-white px-8 py-3 rounded-full text-sm font-bold hover:bg-fuchsia-600 active:scale-[0.98] transition-all"
        >
          Try again
        </button>
      )}
    </div>
  );
}

// Reusable empty state for "no results" across pages
export function EmptyState({
  message = 'No deals found',
  description = 'Try expanding your search area or checking back later.',
  emoji = '📦',
  action,
}: {
  message?: string;
  description?: string;
  emoji?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}) {
  return (
    <div className="text-center py-16 px-4 animate-fade-in-up">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] text-4xl">
        <span className="opacity-90">{emoji}</span>
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">{message}</h2>
      <p className="text-[var(--shinnslist-muted)] text-sm max-w-xs mx-auto">
        {description}
      </p>
      {action && (
        <div className="mt-6">
          {action.href ? (
            <a
              href={action.href}
              className="touch-target inline-flex items-center gap-2 border border-[var(--shinnslist-border)] text-white px-8 py-3 rounded-full text-sm font-medium hover:border-zinc-500 active:scale-[0.98] transition-all"
            >
              {action.label}
            </a>
          ) : (
            <button
              onClick={action.onClick}
              className="touch-target inline-flex items-center gap-2 border border-[var(--shinnslist-border)] text-white px-8 py-3 rounded-full text-sm font-medium hover:border-zinc-500 active:scale-[0.98] transition-all"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
