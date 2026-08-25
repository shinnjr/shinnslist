import type { Metadata } from 'next';
import Link from 'next/link';
import { denverTaxDelinquentPreview, compingStats, waterStats, reSkus } from '@/data/realEstate';
import ListBuilder from './ListBuilder';

export const metadata: Metadata = {
  title: 'The data PropStream doesn’t sell — tax-delinquent + water-rights parcels, scored | Shinnslist',
  description: 'County treasurers publish delinquency lists free. DWR well permits are public. Nobody joins them per-parcel and scores them — so we do. Buy one county list for $29. 10 rows ungated below.',
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

// Anti-slop design system: flat, editorial, zero gradients/glow.
const ink = '#16181d';
const sub = '#5c6470';
const hair = '#e3e6ea';
const accent = '#0f5c3f';

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div style={{ padding: '2px 0' }}>
      <div style={{ fontSize: 30, fontWeight: 750, letterSpacing: '-0.02em', color: ink, lineHeight: 1.1 }}>{n}</div>
      <div style={{ fontSize: 12.5, color: sub, marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function ReHubPage() {
  const sku = reSkus['tax-delinquent-denver'];
  return (
    <div className="grant-page learn-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <div className="grant-shell" style={{ maxWidth: 880 }}>

        {/* Positioning line — the moat in one sentence */}
        <p style={{ fontSize: 13, fontWeight: 650, letterSpacing: '0.06em', textTransform: 'uppercase', color: accent, margin: '0 0 14px' }}>
          The datasets nobody joins
        </p>

        <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 780, letterSpacing: '-0.025em', lineHeight: 1.12, color: ink, margin: '0 0 16px' }}>
          Anyone can buy PropStream. Nobody can buy this.
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.55, color: sub, margin: '0 0 26px', maxWidth: 700 }}>
          County treasurers publish delinquency lists for free. State well permits are public. FEMA buyouts are a download.
          The big platforms skip them; the niche sellers charge $99–$749/mo for worse versions of one slice.
          We join all of it per-parcel, score what&apos;s actually actionable, and sell you one county for $29. Once.
        </p>

        {/* Proof strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 22, padding: '20px 0', borderTop: `1px solid ${hair}`, borderBottom: `1px solid ${hair}`, marginBottom: 34 }}>
          <Stat n={sku.rows.toLocaleString()} label="delinquent parcels scored (Denver)" />
          <Stat n={`${compingStats.medianErrorPct}%`} label={`median valuation error (${compingStats.backtestSales.toLocaleString()}-sale backtest)`} />
          <Stat n={waterStats.wellsZoneA.toLocaleString()} label="state well permits joined" />
          <Stat n="$29" label="one county. one time. full CSV." />
        </div>

        {/* The sample IS the pitch */}
        <h2 style={{ fontSize: 21, fontWeight: 720, letterSpacing: '-0.02em', color: ink, margin: '0 0 8px' }}>
          Judge the data, not the landing page.
        </h2>
        <p style={{ fontSize: 14.5, lineHeight: 1.5, color: sub, margin: '0 0 18px' }}>
          Top 10 scored Denver parcels, exactly as the CSV ships — from the Treasurer&apos;s official delinquent list,
          joined to Assessor records. No email wall. If this looks like your next deal flow, the other 8,363 rows are $29.
        </p>

        <div style={{ overflowX: 'auto', border: `1px solid ${hair}`, borderRadius: 10, background: '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${hair}`, textAlign: 'left', background: '#fafbfc' }}>
                <th style={{ padding: '10px 14px', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: sub }}>Address</th>
                <th style={{ padding: '10px 14px', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: sub }}>Area</th>
                <th style={{ padding: '10px 14px', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: sub, textAlign: 'right' }}>Yrs</th>
                <th style={{ padding: '10px 14px', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: sub, textAlign: 'right' }}>Owed</th>
                <th style={{ padding: '10px 14px', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: sub, textAlign: 'right' }}>Assessed</th>
                <th style={{ padding: '10px 14px', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: sub, textAlign: 'right' }}>Equity</th>
              </tr>
            </thead>
            <tbody>
              {denverTaxDelinquentPreview.map((r) => (
                <tr key={r.addr} style={{ borderBottom: `1px solid ${hair}` }}>
                  <td style={{ padding: '9px 14px', fontWeight: 600, color: ink }}>{r.addr}</td>
                  <td style={{ padding: '9px 14px', color: sub }}>{r.neighborhood}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', color: ink }}>{r.yearsDelinquent}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', color: ink }}>${r.totalOwed.toLocaleString()}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', color: sub }}>${r.assessed.toLocaleString()}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', color: ink }}>{r.equityPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CTA row */}
        <div style={{ display: 'flex', gap: 12, margin: '24px 0 8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link href={`/re/${sku.slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: accent, color: '#fff', padding: '13px 24px', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>
            Get the Denver list — ${sku.priceCents / 100}
          </Link>
          <Link href="/re/how-we-score" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: accent, padding: '13px 18px', borderRadius: 8, fontWeight: 650, textDecoration: 'none', fontSize: 14.5, border: `1px solid ${hair}` }}>
            Methodology &amp; accuracy guarantee →
          </Link>
          <span style={{ fontSize: 12.5, color: sub }}>One-time payment · CSV to your inbox · No account</span>
        </div>

        {/* Why this is hard to copy — the moat section */}
        <h2 style={{ marginTop: 40 }}>Build your list — pick the signals, see rows instantly</h2>
        <p style={{ color: '#5c6470', fontSize: 15, maxWidth: 720 }}>
          Check what you hunt for. The table filters live against real county data. New signal types appear here automatically as each dataset finishes ingest.
        </p>
        <ListBuilder />

        <h2 style={{ marginTop: 40 }}>Why nobody else sells this exact thing
        </h2>
        <p style={{ fontSize: 14.5, lineHeight: 1.55, color: sub, margin: '0 0 20px', maxWidth: 700 }}>
          Not because it&apos;s secret — because it&apos;s tedious. Every source below is public. The product is the joining:
          matching delinquent-owner lists to assessor parcels across inconsistent ID formats, then layering state water
          permits on top. Aggregators won&apos;t hand-clean three county formats; niche sellers only resell one source.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 0, borderTop: `1px solid ${hair}` }}>
          {[
            ['Denver Treasurer', 'Official pre-sale delinquent list (the same XLSX handed to lien buyers)', `${sku.rows.toLocaleString()} rows`],
            ['Denver Assessor open data', 'Owner names, mailing addresses, beds/baths, valuations', '212,664 parcels'],
            ['CO Division of Water Resources', 'Every well permit with owner, status, aquifer', `${waterStats.wellsZoneA.toLocaleString()} permits`],
            ['FEMA + MTBS', 'Flood-buyout properties and burn-scar parcels — motivated sellers', 'corridor flags live'],
          ].map(([src, what, n]) => (
            <div key={src} style={{ borderBottom: `1px solid ${hair}`, padding: '14px 2px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 2 }}>
              <div style={{ fontWeight: 650, color: ink, fontSize: 14.5 }}>{src}</div>
              <div style={{ fontSize: 12.5, color: accent, fontWeight: 650 }}>{n}</div>
              <div style={{ gridColumn: '1 / -1', fontSize: 13, color: sub }}>{what}</div>
            </div>
          ))}
        </div>

        {/* Roadmap as momentum, not vaporware */}
        <p style={{ marginTop: 30, color: sub, fontSize: 13.5, lineHeight: 1.6 }}>
          Next drops: Jefferson &amp; Boulder delinquent lists (official publications land Sept/Oct — we ingest the day they drop) ·
          Chesterfield County VA parcels · public prediction ledger with dated outcomes.
        </p>
      </div>
    </div>
  );
}
