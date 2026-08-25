import type { Metadata } from 'next';
import UnifiedFind from '@/components/UnifiedFind';

export const metadata: Metadata = {
  title: 'Find money & programs you qualify for | Shinnslist',
  description:
    'One search across grants, benefits, and open class-action settlements — the money and programs already out there for you. Free and honest.',
};

export default function FindPage() {
  return (
    <div className="grant-page learn-page">
      <UnifiedFind />
    </div>
  );
}
