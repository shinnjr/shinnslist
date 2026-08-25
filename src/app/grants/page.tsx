'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, ExternalLink, Filter, Search, ShieldAlert, SlidersHorizontal } from 'lucide-react';
import { DEMO_PROFILE_NOTE, GRANTS, type FitLevel, type GrantOpportunity } from '@/data/grants';
import { createBrowserClient } from '@/lib/supabase/client';
import { grantDfyItem } from '@/lib/dfy';
import DfyButton from '@/components/DfyButton';

const fitLabels: Record<FitLevel, string> = {
  strong: 'Strong fit',
  possible: 'Possible fit',
  blocked: 'Blocked',
};

export default function GrantsPage() {
  const [query, setQuery] = useState('');
  const [fit, setFit] = useState<'all' | FitLevel>('all');
  const [category, setCategory] = useState('all');
  const [grants, setGrants] = useState<GrantOpportunity[]>(GRANTS);
  const [personalized, setPersonalized] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const response = await fetch('/api/grants', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!response.ok) return;
      const body = await response.json();
      if (!Array.isArray(body.grants) || body.grants.length === 0) return;
      const mapped: GrantOpportunity[] = body.grants.map((item: any) => {
        const score = item.match?.score;
        const status = item.match?.status;
        const fitLevel: FitLevel = status === 'ineligible' ? 'blocked' : score >= 80 ? 'strong' : 'possible';
        let domain = 'Official source';
        try { domain = new URL(item.source_url).hostname.replace(/^www\./, ''); } catch { /* keep label */ }
        return {
          id: item.slug,
          name: item.name,
          funder: item.funder,
          amount: item.amount_label || 'See official source',
          deadlineLabel: item.rolling ? 'Rolling' : item.deadline ? new Date(`${item.deadline}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'See official source',
          deadline: item.deadline,
          status: item.rolling ? 'rolling' : item.status,
          category: item.category,
          summary: item.description || 'Verified opportunity from an official source.',
          eligibility: Array.isArray(item.eligibility_rules?.required_entity_types) ? `Applicant types: ${item.eligibility_rules.required_entity_types.join(', ')}` : 'Review the official eligibility rules.',
          requirements: Array.isArray(item.requirements) ? item.requirements : [],
          sourceUrl: item.source_url,
          sourceDomain: domain,
          verifiedAt: item.verified_at ? new Date(item.verified_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'recently',
          fee: item.fee_cents ? `$${(item.fee_cents / 100).toFixed(0)}` : '$0',
          effort: item.effort || 'Varies',
          matchScore: typeof score === 'number' ? `${score}%` : '—',
          fit: fitLevel,
          reasons: item.match?.reasons?.length ? item.match.reasons.slice(0, 3) : ['Official source verified'],
          blocker: item.match?.blockers?.[0] || null,
        };
      });
      setGrants(mapped);
      setPersonalized(Boolean(body.personalized));
    };
    void load();
  }, []);

  const categories = Array.from(new Set(grants.map((grant) => grant.category)));
  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return grants.filter((grant) => {
      const matchesQuery = !normalized || `${grant.name} ${grant.funder} ${grant.summary} ${grant.eligibility}`.toLowerCase().includes(normalized);
      const matchesFit = fit === 'all' || grant.fit === fit;
      const matchesCategory = category === 'all' || grant.category === category;
      return matchesQuery && matchesFit && matchesCategory;
    });
  }, [query, fit, category, grants]);

  return (
    <div className="grant-page">
      <div className="grant-shell">
        <div className="grant-page-head">
          <div>
            <h1>Verified grant matches</h1>
            <p>Official sources, explicit eligibility, honest blockers, and a direct path from match to application preview.</p>
          </div>
          <Link href="/onboarding" className="grant-button grant-button-dark"><SlidersHorizontal size={17} /> Improve my matches</Link>
        </div>

        <div className="matches-source-note"><BadgeCheck size={17} /><span>{personalized ? 'Personalized against your saved grant profile. Hard eligibility blockers are shown before drafting.' : DEMO_PROFILE_NOTE}</span></div>

        <div className="grant-filter-bar" aria-label="Grant filters">
          <label className="grant-search-field">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">Search grants</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search funder, program, or eligibility" />
          </label>
          <label>
            <span className="sr-only">Filter by fit</span>
            <Filter size={15} aria-hidden="true" />
            <select value={fit} onChange={(event) => setFit(event.target.value as 'all' | FitLevel)}>
              <option value="all">All match levels</option>
              <option value="strong">Strong fits</option>
              <option value="possible">Possible fits</option>
              <option value="blocked">Blocked</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Filter by category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">All categories</option>
              {categories.map((item) => <option value={item} key={item}>{item}</option>)}
            </select>
          </label>
        </div>

        <div className="match-count"><strong>{visible.length}</strong> verified opportunities shown</div>

        <div className="grant-match-list">
          {visible.map((grant) => (
            <article className="grant-match-row" key={grant.id}>
              <div className={`match-score match-score-${grant.fit}`} aria-label={`${grant.matchScore} estimated match score`}>
                <strong>{grant.matchScore}</strong><span>match</span>
              </div>
              <div className="match-identity">
                <span className={`grant-chip grant-chip-${grant.fit}`}>{fitLabels[grant.fit]}</span>
                <h2>{grant.name}</h2>
                <p className="match-funder">{grant.funder} · {grant.category}</p>
                <p>{grant.summary}</p>
                <div className="match-reasons">
                  {grant.reasons.map((reason) => <span key={reason}>{reason}</span>)}
                </div>
                {grant.blocker && <div className="match-blocker"><ShieldAlert size={16} /><span>{grant.blocker}</span></div>}
              </div>
              <div className="match-logistics">
                <div><span>AWARD</span><strong>{grant.amount}</strong></div>
                <div><span>DEADLINE</span><strong>{grant.deadlineLabel}</strong></div>
                <div><span>FEE / EFFORT</span><strong>{grant.fee} · {grant.effort}</strong></div>
              </div>
              <div className="match-actions">
                <a className="grant-button grant-button-dark" href={`/apply?id=${grant.id}`}>Preview application <ArrowRight size={16} /></a>
                <a href={grant.sourceUrl} target="_blank" rel="noreferrer">Official source <ExternalLink size={14} /></a>
                <DfyButton item={grantDfyItem(grant.id, grant.name, grant.effort, grant.amount)} />
                <small>Verified {grant.verifiedAt}</small>
              </div>
            </article>
          ))}
        </div>

        {visible.length === 0 && (
          <div className="grant-panel grant-empty"><Search size={28} /><h2>No grants match those filters</h2><p>Clear a filter or broaden the search. We never pad the queue with weak results.</p></div>
        )}
      </div>
    </div>
  );
}
