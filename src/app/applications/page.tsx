'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock3, FileCheck2, FilePenLine, LockKeyhole, UserRound } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';

type GrantSummary = {
  name: string;
  slug: string;
  funder: string;
  amount_label: string;
  deadline_label: string;
  status: string;
  source_url: string;
  verified_at: string;
};

type ApplicationRecord = {
  id: string;
  status: string;
  match_score: number | null;
  updated_at: string;
  grant: GrantSummary | null;
};

type PreviewApplication = {
  stage: string;
  title: string;
  detail: string;
  action: string;
  href: string;
  progress: number;
  icon: typeof FileCheck2;
};

const previewPipeline: PreviewApplication[] = [
  { stage: 'MATCHED', title: 'Denver Foundation — Capacity Building', detail: '$500–$6,000 · verified source', action: 'Preview application', href: '/apply?id=tdf-capacity-building-2026', progress: 25, icon: FileCheck2 },
  { stage: 'DRAFTING', title: 'Breva Thrive Grant', detail: '$5,000 · 2 profile facts needed', action: 'Finish profile', href: '/onboarding', progress: 45, icon: FilePenLine },
  { stage: 'WATCHING', title: 'Lenovo Evolve Small AI', detail: '$25,000 + technology package', action: 'View match', href: '/apply?id=lenovo-evolve-small-2026', progress: 15, icon: Clock3 },
];

const statusLabel: Record<string, string> = {
  matched: 'MATCHED',
  needs_info: 'NEEDS INFO',
  blocked: 'BLOCKED',
  drafting: 'DRAFTING',
  draft_ready: 'DRAFT READY',
  approved: 'INSPECTION QUEUED',
  submitting: 'INSPECTING',
  submitted: 'SUBMITTED',
  failed: 'NEEDS REVIEW',
  withdrawn: 'WITHDRAWN',
};

const statusProgress: Record<string, number> = {
  matched: 20,
  blocked: 0,
  drafting: 45,
  needs_info: 55,
  draft_ready: 75,
  approved: 82,
  submitting: 90,
  submitted: 100,
  failed: 55,
  withdrawn: 0,
};

export default function ApplicationsPage() {
  const [hasProfile, setHasProfile] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    setHasProfile(Boolean(localStorage.getItem('shinnslist_grant_profile')));
    const supabase = createBrowserClient();
    void supabase.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token;
      setSignedIn(Boolean(token));
      if (token) {
        const response = await fetch('/api/grant-applications', { headers: { Authorization: `Bearer ${token}` } });
        if (response.ok) {
          const body = await response.json();
          setApplications(body.applications || []);
        }
      }
      setLoading(false);
    });
  }, []);

  const approveInspection = async (applicationId: string) => {
    setApprovingId(applicationId);
    setActionError('');
    try {
      const supabase = createBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Your session expired. Sign in again.');
      const response = await fetch(`/api/grant-applications/${applicationId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Could not queue the inspection.');
      setApplications((current) => current.map((item) => item.id === applicationId ? { ...item, status: body.application?.status || 'approved' } : item));
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Could not queue the inspection.');
    } finally {
      setApprovingId(null);
    }
  };

  const realQueue = signedIn && applications.length > 0;
  const metricItems = realQueue ? [
    { value: applications.length, label: 'Applications' },
    { value: applications.filter((item) => ['draft_ready', 'approved'].includes(item.status)).length, label: 'Ready / queued' },
    { value: applications.filter((item) => item.status === 'needs_info').length, label: 'Need your input' },
    { value: applications.filter((item) => item.status === 'submitted').length, label: 'Confirmed submitted' },
  ] : [
    { value: 3, label: 'Example applications' },
    { value: 1, label: 'Ready to preview' },
    { value: 1, label: 'Needs profile facts' },
    { value: 0, label: 'Submitted without approval' },
  ];

  return (
    <div className="grant-page">
      <div className="grant-shell applications-shell">
        <div className="grant-page-head">
          <div>
            <span className="grant-chip grant-chip-possible">Application control</span>
            <h1>Your grant queue.</h1>
            <p>One place to see what is matched, drafted, waiting on you, inspected, and confirmed submitted.</p>
          </div>
          <Link href="/grants" className="grant-button grant-button-primary">Find grants <ArrowRight size={17} /></Link>
        </div>

        {!hasProfile && (
          <div className="profile-required-strip">
            <UserRound size={21} />
            <div><strong>Your profile is the autopilot.</strong><span>Complete it once so eligibility and answers can be reused safely.</span></div>
            <Link href="/onboarding">Build profile <ArrowRight size={15} /></Link>
          </div>
        )}

        {!signedIn && <div className="preview-mode-strip"><LockKeyhole size={20} /><div><strong>Preview mode</strong><span>Build a profile and create an account to save real applications.</span></div><Link href="/signup">Create account <ArrowRight size={15} /></Link></div>}
        {signedIn && !loading && !realQueue && <div className="preview-mode-strip"><FileCheck2 size={20} /><div><strong>Queue empty</strong><span>Preview a verified grant, then save its draft here.</span></div><Link href="/grants">See matches <ArrowRight size={15} /></Link></div>}

        <div className="queue-metrics" aria-label="Application queue summary">
          {metricItems.map((item) => <div key={item.label}><strong>{item.value}</strong><span>{item.label}</span></div>)}
        </div>

        <div className="application-board">
          <div className="application-board-head"><span>Application</span><span>Progress</span><span>Next controlled action</span></div>
          {loading ? <div className="grant-empty">Loading your application queue…</div> : realQueue ? applications.map((application) => {
            const grant = application.grant;
            const progress = statusProgress[application.status] ?? 15;
            return (
              <article className="application-row" key={application.id}>
                <div className="application-identity">
                  <span className={`application-status ${application.status === 'draft_ready' ? 'is-ready' : application.status === 'needs_info' ? 'is-writing' : 'is-watching'}`}><FileCheck2 size={14} />{statusLabel[application.status] || application.status.toUpperCase()}</span>
                  <h2>{grant?.name || 'Grant application'}</h2>
                  <p>{grant?.funder} · {grant?.amount_label}{application.match_score ? ` · ${application.match_score}% estimated match` : ''}</p>
                </div>
                <div className="application-progress"><div><span style={{ width: `${progress}%` }} /></div><small>{progress}% through the controlled workflow</small></div>
                <div className="application-next">
                  {application.status === 'draft_ready' ? (
                    <button type="button" className="queue-approve" onClick={() => void approveInspection(application.id)} disabled={approvingId === application.id}>
                      {approvingId === application.id ? 'Queuing…' : 'Approve inspection'}
                    </button>
                  ) : (
                    <><span>{application.status === 'submitted' ? 'View record' : 'Review draft'}</span><a aria-label={`Review ${grant?.name || 'application'}`} href={`/apply?id=${grant?.slug || ''}`}><ArrowRight size={15} /></a></>
                  )}
                </div>
              </article>
            );
          }) : previewPipeline.map((item) => (
            <article className="application-row" key={item.title}>
              <div className="application-identity">
                <span className={`application-status ${item.stage === 'MATCHED' ? 'is-ready' : item.stage === 'DRAFTING' ? 'is-writing' : 'is-watching'}`}><item.icon size={14} />{item.stage}</span>
                <h2>{item.title}</h2><p>{item.detail}</p>
              </div>
              <div className="application-progress"><div><span style={{ width: `${item.progress}%` }} /></div><small>{item.progress}% through the controlled workflow</small></div>
              <div className="application-next"><span>{item.action}</span><a aria-label={`${item.action}: ${item.title}`} href={item.href}><ArrowRight size={15} /></a></div>
            </article>
          ))}
        </div>

        {actionError && <p className="onboarding-error" role="alert">{actionError}</p>}
        <div className="approval-explainer">
          <LockKeyhole size={22} />
          <div><h2>Inspection approval is not submission approval.</h2><p>Approving inspection lets Shinnslist read the real form and identify missing information. Signatures, legal attestations, payments, uncertain claims, and external submission still require a separate human gate.</p></div>
          <CheckCircle2 size={21} />
        </div>
      </div>
    </div>
  );
}
