import type { Metadata } from 'next';
import Link from 'next/link';
import ListBuilder from './re/ListBuilder';
import { denverTaxDelinquentPreview, denverTaxDelinquent, compingStats, waterStats, zoneAStats } from '@/data/realEstate';
import { avenues } from '@/data/avenues';

export const metadata: Metadata = {
  title: 'Shinnslist — scored property lead lists from free public data',
  description:
    'Anyone can buy PropStream. Nobody can buy this. County treasurers publish delinquent-tax lists free; DWR well permits are public; FEMA buyouts are open data. We join them per-parcel and score what matters. Preview 10 rows ungated.',
};

export default function Home() {
  const live = avenues.filter((a) => a.status === 'live');
  const soon = avenues.filter((a) => a.status !== 'live');
  return (
    <div className="grant-page">
      {/* HERO */}
      <section style={{ borderBottom: '1px solid #1c2530', padding: '72px 0 56px' }}>
        <div className="grant-shell">
          <p style={{ fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', color: '#7d8b99', margin: 0 }}>
            Shinnslist · property intelligence
          </p>
          <h1 style={{ fontSize: 'clamp(34px, 5vw, 58px)', lineHeight: 1.05, margin: '16px 0 20px', fontWeight: 800 }}>
            Anyone can buy PropStream.<br />
            <span style={{ color: '#4ade80' }}>Nobody can buy this.</span>
          </h1>
          <p style={{ fontSize: 18, maxWidth: 720, color: '#c9d4de', lineHeight: 1.6 }}>
            The lists big platforms don&apos;t sell and niche sites overcharge for — built from
            official public records nobody bothers to join. County treasurers publish delinquency
            rolls free. Water rights are public. FEMA buyouts are open data. We do the joining,
            score every parcel, and show our work.
          </p>
          <div style={{ display: 'flex', gap: 14, marginTop: 28, flexWrap: 'wrap' }}>
            <Link href="/re" style={{ background: '#4ade80', color: '#0b0f14', fontWeight: 700, padding: '13px 26px', borderRadius: 8, textDecoration: 'none' }}>
              Browse the data →
            </Link>
          </div>
        </div>
      </section>

      {/* PROOF STRIP */}
      <section className="grant-shell" style={{ padding: '40px 0', borderBottom: '1px solid #1c2530' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 18 }}>
          {[
            [zoneAStats.parcels.toLocaleString(), 'corridor parcels'],
            [denverTaxDelinquent.total.toLocaleString(), 'Denver delinquent rows'],
            [waterStats.wellsZoneA.toLocaleString(), 'well permits'],
            [`${compingStats.medianErrorPct}%`, 'median comp error'],
          ].map(([n, l]) => (
            <div key={l}>
              <b style={{ fontSize: 30, color: '#fff' }}>{n}</b>
              <div style={{ color: '#7d8b99', fontSize: 13 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* AVENUES */}
      <section className="grant-shell" style={{ padding: '48px 0' }}>
        <h2 style={{ fontSize: 24, marginBottom: 6 }}>Every signal we ingest</h2>
        <p style={{ color: '#7d8b99', marginBottom: 22 }}>
          Live now and in-pipeline. Each becomes a clickable filter in the builder below as its dataset lands.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
          {[...live, ...soon].map((a) => (
            <Link key={a.slug} href={`/re/${a.slug}`}
              style={{ border: '1px solid #1c2530', borderRadius: 10, padding: '14px 16px', textDecoration: 'none', color: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <span>{a.h1}</span>
              <span style={{ fontSize: 11, whiteSpace: 'nowrap', color: a.status === 'live' ? '#4ade80' : '#eab308', border: `1px solid ${a.status === 'live' ? '#14532d' : '#713f12'}`, borderRadius: 999, padding: '2px 9px' }}>
                {a.status === 'live' ? 'LIVE' : 'SOON'}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* BUILDER */}
      <section className="grant-shell" id="build" style={{ padding: '32px 0 64px', borderTop: '1px solid #1c2530' }}>
        <h2 style={{ fontSize: 24 }}>Build your list — pick the signals, see rows instantly.</h2>
        <ListBuilder />
      </section>

      
    </div>
  );
}
