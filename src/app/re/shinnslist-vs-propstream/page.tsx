import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Shinnslist vs PropStream vs ListSource — county-level list comparison (2026)',
  description: 'Side-by-side comparison of Shinnslist county data lists against PropStream, ListSource, and ATTOM: pricing model, data sources, guarantees, and who each is for. Published 2026.',
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Is Shinnslist a PropStream replacement?', acceptedAnswer: { '@type': 'Answer', text: 'For county-level lead lists (tax-delinquent, water-flagged parcels, distress signals), yes — same underlying public records at a fraction of the subscription price. For nationwide title chains, mortgage lien detail, and MLS-grade comps across all 3,100 counties, PropStream still covers more.' } },
    { '@type': 'Question', name: 'Why can Shinnslist sell lists for $29 when PropStream charges $99+/month?', acceptedAnswer: { '@type': 'Answer', text: 'The underlying data is free official county records. PropStream bundles nationwide coverage, a UI, and title-chain depth into a subscription. Shinnslist sells one county\u2019s joined, scored list at a time with the join logic published — computation cost, not licensing cost.' } },
    { '@type': 'Question', name: 'Does Shinnslist require a subscription?', acceptedAnswer: { '@type': 'Answer', text: 'No. Every list is a one-time purchase with guest checkout and email delivery. Optional weekly-refresh alerts for a county exist separately and are never required.' } },
  ],
};

const rows: Array<[string, string, string, string]> = [
  ['Pricing', '$29 per county list (one-time)', '$99–$149/month subscription', '$99–749/mo subscriptions, or $0.10–0.30/record bulk (no guarantee published)'],
  ['Source data', 'Official county treasurer/assessor/recorder records + CO DWR well permits — sources named on every page', 'County records + licensed title data + credit-header appends', 'County records + proprietary appends'],
  ['Coverage', 'Deep on select counties (Zone A: Denver / Jefferson / Boulder, CO; Zone B Virginia in progress)', 'All ~3,100 US counties', 'All counties, variable depth'],
  ['Water-rights flags', 'Yes — 76,639 well permits joined for Zone A counties', 'Limited / not standard', 'Limited'],
  ['Mailing addresses', 'Included on every joined row (assessor records)', 'Included (skip-tracing bundled)', 'Paid add-on'],
  ['Transparency', 'Scoring formula + sources published; accuracy guarantee in writing', 'Proprietary', 'Proprietary'],
  ['Guarantee', '>10% failed rows → replacement or credit, your choice', 'Cancel anytime (no data-quality guarantee)', 'None published'],
  ['Best for', 'Investors who work 1–3 counties and want the raw scored list', 'Nationwide wholesalers + teams needing UI, comps, title chains', 'Bulk buyers wanting any list shape'],
];

export default function ComparisonPage() {
  return (
    <div className="grant-page learn-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="grant-shell">
        <div className="learn-hero">
          <h1>Shinnslist vs PropStream vs ListSource (2026)</h1>
          <p><strong>Same public records, different packaging — and a 4–25× price gap.</strong> Honest comparison below, including where the incumbents are still better.</p>
        </div>
        <div style={{ overflowX: 'auto', border: '1px solid #e2ece6', borderRadius: 12, background: '#fff', marginTop: 24 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 860 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2ece6' }}>
                {['', 'Shinnslist', 'PropStream', 'ListSource / ATTOM'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 14px', color: h === 'Shinnslist' ? '#0f766e' : '#7d8b99', fontSize: 12, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, a, b, c]) => (
                <tr key={label} style={{ borderBottom: '1px solid #f0f4f1' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700 }}>{label}</td>
                  <td style={{ padding: '12px 14px' }}>{a}</td>
                  <td style={{ padding: '12px 14px', color: '#5b6b62' }}>{b}</td>
                  <td style={{ padding: '12px 14px', color: '#5b6b62' }}>{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="learn-prose" style={{ marginTop: 24 }}>
          <h2>The honest short version</h2>
          <ul style={{ lineHeight: 1.9 }}>
            <li><b>Choose PropStream</b> if you need nationwide coverage, mortgage-lien chains, or a daily-driver UI across many markets.</li>
            <li><b>Choose Shinnslist</b> if you fish in Colorado&apos;s Front Range (or Virginia Piedmont soon) and want the county&apos;s actual delinquent roll, scored and joined, once, for less than a month of anyone&apos;s subscription.</li>
            <li>Both are legal and both use public records — the difference is packaging, price, and whether the method is published.</li>
          </ul>
          <p style={{ marginTop: 16 }}>
            <Link href="/re" style={{ color: '#0f766e', fontWeight: 700 }}>Browse current lists →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
