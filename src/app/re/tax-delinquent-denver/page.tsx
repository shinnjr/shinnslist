import type { Metadata } from 'next';
import Link from 'next/link';
import { Download, ShieldCheck, Database, Droplets, ChevronRight } from 'lucide-react';
import { denverTaxDelinquentPreview, denverTaxDelinquent, compingStats } from '@/data/realEstate';

export const metadata: Metadata = {
  title: 'Denver tax-delinquent properties — scored list, official county data | Shinnslist',
  description: `All ${denverTaxDelinquent.total.toLocaleString()} Denver properties on the official pre-lien-sale delinquent tax list, scored by delinquency depth, equity ratio, and ownership type. Owners, mailing addresses, and parcel data joined from the Denver Assessor. Preview 10 rows free, no email.`,
};

const productJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Denver Tax-Delinquent Properties — Scored CSV',
  description: `Scored list of all ${denverTaxDelinquent.total.toLocaleString()} Denver properties on the official 2025 pre-lien-sale delinquent tax roll, joined to Denver Assessor parcel data (owners, mailing addresses, property characteristics).`,
  brand: { '@type': 'Brand', name: 'Shinnslist' },
  offers: { '@type': 'Offer', price: '29', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
  additionalProperty: [
    { '@type': 'PropertyValue', name: 'rows', value: denverTaxDelinquent.total.toLocaleString() },
    { '@type': 'PropertyValue', name: 'source', value: denverTaxDelinquent.sources.map((s) => s.label).join('; ') },
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Where does this list come from?', acceptedAnswer: { '@type': 'Answer', text: 'Every row traces to an official public record: the Denver Treasurer publishes the delinquent-tax advertising list as a free XLSX before each annual tax-lien sale, and the Denver Assessor publishes parcel, owner, and mailing-address data through its open-data service. We join them — nothing is scraped from private databases.' } },
    { '@type': 'Question', name: 'How fresh is the data?', acceptedAnswer: { '@type': 'Answer', text: `The delinquent roll is the ${denverTaxDelinquent.listVintage} official list (${denverTaxDelinquent.total.toLocaleString()} entries). Assessor joins use the current parcel table. Each list is rebuilt when the county publishes a new roll.` } },
    { '@type': 'Question', name: 'What does the score mean?', acceptedAnswer: { '@type': 'Answer', text: 'A 0–600 investor-attractiveness score: delinquency depth (years unpaid), equity ratio (assessed value vs. tax owed), and whether the owner is an entity or an individual. Higher = deeper distress with more recoverable equity. The formula and every source are published on the methodology page.' } },
    { '@type': 'Question', name: 'Is this a subscription?', acceptedAnswer: { '@type': 'Answer', text: 'No. One-time purchase, guest checkout, no account required. The CSV is delivered by email immediately after payment.' } },
    { '@type': 'Question', name: 'What if rows are wrong?', acceptedAnswer: { '@type': 'Answer', text: 'Every row carries its source system and parcel ID, so any row is independently verifiable against the official record. If we materially misjoin records against the guarantee terms, you get a replacement file or credit back — terms on the methodology page.' } },
  ],
};

export default function TaxDelinquentDenverPage() {
  return (
    <div className="grant-page learn-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="grant-shell">
        <p style={{ fontSize: 13, marginBottom: 8 }}>
          <Link href="/re" style={{ color: '#7d8b99' }}>Real-estate data</Link> <ChevronRight style={{ display: 'inline', width: 12, height: 12 }} /> Tax-delinquent · Denver
        </p>
        <div className="learn-hero">
          <h1>{denverTaxDelinquent.total.toLocaleString()} Denver properties behind on taxes — scored, joined, one CSV.</h1>
          <p>
            <strong>Denver&apos;s official pre-lien-sale delinquent roll, joined to the Assessor&apos;s owner and mailing-address data.</strong> Delinquency depth, equity ratio, and owner type scored for every row. This is the same raw material title companies resell at $99–749/month — sourced 100% from free official records, published here with the join logic attached.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, margin: '28px 0' }}>
          <div style={{ border: '1px solid #e2ece6', borderRadius: 12, padding: 16, background: '#fff' }}>
            <Database size={20} color="#4ade80" />
            <b style={{ display: 'block', marginTop: 6 }}>{denverTaxDelinquent.total.toLocaleString()} rows</b>
            <span style={{ fontSize: 13, color: '#7d8b99' }}>{denverTaxDelinquent.joined.toLocaleString()} joined to assessor data</span>
          </div>
          <div style={{ border: '1px solid #e2ece6', borderRadius: 12, padding: 16, background: '#fff' }}>
            <Droplets size={20} color="#38bdf8" />
            <b style={{ display: 'block', marginTop: 6 }}>{denverTaxDelinquent.multiYearDelinquent} multi-year</b>
            <span style={{ fontSize: 13, color: '#7d8b99' }}>2019 + 2023 cohorts — deepest distress first</span>
          </div>
          <div style={{ border: '1px solid #e2ece6', borderRadius: 12, padding: 16, background: '#fff' }}>
            <ShieldCheck size={20} color="#4ade80" />
            <b style={{ display: 'block', marginTop: 6 }}>100% official sources</b>
            <span style={{ fontSize: 13, color: '#7d8b99' }}>Denver Treasurer + Denver Assessor open data</span>
          </div>
        </div>

        <h2 style={{ marginTop: 8 }}>Preview the first 10 rows — free, no email</h2>
        <p style={{ color: '#7d8b99', fontSize: 14 }}>Exactly what&apos;s in the file, highest scores first. Mailing addresses are included for every joined row in the paid CSV.</p>
        <div style={{ overflowX: 'auto', border: '1px solid #e2ece6', borderRadius: 12, background: '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 760 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2ece6' }}>
                {['Score', 'Owner', 'Property', 'Neighborhood', 'Tax owed', 'Total w/ interest', 'Assessed value', 'Equity ratio', 'Years'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#7d8b99', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {denverTaxDelinquentPreview.map((r) => (
                <tr key={r.parcel} style={{ borderBottom: '1px solid #f0f4f1' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f766e' }}>{r.score}</td>
                  <td style={{ padding: '10px 12px', maxWidth: 200 }}>{r.owner}{r.entityOwner ? <span style={{ display: 'block', fontSize: 11, color: '#7d8b99' }}>entity</span> : null}</td>
                  <td style={{ padding: '10px 12px' }}>{r.addr}</td>
                  <td style={{ padding: '10px 12px', color: '#7d8b99' }}>{r.hood}</td>
                  <td style={{ padding: '10px 12px' }}>${r.taxOwed.toLocaleString()}</td>
                  <td style={{ padding: '10px 12px' }}>${r.totalOwed.toLocaleString()}</td>
                  <td style={{ padding: '10px 12px' }}>${r.assessed.toLocaleString()}</td>
                  <td style={{ padding: '10px 12px' }}>{Math.round(r.equityRatio * 100)}%</td>
                  <td style={{ padding: '10px 12px' }}>{r.yearsDelinquent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12, color: '#7d8b99', marginTop: 8 }}>
          Paid CSV adds: full owner + mailing address, parcel ID, tax-sale indicator, partial-payment status, beds/baths/year built, legal description, and all {denverTaxDelinquent.total.toLocaleString()} rows.
        </p>

        <div style={{ border: '2px solid #0f766e', borderRadius: 16, padding: 28, margin: '32px 0', background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>${denverTaxDelinquent.priceUsd} <span style={{ fontSize: 14, fontWeight: 400, color: '#7d8b99' }}>one-time · instant email delivery · guest checkout</span></div>
              <div style={{ fontSize: 13, color: '#7d8b99', marginTop: 4 }}>Incumbents charge $99–749/month subscriptions for this data. We sell it once, with sources attached.</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <a href="/re/methodology" style={{ display: 'block', fontSize: 13, color: '#7d8b99', marginBottom: 8 }}>How it&apos;s built + guarantee</a>
              <Link href="#buy" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0f766e', color: '#fff', padding: '12px 24px', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>
                <Download size={16} /> Get the full CSV
              </Link>
            </div>
          </div>
          <div id="buy" style={{ marginTop: 20, padding: 16, background: '#f6faf8', borderRadius: 10, fontSize: 13, color: '#374151' }}>
            <b>Checkout is being finalized.</b> The list is ready; email delivery wiring ships with the checkout worker this week. In the meantime the preview above is fully ungated and every row is verifiable against the official records listed below.
          </div>
        </div>

        <h2>Sources & freshness</h2>
        <ul style={{ lineHeight: 2, fontSize: 14 }}>
          {denverTaxDelinquent.sources.map((s) => (
            <li key={s.label}><a href={s.url} style={{ color: '#0f766e' }}>{s.label}</a>{s.rows ? ` — ${s.rows.toLocaleString()} records` : ''}{s.updated ? ` · updated ${s.updated}` : ''}</li>
          ))}
          <li>Comping engine backtest ({compingStats.sampleSize.toLocaleString()} NYC sales): <b>{compingStats.medianErrorPct}% median error, {compingStats.bandHitPct}% of estimates inside the ±10% band</b> — full method on the <Link href="/re/methodology" style={{ color: '#0f766e' }}>methodology page</Link>.</li>
        </ul>
      </div>
    </div>
  );
}
