export default function PricingPage() {
  const tiers = [
    {
      name: 'Free',
      price: '$0',
      period: '',
      desc: 'One ZIP code. See what you\'re missing.',
      features: [
        '1 ZIP code search',
        'Deal scores visible',
        'Browse all verticals',
        '15-min alert delay',
        'Ads supported',
      ],
      cta: 'Start Free',
      href: '/',
      highlighted: false,
    },
    {
      name: 'Pro',
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
      href: '/api/checkout?tier=pro',
      highlighted: true,
    },
    {
      name: 'Pro Flipper',
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
      href: '/api/checkout?tier=pro-flipper',
      highlighted: false,
    },
  ];

  const addons = [
    { name: 'Instant Alerts', price: '+$3/week', desc: 'Push notifications the second a deal drops' },
    { name: 'Multi-City', price: '+$5/week', desc: 'Monitor multiple cities per vertical' },
    { name: 'Historical Research', price: '+$4/week', desc: 'Sold price history, trends, seasonality' },
    { name: 'Data Export', price: '+$5/week', desc: 'CSV downloads, spreadsheet-ready' },
    { name: 'Road Trip Mode', price: '+$3/week', desc: 'Route-based alerts. Toggle on/off anytime' },
    { name: 'Email Digest', price: '+$2/week', desc: 'Daily top deals in your inbox' },
  ];

  return (
    <main className="flex-1">
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            <span className="text-[var(--shinnslist-pink)]">$5/week.</span> All verticals.
          </h1>
          <p className="text-[var(--shinnslist-muted)] text-lg max-w-xl mx-auto">
            No contracts. No annual billing. Cancel anytime. Every add-on is optional — you only pay for what you use.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {tiers.map(tier => (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-6 border ${
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

              <ul className="space-y-2 mb-6">
                {tier.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[var(--shinnslist-muted)]">
                    <span className="text-[var(--shinnslist-green)] mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={tier.href}
                className={`block w-full text-center py-3 rounded-full font-bold text-sm transition-colors ${
                  tier.highlighted
                    ? 'bg-[var(--shinnslist-pink)] text-white hover:bg-fuchsia-600'
                    : 'border border-[var(--shinnslist-border)] text-white hover:border-zinc-500'
                }`}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>

        {/* Add-ons */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-6 text-center">
            Add-ons — pay only for what you need
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {addons.map(addon => (
              <div key={addon.name} className="bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] rounded-xl p-4 flex justify-between items-center">
                <div>
                  <h4 className="text-white font-medium text-sm">{addon.name}</h4>
                  <p className="text-[var(--shinnslist-muted)] text-xs mt-0.5">{addon.desc}</p>
                </div>
                <span className="text-[var(--shinnslist-green)] font-bold text-sm whitespace-nowrap ml-4">
                  {addon.price}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-[var(--shinnslist-muted)] mt-8">
          All prices in USD. Cancel anytime. No refunds for partial weeks.{" "}
          <a href="#" className="underline hover:text-white">Terms apply</a>.
        </p>
      </section>
    </main>
  );
}
