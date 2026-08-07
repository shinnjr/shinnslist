import DealFeedClient from '@/components/DealFeedClient';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function HomePage() {
  return (
    <ErrorBoundary>
      <DealFeedClient initialListings={[]} />
    </ErrorBoundary>
  );
}
