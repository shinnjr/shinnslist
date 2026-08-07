'use client';

import { useState } from 'react';
import {
  ADDONS,
  TIER_BUNDLED_ADDONS,
  dollars,
  type AddonKey,
  type Tier,
} from '@/lib/pricing';

interface TierCard {
  name: string;
  tier: Tier;
  price: string;
  period: string;
  desc: string;
  features: string[];
  cta: string;
  highlighted: boolean;
}

const TIER_CARDS: TierCard[] = [
  {
    name: 'Free',
    tier: 'free',
    price: '$0',
    period: '',
    desc: "One ZIP code. See what you're missing.",
    features: [
      '1 ZIP code search',
      'Deal scores visible',
      'Browse all verticals',
      '15-min alert delay',
      'Ads supported',
    ],
    cta: 'Start Free',
    highlighted: false,
  },
  {
    name: 'Pro',
    tier: 'pro',
    price: '$5',
    period: '/week',
    desc: 'The no-brainer. Every vertical. Every alert.',
    features: [
      'All 10 verticals',
      'Draw custom zones',
      'Basic alerts included',
      'Deal scores + comps',
      '25-mile default radius',
      'Email digest',
    ],
    cta: 'Go Pro',
    highlighted: true,
  },
  {
    name: 'Pro Flipper',
    tier: 'flipper',
    price: '$20',
    period: '/week',
    desc: 'Everything. Unlimited. No caps.',
    features: [
      'Everything in Pro',
      'Instant alerts (no delay)',
      'Multi-city + road trip mode',
      'Historical comps + research',
      'Data export (CSV)',
      'API access',
      'No ads',
    ],
    cta: 'Go Pro Flipper',
    highlighted: false,
  },
];

const PAID_TIERS: Tier[] = ['pro', 'flipper'];

export default function PricingPage() {
  const [selected, setSelected] = useState<AddonKey[]>([]);
  const [loading, setLoading] = useState<null | 'pro' | 'flipper' | 'manage'>(null);
  const [error, setError] = useState<string | null>(null);

  function toggle(addon: AddonKey) {
    setError(null);
    setSelected((prev) =>
      prev.includes(addon) ? prev.filter((a) => a !== addon) : [...prev, addon]
    );
  }

  async function checkout(tier: Exclude<Tier, 'free'>) {
    setLoading(tier);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, addons: selected }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (!res.ok || !data.url) {
        setError(data.error || 'Could not start checkout. Please try again.');
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(null);
    }
  }

  async function manageSubscription() {
    setLoading('manage');
    setError(null);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (!res.ok || !data.url) {
        setError(data.error || 'Could not open billing portal.');
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(null);
    }
  }

  // Price math per tier: base + selected add-ons that aren't bundled with that tier.
  function totalFor(tier: Tier): number {
    const base =
      tier === 'flipper' ? 2000 : tier === 'pro' ? 500 : 0;
    const bundled = TIER_BUNDLED_ADDONS[tier];
    const addonCents = ADDONS.filter(
      (a) => selected.includes(a.addon!) && !bundled.includes(a.addon!)
    ).reduce((sum, a) => sum + a.amount, 0);
    return base + addonCents;
  }

  return (
    <main className="flex-1">
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            <span className="text-[var(--shinnslist-pink)]">$5/week.</span> All verticals.
          </h1>
          <p className="text-[var(--shinnslist-muted)] text-lg max-w-xl mx-auto">
            No contracts. No annual billing. Cancel anytime. Every add-on is optional — you only
            pay for what you use.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {TIER_CARDS.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-6 border flex flex-col ${
                tier.highlighted
                  ? 'border-[var(--shinnslist-pink)] bg-[var(--shinnslist-pink)]/5'
                  : 'border-[var(--shinnslist-border)] bg-[var(--shinnslist-surface)]'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--shinnslist-pink)] text-white text-xs font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}

              <h3 className="text-lg font-bold text-white mb-1">{tier.name}</h3>
              <div className="mb-3">
                <span className="text-3xl font-black text-white">{tier.price}</span>
                <span className="text-[var(--shinnslist-muted)] text-sm">{tier.period}</span>
              </div>
              <p className="text-[var(--shinnslist-muted)] text-sm mb-6">{tier.desc}</p>

              <ul className="space-y-2 mb-6 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[var(--shinnslist-muted)]">
                    <span className="text-[var(--shinnslist-green)] mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {tier.tier === 'free' ? (
                <a
                  href="/"
                  className="block w-full text-center py-3 rounded-full font-bold text-sm border border-[var(--shinnslist-border)] text-white hover:border-zinc-500 transition-colors"
                >
                  Start Free
                </a>
              ) : (
                <button
                  onClick={() => checkout(tier.tier as Exclude<Tier, 'free'>)}
                  disabled={loading !== null}
                  className={`block w-full text-center py-3 rounded-full font-bold text-sm transition-colors disabled:opacity-60 ${
                    tier.highlighted
                      ? 'bg-[var(--shinnslist-pink)] text-white hover:bg-fuchsia-600'
                      : 'border border-[var(--shinnslist-border)] text-white hover:border-zinc-500'
                  }`}
                >
                  {loading === tier.tier ? 'Opening checkout…' : `${tier.cta}${selected.length ? ` · ${dollars(totalFor(tier.tier))}` : ''}`}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add-ons */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-2 text-center">
            Add-ons — check what you need
          </h2>
          <p className="text-center text-xs text-[var(--shinnslist-muted)] mb-6">
            Add-ons are billed with your subscription. Some are already included with Pro / Pro
            Flipper.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ADDONS.map((addon) => {
              const key = addon.addon!;
              const bundled = TIER_BUNDLED_ADDONS['flipper'].includes(key);
              const active = selected.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggle(key)}
                  disabled={bundled}
                  className={`text-left bg-[var(--shinnslist-surface)] border rounded-xl p-4 flex justify-between items-center transition-colors disabled:cursor-default ${
                    active
                      ? 'border-[var(--shinnslist-pink)] bg-[var(--shinnslist-pink)]/10'
                      : 'border-[var(--shinnslist-border)] hover:border-zinc-600'
                  }`}
                >
                  <div>
                    <h4 className="text-white font-medium text-sm flex items-center gap-2">
                      {addon.name}
                      {bundled && (
                        <span className="text-[10px] uppercase tracking-wide text-[var(--shinnslist-green)] border border-[var(--shinnslist-green)]/40 rounded-full px-2 py-0.5">
                          Included w/ Flipper
                        </span>
                      )}
                    </h4>
                    <p className="text-[var(--shinnslist-muted)] text-xs mt-0.5">{addon.blurb}</p>
                  </div>
                  <span
                    className={`font-bold text-sm whitespace-nowrap ml-4 ${
                      bundled ? 'text-[var(--shinnslist-green)]' : 'text-[var(--shinnslist-green)]'
                    }`}
                  >
                    {bundled ? 'Included' : `+${dollars(addon.amount)}/wk`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <p className="text-center text-sm text-red-400 mt-6">{error}</p>
        )}

        {/* Manage existing subscription */}
        <div className="text-center mt-8">
          <button
            onClick={manageSubscription}
            disabled={loading !== null}
            className="text-sm text-[var(--shinnslist-muted)] underline hover:text-white disabled:opacity-60"
          >
            {loading === 'manage' ? 'Opening…' : 'Already a subscriber? Manage your plan'}
          </button>
        </div>

        <p className="text-center text-xs text-[var(--shinnslist-muted)] mt-6">
          All prices in USD. Cancel anytime. No refunds for partial weeks.
        </p>
      </section>
    </main>
  );
}
