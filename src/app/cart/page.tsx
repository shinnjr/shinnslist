import type { Metadata } from 'next';
import { Suspense } from 'react';
import CartInner from './CartInner';

export const metadata: Metadata = {
  title: 'Your filing cart | Shinnslist',
  description: 'Done-for-you filing: we prepare and file your class-action claims and grant applications. Filing yourself is always free — this is an optional convenience service.',
};

export default function CartPage() {
  return (
    <div className="grant-page learn-page">
      <div className="grant-shell">
        <Suspense fallback={<p style={{ padding: 40 }}>Loading cart…</p>}>
          <CartInner />
        </Suspense>
      </div>
    </div>
  );
}
