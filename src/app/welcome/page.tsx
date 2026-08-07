export default function WelcomePage() {
  return (
    <main className="flex-1 flex items-center justify-center">
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-white mb-3">
          Welcome to <span className="text-[var(--shinnslist-pink)]">Shinnslist</span>!
        </h1>
        <p className="text-[var(--shinnslist-muted)] text-lg mb-8">
          Your deal feed is live. Start exploring or set up your zones to get alerts.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/"
            className="bg-[var(--shinnslist-pink)] text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-fuchsia-600 transition-colors"
          >
            View Deal Feed →
          </a>
          <a
            href="/zones"
            className="border border-[var(--shinnslist-border)] text-white px-8 py-3 rounded-full font-medium text-sm hover:border-zinc-500 transition-colors"
          >
            Set Up Zones
          </a>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          {[
            { emoji: '📱', title: 'Get the app', desc: 'Add Shinnslist to your home screen for instant access.' },
            { emoji: '🔔', title: 'Turn on alerts', desc: 'Enable push notifications to never miss a deal.' },
            { emoji: '🗺️', title: 'Draw your zones', desc: 'Custom polygon zones instead of circle radius.' },
          ].map(item => (
            <div key={item.title} className="bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] rounded-xl p-4">
              <div className="text-2xl mb-2">{item.emoji}</div>
              <h3 className="text-white font-bold text-sm mb-1">{item.title}</h3>
              <p className="text-[var(--shinnslist-muted)] text-xs">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
