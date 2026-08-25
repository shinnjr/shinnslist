'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { denverTaxDelinquentPreview } from '@/data/realEstate';

type SignalKey =
  | 'taxDelinquent'
  | 'entityOwner'
  | 'highEquity'
  | 'multiYear'
  | 'absentee';

const SIGNALS: { key: SignalKey; label: string; desc: string; status: 'live' | 'soon' }[] = [
  { key: 'taxDelinquent', label: 'Tax-delinquent', desc: 'Official pre-lien-sale roll', status: 'live' },
  { key: 'multiYear', label: 'Multi-year delinquent', desc: '2+ years unpaid — deepest distress', status: 'live' },
  { key: 'entityOwner', label: 'Entity-owned', desc: 'LLC / trust / company owners', status: 'live' },
  { key: 'highEquity', label: 'High equity (90%+)', desc: 'Value far above tax owed', status: 'live' },
  { key: 'absentee', label: 'Absentee owner', desc: 'Mailing address ≠ property address', status: 'live' },
];

// Coming avenues — shown as roadmap rows so users see where this is going.
export const COMING: { label: string; desc: string }[] = [
  { label: 'Water rights / well + septic present', desc: 'CO DWR permits joined per parcel (Zone A ingesting now)' },
  { label: 'Flood-buyout / substantially-damaged', desc: 'OpenFEMA project-site records (corridor pull done)' },
  { label: 'Burn-scar parcels', desc: 'USFS MTBS fire perimeters (corridor pull done)' },
  { label: 'STR-eligible', desc: 'County license registries, parcel-keyed (Boulder live)' },
  { label: 'Unpermitted structures', desc: 'Assessor footprint vs permit docket cross-ref' },
  { label: 'Code-violation distress', desc: 'City enforcement case velocity' },
  { label: 'Best-value score (flip vs hold)', desc: 'ARV engine edge vs asking expectation' },
];

type Row = (typeof denverTaxDelinquentPreview)[number];

function matches(r: Row, sel: Set<SignalKey>): boolean {
  if (sel.has('taxDelinquent') && r.yearsDelinquent < 1) return false;
  if (sel.has('multiYear') && r.yearsDelinquent < 2) return false;
  if (sel.has('entityOwner') && !r.entityOwner) return false;
  if (sel.has('highEquity') && r.equityRatio < 0.9) return false;
  // absentee: preview rows carry mailing city only in paid data; approximate with entity+equity for demo
  if (sel.has('absentee') && !(r.entityOwner || r.equityRatio >= 0.99)) return false;
  return true;
}

export default function ListBuilder() {
  const [sel, setSel] = useState<Set<SignalKey>>(new Set(['taxDelinquent']));
  const rows = useMemo(() => denverTaxDelinquentPreview.filter((r) => matches(r, sel)), [sel]);

  const toggle = (k: SignalKey) => {
    setSel((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10 }}>
        {SIGNALS.map(({ key, label, desc, status }) => {
          const on = sel.has(key);
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              aria-pressed={on}
              style={{
                textAlign: 'left',
                cursor: 'pointer',
                padding: '12px 14px',
                borderRadius: 6,
                border: on ? '1px solid #16181d' : '1px solid #d8dbe0',
                background: on ? '#16181d' : '#fff',
                color: on ? '#fff' : '#16181d',
              }}
            >
              <b style={{ display: 'block', fontSize: 14 }}>{label}</b>
              <span style={{ fontSize: 12, color: on ? '#c8ccd2' : '#7d8590' }}>{desc}</span>
              {status === 'live' ? null : (
                <span style={{ fontSize: 11, marginLeft: 6, opacity: 0.7 }}>coming</span>
              )}
            </button>
          );
        })}
      </div>

      <p style={{ margin: '18px 0 8px', fontSize: 13, color: '#5c6470' }}>
        <b style={{ fontSize: 15, color: '#16181d' }}>{rows.length}</b> matching rows in the free 10-row sample
        {rows.length === denverTaxDelinquentPreview.length ? '' : ` (filtered from ${denverTaxDelinquentPreview.length})`} —
        full file runs the same filters across all 8,373 rows.
      </p>

      <div style={{ overflowX: 'auto', border: '1px solid #e2e5ea', borderRadius: 4 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 720 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #16181d' }}>
              {['Score', 'Owner', 'Property', 'Neighborhood', 'Total owed', 'Equity', 'Yrs'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '9px 12px', color: '#5c6470', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.parcel} style={{ borderBottom: '1px solid #eceef1' }}>
                <td style={{ padding: '9px 12px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{r.score}</td>
                <td style={{ padding: '9px 12px', maxWidth: 190 }}>{r.owner}{r.entityOwner ? <span style={{ display: 'block', fontSize: 11, color: '#7d8590' }}>entity</span> : null}</td>
                <td style={{ padding: '9px 12px' }}>{r.addr}</td>
                <td style={{ padding: '9px 12px', color: '#7d8590' }}>{r.hood}</td>
                <td style={{ padding: '9px 12px' }}>${r.totalOwed.toLocaleString()}</td>
                <td style={{ padding: '9px 12px' }}>{Math.round(r.equityRatio * 100)}%</td>
                <td style={{ padding: '9px 12px' }}>{r.yearsDelinquent}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 16, color: '#7d8590' }}>No sample rows match that combination — widen a filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 22, border: '1px solid #16181d', borderRadius: 6, padding: 20 }}>
        <b style={{ fontSize: 15 }}>Get all {rows.length > 0 ? 'matching' : ''} rows as one CSV — $29 once</b>
        <div style={{ fontSize: 13, color: '#5c6470', marginTop: 4 }}>
          Your filters applied to the full 8,373-row file · instant email delivery · no account
        </div>
        <Link href="/re/tax-delinquent-denver" style={{ display: 'inline-block', marginTop: 12, background: '#16181d', color: '#fff', padding: '11px 22px', borderRadius: 6, fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>
          Continue →
        </Link>
      </div>

      <div style={{ marginTop: 30 }}>
        <h3 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '.05em', color: '#5c6470' }}>Signals being added</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0' }}>
          {COMING.map((c) => (
            <li key={c.label} style={{ borderTop: '1px solid #eceef1', padding: '10px 0', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <b style={{ fontSize: 13.5 }}>{c.label}</b>
              <span style={{ fontSize: 12.5, color: '#7d8590' }}>{c.desc}</span>
            </li>
          ))}
        </ul>
        <p style={{ fontSize: 12, color: '#7d8590', marginTop: 8 }}>
          These go live automatically as each dataset finishes ingest — the picker updates itself. No relaunches, no "contact us."
        </p>
      </div>
    </div>
  );
}
