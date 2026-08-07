export const metadata = { title: 'Terms of Service - Shinnslist', description: 'Terms of service for Shinnslist. Use responsibly.' };

export default function TermsPage() {
  return (
    <main className="flex-1 max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-white mb-8">Terms of Service</h1>
      <div className="prose prose-invert max-w-none space-y-6 text-[var(--shinnslist-muted)] text-sm leading-relaxed">
        <p><strong className="text-white">Last updated:</strong> August 7, 2026</p>
        <h2 className="text-white text-lg font-bold mt-8">1. Acceptance</h2>
        <p>By using Shinnslist, you agree to these terms.</p>
        <h2 className="text-white text-lg font-bold mt-8">2. Service Description</h2>
        <p>Shinnslist aggregates publicly available marketplace listings. We do not own, sell, or warranty any items listed.</p>
        <h2 className="text-white text-lg font-bold mt-8">3. Payments</h2>
        <p>Paid features are billed weekly through Stripe. Cancel anytime. Refunds handled case-by-case.</p>
        <h2 className="text-white text-lg font-bold mt-8">4. Liability</h2>
        <p>Shinnslist is provided as-is. Buyer beware.</p>
        <h2 className="text-white text-lg font-bold mt-8">5. Contact</h2>
        <p>Email <a href="mailto:hello@shinnslist.com" className="text-[var(--shinnslist-pink)] hover:underline">hello@shinnslist.com</a>.</p>
      </div>
    </main>
  );
}
