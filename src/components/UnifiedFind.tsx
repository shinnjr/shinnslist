'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Scale, PiggyBank, Search } from 'lucide-react';
import { classActions } from '@/data/classActions';

type Grant = {
  id: string;
  slug: string;
  name: string;
  funder: string;
  category: string;
  amount: string;
  summary: string;
  sourceUrl: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  small_business: 'Small business',
  education: 'Education',
  housing: 'Housing',
  veterans: 'Veterans',
  disability: 'Disability',
  seniors: 'Seniors',
  nonprofit: 'Nonprofit',
  community: 'Community',
  health: 'Health',
  emergency_relief: 'Emergency relief',
  agriculture: 'Agriculture',
  vocational_training: 'Job training',
  arts_culture: 'Arts & culture',
  science_research: 'Research',
  technology: 'Technology',
  transportation: 'Transportation',
  sports_athletics: 'Sports',
  religious_faith: 'Faith-based',
  environment: 'Environment',
  international: 'International',
};

const EXAMPLE_SEARCHES = ['veteran', 'small business', 'single mom', 'data breach', 'student', 'housing'];

export default function UnifiedFind() {
  const [query, setQuery] = useState('');
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/grants');
        if (!response.ok) return;
        const body = await response.json();
        const list = Array.isArray(body.grants) ? body.grants : [];
        setGrants(
          list.map((item: Record<string, unknown>) => ({
            id: String(item.id ?? ''),
            slug: String(item.slug ?? ''),
            name: String(item.name ?? ''),
            funder: String(item.funder ?? ''),
            category: String(item.category ?? ''),
            amount: String(item.amount_label ?? item.amount ?? 'See source'),
            summary: String(item.summary ?? item.description ?? ''),
            sourceUrl: String(item.source_url ?? ''),
          })),
        );
      } catch {
        /* keep empty */
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const q = query.trim().toLowerCase();

  const matchedGrants = useMemo(() => {
    if (!q) return [];
    return grants.filter((g) => `${g.name} ${g.funder} ${g.category} ${g.summary}`.toLowerCase().includes(q));
  }, [q, grants]);

  const matchedClassActions = useMemo(() => {
    if (!q) return [];
    return classActions.filter((c) => `${c.name} ${c.description}`.toLowerCase().includes(q));
  }, [q]);

  const total = matchedGrants.length + matchedClassActions.length;

  return (
    <div className="grant-shell">
      <div className="learn-hero">
        <h1>Find everything you qualify for</h1>
        <p>One search across grants, benefits, and open class-action settlements. Free, honest, and sourced from the official holders of the money.</p>
      </div>

      <div className="grant-filter-bar" aria-label="Unified search">
        <label className="grant-search-field">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Search grants, benefits, and settlements</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try “veteran,” “single mom,” “data breach,” “small business”…"
            autoFocus
          />
        </label>
      </div>

      {!q && (
        <div className="learn-card" style={{ marginTop: 20 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>What are you looking for?</h2>
          <p style={{ margin: '4px 0 14px' }}>Pick an example, or type your situation — your state, your business, who you are.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {EXAMPLE_SEARCHES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setQuery(s)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 999,
                  border: '1px solid #dfe3e8',
                  background: '#fff',
                  color: '#0b3d29',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <p style={{ margin: '14px 0 0', fontSize: 13, color: '#55665c' }}>
            {grants.length > 0 ? `${grants.length.toLocaleString()} grants & benefits` : ''}{grants.length > 0 && ' and '}{classActions.length} open class-action settlements are searchable here — updated daily.
          </p>
        </div>
      )}

      {q && (
        <div className="match-count">
          <strong>{total}</strong> match{total === 1 ? '' : 'es'} across grants, benefits &amp; settlements
        </div>
      )}

      {matchedGrants.length > 0 && (
        <section>
          <h2 style={{ fontSize: 20, margin: '20px 0 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <PiggyBank size={18} color="#087a55" /> Grants &amp; benefits ({matchedGrants.length})
          </h2>
          <div className="grant-match-list">
            {matchedGrants.slice(0, 20).map((g) => (
              <article className="grant-match-row" key={g.slug}>
                <div className="match-identity">
                  <h2>{g.name}</h2>
                  <p className="match-funder">{g.funder}{g.category ? ` · ${CATEGORY_LABELS[g.category] || g.category}` : ''}</p>
                  <p>{g.summary}</p>
                </div>
                <div className="match-logistics">
                  <div><span>Award</span><strong>{g.amount}</strong></div>
                </div>
                <div className="match-actions">
                  <a className="grant-button grant-button-dark" href={`/apply?id=${g.id}`}>Preview <ArrowRight size={16} /></a>
                  {g.sourceUrl ? <a href={g.sourceUrl} target="_blank" rel="noreferrer">Source</a> : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {matchedClassActions.length > 0 && (
        <section>
          <h2 style={{ fontSize: 20, margin: '24px 0 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Scale size={18} color="#087a55" /> Class-action settlements ({matchedClassActions.length})
          </h2>
          <div className="grant-match-list">
            {matchedClassActions.slice(0, 20).map((c) => (
              <article className="grant-match-row" key={c.slug}>
                <div className="match-identity">
                  <h2>{c.name}</h2>
                  <p className="match-funder">Payout: {c.payout} · Deadline: {c.deadline}</p>
                  <p>{c.description}</p>
                </div>
                <div className="match-logistics">
                  <div><span>Payout</span><strong>{c.payout}</strong></div>
                </div>
                <div className="match-actions">
                  <a className="grant-button grant-button-dark" href={c.claim_url} target="_blank" rel="noreferrer">File claim <ArrowRight size={16} /></a>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {q && total === 0 && !loading && (
        <div className="grant-panel grant-empty">
          <Search size={28} />
          <h2>No matches for &ldquo;{query}&rdquo;</h2>
          <p>Try a broader term — a category, a company name, or your situation.</p>
        </div>
      )}

      {q && loading && <p style={{ padding: 16, color: '#586477' }}>Loading grants…</p>}
    </div>
  );
}
