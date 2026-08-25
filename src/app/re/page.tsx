import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Database, Droplets, LineChart } from 'lucide-react';
import { denverTaxDelinquentPreview, compingStats, waterStats, reSkus } from '@/data/realEstate';

export const metadata: Metadata = {
  title: 'Scored property lead lists from public data — 7.1% median comp error in backtest | Shinnslist RE',
  description: 'Tax-delinquent, water-rights, and distress lists built from free official county data — scored, joined, and sold per-list with an ungated 10-row preview. Backtested: 7.1% median error, 71.5% band hit-rate.',
};

const productJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: reSkus['tax-delinquent-denver'].name,
  description: 'Every tax-delinquent parcel in Denver — owner, amount owed, equity, and distress depth — scored and joined to assessor records.',
  brand: { '@type': 'Brand', name: 'Shinnslist' },
  offers: {
    '@type': 'Offer',
    price: (reSkus['tax-delinquent-denver'].priceCents / 100).toFixed(2),
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
  },
};

export default function ReHubPage() {
  const sku = reSkus['tax-delinquent-denver'];
  return (
    <div className="grant-page learn-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <div className="grant-shell">
        <div className="learn-hero">
          <h1><strong>Scored property leads from free public data — 7.1% median comp error in backtest.</strong></h1>
          <p>
            Counties publish delinquencies, wells, violations, and deeds for free. We join the datasets nobody joins,
            score every parcel, and sell the lists per-county — one-time price, full CSV, no subscription.
            <strong> 10 real rows below, ungated.</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', margin: '26px 0' }}>
          <div style={{ flex: '1 1 200px', background: '#fff', border: '1px solid #e2ece6', borderRadius: 12, padding: '16px 18px' }}>
            <b style={{ fontSize: 24 }}>{sku.rows.toLocaleString()}</b>
            <div style={{ color: '#5b6b62', fontSize: 13 }}>delinquent parcels scored (Denver)</div>
          </div>
          <div style={{ flex: '1 1 200px', background: '#fff', border: '1px solid #e2ece6', borderRadius: 12, padding: '16px 18px' }}>
            <b style={{ fontSize: 24 }}>{waterStats.wellsZoneA.toLocaleString()}</b>
            <div style={{ color: '#5b6b62', fontSize: 13 }}>well permits flagged (CO DWR)</div>
          </div>
          <div style={{ flex: '1 1 200px', background: '#fff', border: '1px solid #e2ece6', borderRadius: 12, padding: '16px 18px' }}>
            <b style={{ fontSize: 24 }}>{compingStats.medianErrorPct}%</b>
            <div style={{ color: '#5b6b62', fontSize: 13 }}>median comp error ({compingStats.backtestSales.toLocaleString()} sales backtest)</div>
          </div>
        </div>

        <h2>Live preview — top 10 scored Denver tax-delinquent parcels</h2>
        <p style={{ color: '#5b6b62' }}>
          Direct from the Denver Treasurer&apos;s official delinquent list, joined to the Assessor&apos;s open data. No email, no paywall — this is the sample you judge us on.
        </p>
        <div style={{ overflowX: 'auto', border: '1px solid #e2ece6', borderRadius: 12, background: '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #d5e3da', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px' }}>Address</th>
                <th style={{ padding: '10px 12px' }}>Neighborhood</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Yrs delinq.</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total owed</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Assessed</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Equity</th>
              </tr>
            </thead>
            <tbody>
              {denverTaxDelinquentPreview.map((r) => (
                <tr key={r.addr} style={{ borderBottom: '1px solid #eef4f0' }}>
                  <td style={{ padding: '9px 12px', fontWeight: 600 }}>{r.addr}</td>
                  <td style={{ padding: '9px 12px', color: '#5b6b62' }}>{r.neighborhood}</td>
                  <td style={{ padding: '9px 12px', textAlign: 'right' }}>{r.yearsDelinquent}</td>
                  <td style={{ padding: '9px 12px', textAlign: 'right' }}>${r.totalOwed.toLocaleString()}</td>
                  <td style={{ padding: '9px 12px', textAlign: 'right' }}>${r.assessed.toLocaleString()}</td>
                  <td style={{ padding: '9px 12px', textAlign: 'right' }}>{r.equityPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', gap: 12, margin: '26px 0', flexWrap: 'wrap' }}>
          <Link href={`/re/${sku.slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0f5c3f', color: '#fff', padding: '13px 22px', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>
            Get the full {sku.rows.toLocaleString()}-row CSV — ${sku.priceCents / 100} <ArrowRight size={17} />
          </Link>
          <Link href="/re/how-we-score" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1.5px solid #0f5c3f', color: '#0f5c3f', padding: '13px 22px', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>
            How we score (methodology + guarantee)
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 16, marginTop: 34 }}>
          <div style={{ background: '#fff', border: '1px solid #e2ece6', borderRadius: 12, padding: 18 }}>
            <Database size={20} color="#0f5c3f" />
            <h3 style={{ margin: '10px 0 6px' }}>Official sources only</h3>
            <p style={{ color: '#5b6b62', fontSize: 14 }}>County treasurers, assessors, DWR, and recorders — every row traceable to a public record.</p>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2ece6', borderRadius: 12, padding: 18 }}>
            <Droplets size={20} color="#0f5c3f" />
            <h3 style={{ margin: '10px 0 6px' }}>Water-rights flags</h3>
            <p style={{ color: '#5b6b62', fontSize: 14 }}>{waterStats.activeWells.toLocaleString()} active well permits across {waterStats.counties.join(', ')} — the premium signal incumbents skip.</p>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2ece6', borderRadius: 12, padding: 18 }}>
            <LineChart size={20} color="#0f5c3f" />
            <h3 style={{ margin: '10px 0 6px' }}>Published accuracy</h3>
            <p style={{ color: '#5b6b62', fontSize: 14 }}>{compingStats.bandHitPct}% band hit-rate on {compingStats.backtestSales.toLocaleString()} real sales. Guarantee terms on the methodology page.</p>
          </div>
        </div>

        <p style={{ marginTop: 30, color: '#5b6b62', fontSize: 13 }}>
          Coming next: Jefferson County + Boulder County delinquent lists (official lists publish Sept/Oct 2026 — we ingest the day they drop),
          Chesterfield + Augusta VA parcel lists, and the public prediction ledger.
        </p>
      </div>
    </div>
  );
}
