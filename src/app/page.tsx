import type { Metadata } from 'next';
import Link from 'next/link';
import ListBuilder from './re/ListBuilder';
import { denverTaxDelinquentPreview, compingStats, dataWall } from '@/data/realEstate';
import { avenues } from '@/data/avenues';

export const metadata: Metadata = {
  title: 'Shinnslist — 750K+ parcels joined from official public records',
  description:
    '12 official datasets joined per-parcel: treasurer delinquency rolls, water rights, septic permits, FEMA buyouts, burn scars, STR licenses, mineral rights — scored and previewable free. The join is the product.',
};

export default function Home() {
  const live = avenues.filter((a) => a.status === 'live');
  const soon = avenues.filter((a) => a.status !== 'live');
  const totalRows = '750K+';

  return (
    <div className="grant-page">
      {/* HERO */}
      <section style={{ borderBottom: '1px solid #1c2530', padding: '64px 0 48px' }}>
        <div className="grant-shell">
          <p style={{ fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', color: '#7d8b99', margin: 0 }}>
            Shinnslist · property intelligence
          </p>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', lineHeight: 1.06, margin: '14px 0 18px', fontWeight: 800 }}>
            Anyone can buy PropStream.<br />
            <span style={{ color: '#4ade80' }}>Nobody can buy this.</span>
          </h1>
          <p style={{ fontSize: 17, maxWidth: 760, color: '#c9d4de', lineHeight: 1.6 }}>
            Twelve official datasets — {totalRows} parcels across Colorado&apos;s Front Range corridor —
            joined at the parcel level and scored. Treasurer rolls, DWR water permits, FEMA buyouts,
            wildfire perimeters, STR licenses, severed minerals. Free data; nobody does the work.
            <strong style={{ color: '#fff' }}> We did.</strong> Every number below is real and every
            source is linked.
          </p>
          <div style={{ display: 'flex', gap: 14, marginTop: 24, flexWrap: 'wrap' }}>
            <Link href="#wall" style={{ background: '#4ade80', color: '#0b0f14', fontWeight: 700, padding: '13px 26px', borderRadius: 8, textDecoration: 'none' }}>
              See every dataset ↓
            </Link>
            <Link href="#build" style={{ border: '1px solid #2a3644', color: '#d7e0ea', padding: '13px 26px', borderRadius: 8, textDecoration: 'none' }}>
              Build a list free
            </Link>
          </div>
        </div>
      </section>

      {/* THE DATA WALL */}
      <section id="wall" className="grant-shell" style={{ padding: '52px 0', borderBottom: '1px solid #1c2530' }}>
        <h2 style={{ fontSize: 26, marginBottom: 6 }}>The data wall</h2>
        <p style={{ color: '#7d8b99', marginBottom: 20 }}>
          Every dataset we ingest, with live row counts and the official source it came from.
          Click any source to verify it yourself — that&apos;s the point.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 720 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #2a3644' }}>
                {['Dataset', 'Rows', 'Coverage', 'Official source', 'Refresh'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#7d8b99', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataWall.map((d) => (
                <tr key={d.name} style={{ borderBottom: '1px solid #1c2530' }}>
                  <td style={{ padding: '11px 12px', fontWeight: 600 }}>{d.name}</td>
                  <td style={{ padding: '11px 12px', color: '#4ade80', fontWeight: 700, whiteSpace: 'nowrap' }}>{d.rows}</td>
                  <td style={{ padding: '11px 12px', color: '#c9d4de' }}>{d.counties}</td>
                  <td style={{ padding: '11px 12px', color: '#7d8b99' }}>{d.source}</td>
                  <td style={{ padding: '11px 12px', color: '#7d8b99', whiteSpace: 'nowrap' }}>{d.fresh}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SAMPLE */}
      <section className="grant-shell" style={{ padding: '48px 0', borderBottom: '1px solid #1c2530' }}>
        <h2 style={{ fontSize: 26, marginBottom: 6 }}>Real rows from the top of today&apos;s Denver list</h2>
        <p style={{ color: '#7d8b99', marginBottom: 18 }}>
          Not mockups. Today&apos;s scored output, highest contract-signing likelihood first.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #2a3644' }}>
                {['Score', 'Owner', 'Property', 'Years behind', 'Total owed'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '9px 10px', color: '#7d8b99', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {denverTaxDelinquentPreview.slice(0, 5).map((r) => (
                <tr key={r.parcel} style={{ borderBottom: '1px solid #1c2530' }}>
                  <td style={{ padding: '9px 10px', fontWeight: 700, color: '#4ade80' }}>{r.score}</td>
                  <td style={{ padding: '9px 10px' }}>{r.owner}</td>
                  <td style={{ padding: '9px 10px', color: '#c9d4de' }}>{r.addr}</td>
                  <td style={{ padding: '9px 10px' }}>{r.yearsDelinquent}</td>
                  <td style={{ padding: '9px 10px' }}>${r.totalOwed.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: 10, fontSize: 13, color: '#7d8b99' }}>
          Full list: <Link href="/re/tax-delinquent" style={{ color: '#4ade80' }}>8,373 rows</Link>. Comp engine accuracy:{' '}
          <strong style={{ color: '#fff' }}>{compingStats.medianErrorPct}% median error</strong> on{' '}
          {compingStats.backtestSales.toLocaleString()} real sales.
        </p>
      </section>

      {/* BUILDER */}
      <section id="build" className="grant-shell" style={{ padding: '48px 0', borderBottom: '1px solid #1c2530' }}>
        <h2 style={{ fontSize: 26, marginBottom: 6 }}>Build your list now — no signup</h2>
        <ListBuilder />
      </section>

      {/* AVENUES */}
      <section className="grant-shell" style={{ padding: '48px 0 72px' }}>
        <h2 style={{ fontSize: 26, marginBottom: 6 }}>Every signal, its own page</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 10, marginTop: 16 }}>
          {[...live, ...soon].map((a) => (
            <Link key={a.slug} href={`/re/${a.slug}`}
              style={{ border: '1px solid #1c2530', borderRadius: 10, padding: '13px 15px', textDecoration: 'none', color: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <span>{a.h1}</span>
              <span style={{ fontSize: 11, whiteSpace: 'nowrap', color: a.status === 'live' ? '#4ade80' : '#eab308', border: `1px solid ${a.status === 'live' ? '#14532d' : '#713f12'}`, borderRadius: 999, padding: '2px 9px' }}>
                {a.status === 'live' ? 'LIVE' : 'SOON'}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
