'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, CheckCircle2, BadgeDollarSign, ArrowRight } from 'lucide-react';

/**
 * Email lead capture for the Free Money Finder.
 * Posts to /api/leads (Pages Function) which upserts into Supabase `leads`.
 * Honest: no spam, free alerts for newly-open settlements + bank bonuses.
 * Cross-sell: the small free money is a lead into the grant autopilot (the big free money).
 */
export default function FreeMoneyLeadCapture() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === 'busy') return;
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setState('error');
      setMessage('Enter a valid email address.');
      return;
    }
    setState('busy');
    setMessage('');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value, source: 'free-money-hub' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setState('done');
        setMessage('You\u2019re on the list. We\u2019ll email you when new money opens up.');
      } else {
        setState('error');
        setMessage(data.error === 'rate_limited' ? 'Too many tries \u2014 please wait a minute.' : 'Something went wrong. Please try again.');
      }
    } catch {
      setState('error');
      setMessage('Network error \u2014 please try again.');
    }
  }

  return (
    <div className="learn-card" style={{ marginTop: 8 }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Mail size={20} color="#087a55" />
        New money, before it closes
      </h2>
      <p style={{ margin: '6px 0 12px' }}>
        New class-action settlements open every week and close fast. Leave an
        email and we&apos;ll alert you to the ones worth filing. Free, no spam, unsubscribe anytime.
      </p>

      {state === 'done' ? (
        <div className="bonus-row" style={{ background: '#e8f5ee', borderRadius: 8, padding: '12px 14px' }}>
          <CheckCircle2 size={18} color="#087a55" />
          <span style={{ color: '#0a5c3c', fontWeight: 600 }}>{message}</span>
        </div>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Email address"
            style={{
              flex: '1 1 220px',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #d7dde3',
              fontSize: 15,
            }}
          />
          <button type="submit" className="grant-button grant-button-dark" disabled={state === 'busy'}>
            {state === 'busy' ? 'Saving\u2026' : 'Get alerts'}
          </button>
        </form>
      )}

      {state === 'error' && <p style={{ color: '#b42318', marginTop: 8, fontSize: 14 }}>{message}</p>}

      <div style={{ marginTop: 16, borderTop: '1px solid #eef4f0', paddingTop: 14 }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, color: '#0b3d29' }}>
          <BadgeDollarSign size={18} color="#087a55" />
          The small money is fine. The big money is grants.
        </h3>
        <p style={{ margin: '6px 0 10px', fontSize: 14, color: '#55665c', lineHeight: 1.5 }}>
          Grants you qualify for can be thousands of dollars — and they don&apos;t get paid back.
          Shinnslist finds them, checks your eligibility, and drafts the application. You review and
          approve before anything is submitted.
        </p>
        <Link href="/grants" className="grant-button grant-button-dark" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          Find grants you qualify for <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
