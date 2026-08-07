export const metadata = { title: 'Privacy Policy — Shinnslist', description: 'Shinnslist privacy policy. We collect minimal data. We never sell your data.' };

export default function PrivacyPage() {
  return (
    <main className="flex-1 max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>
      <div className="prose prose-invert max-w-none space-y-6 text-[var(--shinnslist-muted)] text-sm leading-relaxed">
        <p><strong className="text-white">Last updated:</strong> August 7, 2026</p>
        <h2 className="text-white text-lg font-bold mt-8">What We Collect</h2>
        <p>Shinnslist collects the minimum data needed to provide deal alerts: your email address (if you sign up), your location preferences, and your selected interest categories. We do not collect browsing history, personal messages, or payment information (payments are handled by Stripe).</p>
        <h2 className="text-white text-lg font-bold mt-8">How We Use Your Data</h2>
        <p>Your data is used exclusively to personalize your deal feed and send you relevant alerts. We never sell, rent, or share your personal data with third parties. Period.</p>
        <h2 className="text-white text-lg font-bold mt-8">Scraping & Data Sources</h2>
        <p>Shinnslist aggregates publicly available marketplace listings. We do not scrape private messages, user profiles, or any non-public data. All listings we display are publicly accessible.</p>
        <h2 className="text-white text-lg font-bold mt-8">Cookies</h2>
        <p>We use essential cookies for authentication and preferences. No tracking cookies. No analytics cookies. No advertising cookies.</p>
        <h2 className="text-white text-lg font-bold mt-8">Contact</h2>
        <p>Questions? Email <a href="mailto:hello@shinnslist.com" className="text-[var(--shinnslist-pink)] hover:underline">hello@shinnslist.com</a>.</p>
      </div>
    </main>
  );
}
