import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { avenues, getAvenue } from '@/data/avenues';
import { denverTaxDelinquentPreview } from '@/data/realEstate';

export const dynamicParams = false;

export function generateStaticParams() {
  return avenues.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = getAvenue(slug);
  if (!a) return {};
  return { title: a.title, description: a.description };
}

export default async function AvenuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = getAvenue(slug);
  if (!a) notFound();
  const live = a.status === 'live';

  return (
    <div className="grant-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Dataset',
          name: a.title,
          description: a.description,
          url: `https://shinnslist.com/re/${a.slug}`,
          creator: { '@type': 'Organization', name: 'Shinnslist', url: 'https://shinnslist.com' },
          isAccessibleForFree: true,
          keywords: a.coverage,
        })}}
      />
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '40px 20px 90px' }}>
        <p style={{ fontSize: 13, marginBottom: 18 }}>
          <Link href="/re" style={{ color: '#7d8590' }}>← All property data</Link>
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
            padding: '4px 10px', borderRadius: 4,
            background: live ? '#16181d' : '#f2c94c22',
            color: live ? '#fff' : '#8a6d00',
            border: live ? 'none' : '1px solid #e3c551',
          }}>
            {live ? 'Live — buy today' : 'Ingesting — free preview soon'}
          </span>
          {a.stats.slice(0, 2).map((s) => (
            <span key={s.label} style={{ fontSize: 12.5, color: '#5c6470' }}>{s.value} {s.label}</span>
          ))}
        </div>

        <h1 style={{ fontSize: 'clamp(26px, 4vw, 38px)', lineHeight: 1.15, margin: '16px 0 14px', maxWidth: 760 }}>{a.h1}</h1>
        <p style={{ fontSize: 17, color: '#3a4149', maxWidth: 720, lineHeight: 1.55 }}>{a.intro}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 0, margin: '30px 0', borderTop: '2px solid #16181d', borderBottom: '1px solid #e2e5ea' }}>
          {a.stats.map((s) => (
            <div key={s.label} style={{ padding: '16px 14px', borderRight: '1px solid #eceef1' }}>
              <b style={{ display: 'block', fontSize: 22, fontVariantNumeric: 'tabular-nums' }}>{s.value}</b>
              <span style={{ fontSize: 12, color: '#7d8590', textTransform: 'uppercase', letterSpacing: '.04em' }}>{s.label}</span>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 21, marginTop: 34 }}>Why nobody else sells this</h2>
        <p style={{ fontSize: 15, color: '#3a4149', lineHeight: 1.6, maxWidth: 720 }}>{a.whyNobodySells}</p>

        <h2 style={{ fontSize: 21, marginTop: 34 }}>Sources</h2>
        <ul style={{ listStyle: 'none', padding: 0, lineHeight: 2, fontSize: 14.5 }}>
          {a.sources.map((s) => (
            <li key={s.url} style={{ borderBottom: '1px solid #eceef1', padding: '8px 0' }}>
              <a href={s.url} rel="noopener noreferrer" target={s.url.startsWith('http') ? '_blank' : undefined}
                 style={{ color: '#16181d', textDecoration: 'underline', textUnderlineOffset: 3 }}>{s.label}</a>
            </li>
          ))}
        </ul>
        <p style={{ fontSize: 13, color: '#7d8590', marginTop: 6 }}>Coverage: {a.coverage}</p>

        {live ? (
          <>
            <h2 style={{ fontSize: 21, marginTop: 34 }}>Preview — first 10 rows, no email</h2>
            <div style={{ overflowX: 'auto', border: '1px solid #e2e5ea', borderRadius: 4, marginTop: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 700 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #16181d' }}>
                    {['Score', 'Owner', 'Property', 'Neighborhood', 'Total owed', 'Equity', 'Yrs'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '9px 11px', color: '#5c6470', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {denverTaxDelinquentPreview.map((r) => (
                    <tr key={r.parcel} style={{ borderBottom: '1px solid #eceef1' }}>
                      <td style={{ padding: '9px 11px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{r.score}</td>
                      <td style={{ padding: '9px 11px', maxWidth: 180 }}>{r.owner}</td>
                      <td style={{ padding: '9px 11px' }}>{r.addr}</td>
                      <td style={{ padding: '9px 11px', color: '#7d8590' }}>{r.hood}</td>
                      <td style={{ padding: '9px 11px' }}>${r.totalOwed.toLocaleString()}</td>
                      <td style={{ padding: '9px 11px' }}>{Math.round(r.equityRatio * 100)}%</td>
                      <td style={{ padding: '9px 11px' }}>{r.yearsDelinquent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 24, border: '1px solid #16181d', borderRadius: 6, padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <b style={{ fontSize: 19 }}>$29 once</b>
                <div style={{ fontSize: 13, color: '#5c6470' }}>All rows · instant email · no account</div>
              </div>
              <Link href="/re/tax-delinquent-denver" style={{ background: '#16181d', color: '#fff', padding: '12px 24px', borderRadius: 6, fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>
                Get the full CSV →
              </Link>
            </div>
          </>
        ) : (
          <div style={{ marginTop: 30, borderLeft: '3px solid #b98a00', background: '#fafaf7', padding: '18px 20px', borderRadius: 4 }}>
            <b>This dataset is mid-ingest.</b> The corridor pulls above are real and already running on our pipeline.
            Full per-parcel lists go on sale automatically when the join completes — check back or watch the{' '}
            <Link href="/re" style={{ color: '#16181d', textDecoration: 'underline' }}>build-your-list picker</Link>, which updates itself as each signal goes live.
          </div>
        )}

        <h2 style={{ fontSize: 21, marginTop: 44 }}>Every avenue we build</h2>
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 12 }}>
          {avenues.filter((x) => x.slug !== a.slug).map((x) => (
            <li key={x.slug} style={{ borderTop: '1px solid #eceef1' }}>
              <Link href={`/re/${x.slug}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 0', textDecoration: 'none', color: '#16181d', flexWrap: 'wrap' }}>
                <b style={{ fontSize: 14.5, textDecoration: x.status === 'live' ? 'underline' : 'none', textUnderlineOffset: 3 }}>{x.h1.split('—')[0].trim()}</b>
                <span style={{ fontSize: 12.5, color: x.status === 'live' ? '#0f766e' : '#b98a00', whiteSpace: 'nowrap' }}>
                  {x.status === 'live' ? 'LIVE' : 'INGESTING'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
