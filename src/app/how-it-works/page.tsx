export const metadata = {
  title: 'How Shinnslist Works — Find Deals Before Anyone Else',
  description: 'Shinnslist scans 10 marketplaces, scores every listing, and alerts you when something is undervalued. Free to use.',
};

export default function HowItWorksPage() {
  const steps = [
    { emoji: '🔍', title: 'We Scrape', desc: 'Every 2 hours, our bots scan Craigslist, Facebook Marketplace, OfferUp, Nextdoor, and more across Denver, Boulder, Colorado Springs, and Fort Collins.' },
    { emoji: '🧠', title: 'We Score', desc: 'Our AI-powered heuristic engine scores every listing 0-100 based on price, urgency, rarity, and condition. Zero API keys. All open source.' },
    { emoji: '🔔', title: 'We Alert', desc: 'Pro users get instant push notifications the moment a deal scores above 70. Free users can browse and search the live feed.' },
    { emoji: '💰', title: 'You Save', desc: 'The average Shinnslist deal is 40-60% below MSRP. Our users regularly find $500+ items listed for free or at deep discounts.' },
  ];

  const stats = [
    { value: '1,372+', label: 'Active listings' },
    { value: '10', label: 'Verticals' },
    { value: '5', label: 'Data sources' },
    { value: '40-60%', label: 'Avg savings' },
  ];

  return (
    <main className="flex-1">
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <span className="text-5xl">🆓</span>
          <h1 className="text-3xl md:text-4xl font-bold text-white mt-4">How Shinnslist Works</h1>
          <p className="text-[var(--shinnslist-muted)] text-lg mt-3 max-w-xl mx-auto">
            We find the deals. You decide what to buy. Simple.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map(s => (
            <div key={s.label} className="bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] rounded-xl p-6 text-center">
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-[var(--shinnslist-muted)] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {steps.map((step, i) => (
            <div key={step.title} className="flex gap-4 p-6 bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] rounded-2xl">
              <div className="text-4xl shrink-0">{step.emoji}</div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-[var(--shinnslist-pink)] font-bold">Step {i + 1}</span>
                  <h3 className="text-white font-bold text-lg">{step.title}</h3>
                </div>
                <p className="text-[var(--shinnslist-muted)] text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to find your first deal?</h2>
          <div className="flex gap-4 justify-center">
            <a href="/onboarding" className="bg-[var(--shinnslist-pink)] text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-fuchsia-600 transition-colors">
              Get started — it's free
            </a>
            <a href="/pricing" className="border border-[var(--shinnslist-border)] text-white px-8 py-3 rounded-full font-medium text-sm hover:border-zinc-500 transition-colors">
              See pricing
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
