import type { Metadata } from 'next';
import Link from 'next/link';
import { compingStats, waterStats, zoneAStats } from '@/data/realEstate';

export const metadata: Metadata = {
  title: 'How we score — public sources, published formula, accuracy guarantee | Shinnslist RE',
  description: 'Every Shinnslist real-estate list is built exclusively from free official government records. Published scoring formula, join logic, backtest results, and the accuracy guarantee that replaces refund policies.',
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Where does the data come from?', acceptedAnswer: { '@type': 'Answer', text: 'Only free official government records: county treasurer delinquent-tax rolls, county assessor parcel tables, county recorder deed/sales data, and the Colorado Division of Water Resources well-permit registry. No scraped private databases, no purchased contact lists.' } },
    { '@type': 'Question', name: 'How is the score computed?', acceptedAnswer: { '@type': 'Answer', text: 'Score = (delinquency-depth weight × 40) + (equity-ratio weight × 60), scaled so a multi-year delinquent parcel with high equity approaches 600. Exact weights are published on this page. Entity-owned and partially-paid flags are published as separate columns, never hidden.' } },
    { '@type': 'Question', name: 'What is the accuracy guarantee?', acceptedAnswer: { '@type': 'Answer', text: 'If more than 10% of a delivered list\u2019s rows fail to match the official county record on verification (wrong parcel join, owner mismatch), we replace the file or credit the purchase — your choice. Every row ships with its source parcel ID so verification takes seconds.' } },
    { '@type': 'Question', name: 'How often is it refreshed?', acceptedAnswer: { '@type': 'Answer', text: 'Delinquent rolls refresh when each county publishes a new pre-sale list (Denver annually, ~August). Assessor joins use the current parcel table at build time. Water flags refresh weekly against the state well-permit registry.' } },
    { '@type': 'Question', name: 'Why is it so much cheaper than PropStream or ATTOM?', acceptedAnswer: { '@type': 'Answer', text: 'They resell the same public records inside $99\u2013749/month subscriptions with layers you may not need. We sell the joined, scored county-level list once, with the join logic published. Our cost basis is computation, not licensing.' } },
  ],
};

export default function MethodologyPage() {
  return (
    <div className="grant-page learn-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="grant-shell">
        <div className="learn-hero">
          <h1>How every list is built — sources, formula, guarantee.</h1>
          <p><strong>Public official records, joined. Nothing scraped, nothing bought.</strong> This page is the contract: if the method here isn&apos;t what you get, you don&apos;t pay.</p>
        </div>

        <div className="learn-prose" style={{ marginTop: 24 }}>
          <h2>1. Sources (all free, all official)</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, margin: '12px 0' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2ece6' }}>
                {['Layer', 'Source', 'Records'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#7d8b99', fontSize: 12, textTransform: 'uppercase' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f0f4f1' }}><td style={{ padding: '8px 10px' }}>Tax delinquency</td><td style={{ padding: '8px 10px' }}>County Treasurer pre-sale lists (free XLSX)</td><td style={{ padding: '8px 10px' }}>8,373 (Denver 2025)</td></tr>
              <tr style={{ borderBottom: '1px solid #f0f4f1' }}><td style={{ padding: '8px 10px' }}>Parcel spine</td><td style={{ padding: '8px 10px' }}>County Assessor open-data services (ArcGIS REST)</td><td style={{ padding: '8px 10px' }}>{zoneAStats.parcels.toLocaleString()} across Zone A (Denver / Jefferson / Boulder)</td></tr>
              <tr style={{ borderBottom: '1px solid #f0f4f1' }}><td style={{ padding: '8px 10px' }}>Sales / deeds</td><td style={{ padding: '8px 10px' }}>Denver Assessor sales & transfers layer + county recorder bulk data</td><td style={{ padding: '8px 10px' }}>309,548 recorded Denver transfers</td></tr>
              <tr style={{ borderBottom: '1px solid #f0f4f1' }}><td style={{ padding: '8px 10px' }}>Water rights (premium flag)</td><td style={{ padding: '8px 10px' }}>Colorado DWR well-permit registry API</td><td style={{ padding: '8px 10px' }}>{waterStats.wellsZoneA.toLocaleString()} wells, {waterStats.activeWells.toLocaleString()} active</td></tr>
            </tbody>
          </table>

          <h2>2. Scoring formula (published, frozen at build time)</h2>
          <pre style={{ background: '#0b0f14', color: '#d7e0ea', padding: 16, borderRadius: 10, fontSize: 13, overflowX: 'auto' }}>
{`depth_years   = sale_year - first_delinquent_tax_year      (min 1)
equity_ratio  = (assessed_value - total_owed) / assessed_value
score         = 10 * depth_years * (equity_ratio > 0 ? equity_ratio : 0)
                + 90 * (equity_ratio >= 0.9 ? 1 : 0)        # deep-equity bonus
flags         = owner_is_entity, tax_sale_indicator, partially_paid (published columns)`}
          </pre>
          <p style={{ color: '#7d8b99', fontSize: 13 }}>Scores are computed once per county roll and never edited afterward — the same freeze rule used on the public prediction ledger.</p>

          <h2>3. Comping engine backtest</h2>
          <p>
            The ARV model behind our value columns was backtested on <b>{compingStats.backtestSales.toLocaleString()} real recorded sales</b> ({compingStats.backtestMarket}):{' '}
            <b>{compingStats.medianErrorPct}% median absolute error</b>, <b>{compingStats.bandHitPct}% of estimates inside the ±10% band</b>. Zone A re-tune on Colorado sold-deed data is in progress and the numbers on this page update when it lands.
          </p>

          <h2>4. The guarantee (replaces refunds)</h2>
          <ul style={{ lineHeight: 1.9 }}>
            <li>Every row ships with its source parcel ID and the name of the source system.</li>
            <li>If &gt;10% of rows fail verification against the official record, you choose: <b>replacement file</b> or <b>credit back</b>.</li>
            <li>Data is point-in-time: counties correct rolls after publication. Rows you can&apos;t reproduce against today&apos;s roll aren&apos;t our miss — the build date is printed on every file.</li>
          </ul>

          <h2>5. What we never do</h2>
          <ul style={{ lineHeight: 1.9 }}>
            <li>No cold outreach to anyone on these lists — we sell data, we don&apos;solicit the owners.</li>
            <li>No credit-header/FCRA-shaped data, ever.</li>
            <li>No scraping behind login walls; if a portal blocks automated access, we use the alternative official source and say so.</li>
          </ul>

          <p style={{ marginTop: 24 }}>
            <Link href="/re/tax-delinquent-denver" style={{ color: '#0f766e', fontWeight: 700 }}>← Back to the Denver list</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
