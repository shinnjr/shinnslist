'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardCheck, ShoppingCart } from 'lucide-react';
import type { DfyItem } from '@/lib/dfy';
import { fmtCents, fmtMinutes } from '@/lib/dfy';
import { addToCart, getCart } from '@/lib/cart';

/**
 * "We'll fill it out for you" — add-to-cart button with the honest
 * time estimate and rolling-rate price. Fully disclosed: filing is
 * free if you do it yourself; this is a convenience fee only.
 */
export default function DfyButton({
  item,
  variant = 'row',
}: {
  item: DfyItem;
  variant?: 'row' | 'block';
}) {
  const [inCartState, setInCartState] = useState(false);

  useEffect(() => {
    setInCartState(
      getCart().some((i) => i.kind === item.kind && i.slug === item.slug)
    );
  }, [item.kind, item.slug]);

  function handleAdd() {
    if (addToCart(item)) setInCartState(true);
  }

  if (variant === 'block') {
    return (
      <div className="dfy-block" style={{ marginTop: 12 }}>
        <div className="dfy-estimate">
          <span className="dfy-clock">{fmtMinutes(item.estMinutes)}</span>
          <span className="dfy-price">{fmtCents(item.listedCents)}</span>
        </div>
        {inCartState ? (
          <Link href="/cart" className="grant-button grant-button-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ShoppingCart size={16} /> In cart — checkout
          </Link>
        ) : (
          <button type="button" onClick={handleAdd} className="grant-button grant-button-dark" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ClipboardCheck size={16} /> We&apos;ll fill it out for you
          </button>
        )}
        <p className="dfy-disclosure" style={{ fontSize: 12, color: '#55665c', marginTop: 8 }}>
          Free if you file it yourself — this is a convenience fee for us to prepare and file it.
          No cut of your payout, ever.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
      <span style={{ fontSize: 11, color: '#55665c' }}>{fmtMinutes(item.estMinutes)} of work</span>
      {inCartState ? (
        <Link
          href="/cart"
          style={{ fontSize: 12, fontWeight: 700, color: '#0b7a4b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          <ShoppingCart size={13} /> In cart — checkout
        </Link>
      ) : (
        <button
          type="button"
          onClick={handleAdd}
          style={{
            fontSize: 12,
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 999,
            border: '1px solid #0b7a4b',
            background: '#e8f5ee',
            color: '#0a5c3c',
            cursor: 'pointer',
          }}
          title={`We'll prepare and file this claim for ${fmtCents(item.listedCents)} (free if you do it yourself)`}
        >
          We&apos;ll file it · {fmtCents(item.listedCents)}
        </button>
      )}
    </div>
  );
}
