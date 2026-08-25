'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ClipboardCheck, Loader2, ShieldCheck, Trash2 } from 'lucide-react';
import type { CartItem } from '@/lib/cart';
import { clearCart, getCart, isMember, recordMember, removeFromCart } from '@/lib/cart';
import { fmtCents, fmtMinutes, memberPriceCents, totalListedCents, totalMemberCents, DFY } from '@/lib/dfy';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function CartInner() {
  const params = useSearchParams();
  const [items, setItems] = useState<CartItem[]>([]);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState<null | { n: number; member: boolean }>(null);
  const member = isMember();

  useEffect(() => {
    const cart = getCart();
    const sessionId = params.get('session_id');
    const paid = params.get('paid');
    if (paid === '1' && sessionId) {
      // Coming back from Stripe — confirm server-side and record the order.
      setBusy(true);
      setItems(cart);
      fetch('/api/dfy-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          items: cart.map(withAnswers),
        }),
      })
        .then(async (r) => {
          const body = await r.json().catch(() => ({}));
          if (r.ok && body.ok) {
            recordMember();
            clearCart();
            setItems([]);
            setConfirmed({ n: cart.length, member: Boolean(body.member) });
          } else if (r.status === 402) {
            setError('Payment is still processing — refresh this page in a moment.');
          } else {
            setError(body.error === 'items do not match session'
              ? 'This order was already recorded.'
              : `Couldn't confirm the order: ${body.error || 'unknown error'}. Email us at support@shinnslist.com with your receipt.`);
          }
        })
        .catch(() => setError('Network error confirming order — refresh and it will retry.'))
        .finally(() => setBusy(false));
    } else {
      setItems(cart);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  function withAnswers(it: CartItem) {
    try {
      const raw = window.localStorage.getItem(`shinnslist_dfy_answers_${it.kind}_${it.slug}`);
      return raw ? { ...it, answers: JSON.parse(raw) } : it;
    } catch {
      return it;
    }
  }

  function checkout() {
    if (!EMAIL_RE.test(email)) {
      setError('Enter your email so we can send your confirmation and filing receipts.');
      return;
    }
    setBusy(true);
    setError('');
    fetch('/api/cart-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, items: items.map(({ kind, slug, name, listedCents, estMinutes }) => ({ kind, slug, name, listedCents, estMinutes })) }),
    })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (r.ok && body.url) {
          window.location.href = body.url;
        } else {
          setError(body.error === 'stripe_checkout_failed' ? 'Checkout is temporarily unavailable — try again in a few minutes.' : body.error || 'Could not start checkout.');
          setBusy(false);
        }
      })
      .catch(() => {
        setError('Network error — try again.');
        setBusy(false);
      });
  }

  if (confirmed) {
    return (
      <div className="learn-prose" style={{ textAlign: 'center', padding: '48px 0' }}>
        <ShieldCheck size={40} color="#087a55" style={{ margin: '0 auto' }} />
        <h1 style={{ fontSize: 28, marginTop: 12 }}>Order confirmed — we&apos;re on it.</h1>
        <p>
          {confirmed.n} item{confirmed.n > 1 ? 's' : ''} queued for filing. You&apos;ll get an email at checkout&apos;s
          address within one business day with next steps{confirmed.member ? ', and your membership is active — 75% off every future filing' : ''}.
        </p>
        <p style={{ fontSize: 13, color: '#55665c' }}>
          First month of membership is free, then ${DFY.memberMonthlyCents / 100}/mo — cancel anytime from the link in any receipt.
        </p>
        <Link href="/free-money/class-actions" className="grant-button grant-button-primary" style={{ marginTop: 12, display: 'inline-flex' }}>
          Keep looking — more free money
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="learn-prose" style={{ textAlign: 'center', padding: '48px 0' }}>
        <ClipboardCheck size={40} color="#087a55" style={{ margin: '0 auto' }} />
        <h1 style={{ fontSize: 28, marginTop: 12 }}>Your cart is empty.</h1>
        <p>Add class-action claims or grant applications and we&apos;ll prepare and file them for you — or file everything yourself for free.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
          <Link href="/free-money/class-actions" className="grant-button grant-button-primary">Browse class actions</Link>
          <Link href="/grants" className="grant-button grant-button-dark">Browse grants</Link>
        </div>
      </div>
    );
  }

  const listedTotal = totalListedCents(items);
  const memberTotal = totalMemberCents(items);

  return (
    <div className="learn-prose" style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 30 }}>Your filing cart</h1>
      <p>Everything here can be filed yourself for free — this service is us doing the paperwork for you.</p>

      <ul style={{ listStyle: 'none', margin: '24px 0 0', padding: 0 }}>
        {items.map((it) => (
          <li key={`${it.kind}:${it.slug}`} style={{ display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid #eef4f0', padding: '12px 0' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{it.name}</div>
              <div style={{ fontSize: 12, color: '#55665c' }}>
                {it.kind === 'class-action' ? 'Class-action claim' : 'Grant application'} · {fmtMinutes(it.estMinutes)} of work
              </div>
            </div>
            <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
              <div style={{ fontWeight: 700 }}>{fmtCents(member ? memberPriceCents(it.listedCents) : it.listedCents)}</div>
              {member && <div style={{ fontSize: 12, color: '#0b7a4b' }}>member price (75% off)</div>}
            </div>
            <button
              type="button"
              aria-label="Remove"
              onClick={() => { removeFromCart(it.kind, it.slug); setItems(getCart()); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9aa5a0' }}
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 24, border: '1px solid #e2ece6', borderRadius: 12, padding: 20, background: '#f6faf7' }}>
        {member ? (
          <>
            <h2 style={{ fontSize: 18, marginTop: 0 }}>Member pricing</h2>
            <p style={{ margin: 0 }}>
              <span style={{ textDecoration: 'line-through', color: '#55665c' }}>{fmtCents(listedTotal)}</span>{' '}
              <strong style={{ fontSize: 22 }}>{fmtCents(memberTotal)}</strong> — your 75% member discount applied.
            </p>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 18, marginTop: 0 }}>First-time bundle: {fmtCents(DFY.firstBundleCents)} flat</h2>
            <p style={{ margin: 0 }}>
              <span style={{ textDecoration: 'line-through', color: '#55665c' }}>{fmtCents(listedTotal)}</span>{' '}
              <strong style={{ fontSize: 22 }}>{fmtCents(DFY.firstBundleCents)}</strong> — we prepare and file everything in your cart, no matter how many items.
            </p>
            <p style={{ margin: '10px 0 0', fontSize: 13, color: '#55665c' }}>
              First month of membership is free, then ${DFY.memberMonthlyCents / 100}/mo — cancel anytime. Members get 75% off every future filing.
              Returning without membership? Items bill at listed price.
            </p>
          </>
        )}

        <div style={{ marginTop: 16 }}>
          <label htmlFor="dfy-email" style={{ fontWeight: 600, fontSize: 14 }}>Email for receipts and filing updates</label>
          <input
            id="dfy-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ width: '100%', marginTop: 6, padding: '10px 12px', borderRadius: 8, border: '1px solid #d5e2da', fontSize: 15 }}
          />
          <p style={{ fontSize: 12, color: '#55665c', margin: '8px 0 0' }}>
            We only email about the filings you ordered and your membership. No spam, no reselling, one-click unsubscribe.
          </p>
        </div>

        {error && <p style={{ color: '#b42318', fontWeight: 600, marginTop: 12 }}>{error}</p>}

        <button
          type="button"
          onClick={checkout}
          disabled={busy}
          className="grant-button grant-button-primary"
          style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, opacity: busy ? 0.6 : 1 }}
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <ClipboardCheck size={16} />}
          {busy ? 'Opening secure checkout…' : member ? `Check out — ${fmtCents(memberTotal)}` : `Check out — ${fmtCents(DFY.firstBundleCents)} flat`}
        </button>

        <p style={{ fontSize: 12, color: '#55665c', marginTop: 12 }}>
          Shinnslist is not a law firm. We take no cut of any settlement or award — the claim is yours.
          Every claim on this site can be filed yourself for free from its official site.
        </p>
      </div>
    </div>
  );
}
