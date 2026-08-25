'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BadgeCheck, ExternalLink, FileCheck2, LockKeyhole } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import { grantDfyItem } from '@/lib/dfy';
import DfyButton from '@/components/DfyButton';

type StoredProfile = {
  businessName?: string; applicantType?: string; mission?: string; fundingUse?: string;
  city?: string; state?: string; zip?: string; dob?: string; householdSize?: string;
  incomeRange?: string; employmentStatus?: string; educationStatus?: string; gender?: string;
  raceEthnicity?: string[]; veteran?: boolean; disability?: boolean; immigrationStatus?: string;
  identityFlags?: string[]; needs?: string[];
};

type LiveGrant = {
  id: string; slug: string; name: string; funder: string; amount_label: string;
  deadline: string | null; deadline_label: string; status: string; category: string;
  summary: string; eligibility_text: string; eligibility_rules: Record<string, unknown>;
  effort: string; fee_cents: number; source_url: string; application_url: string; verified_at: string;
};

function PreviewContent() {
  const params = useSearchParams();
  const router = useRouter();
  const slug = params.get('id') || '';
  const [grant, setGrant] = useState<LiveGrant | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [answers, setAnswers] = useState({ fit: '', story: '', use: '' });

  useEffect(() => {
    const supabase = createBrowserClient();
    void supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    try {
      const stored = localStorage.getItem('shinnslist_grant_profile');
      if (stored) {
        const parsed: StoredProfile = JSON.parse(stored);
        /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from localStorage on mount */
        setProfile(parsed);
        setAnswers({
          fit: `${parsed.businessName || 'The applicant'} is based in ${parsed.city || 'your city'}, ${parsed.state || 'your state'} and is applying as a ${parsed.applicantType?.toLowerCase() || 'qualified applicant'}.`,
          story: parsed.mission || '',
          use: parsed.fundingUse || '',
        });
        /* eslint-enable react-hooks/set-state-in-effect */
      }
    } catch { /* fall back to blank */ }
    if (slug) {
      fetch(`/api/grant/${encodeURIComponent(slug)}`)
        .then((r) => r.json())
        .then((b) => { if (b.grant) setGrant(b.grant); })
        .catch(() => undefined)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [slug]);

  const isIndividual = profile?.applicantType === 'Individual / household';
  const feeLabel = grant && grant.fee_cents > 0 ? `$${(grant.fee_cents / 100).toFixed(0)}` : 'None';
  const verifiedLabel = grant?.verified_at ? new Date(grant.verified_at).toISOString().slice(0, 10) : 'recently';

  const saveDraft = async () => {
    if (!profile) { router.push('/onboarding'); return; }
    if (!signedIn) { localStorage.setItem('shinnslist_pending_grant', grant?.slug || ''); router.push('/signup'); return; }
    if (!grant) return;
    setSaving(true); setSaveError('');
    try {
      const supabase = createBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Your session expired. Sign in again.');
      const response = await fetch('/api/grant-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ grant_slug: grant.slug }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Could not save the draft.');
      router.push('/applications');
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Could not save the draft.');
      setSaving(false);
    }
  };

  if (loading) return <div className="grant-shell grant-empty">Loading application…</div>;
  if (!grant) return <div className="grant-shell grant-empty">Grant not found. <Link href="/grants">Back to matches</Link></div>;

  return (
    <div className="grant-page apply-preview-page">
      <div className="grant-shell">
        <Link href="/grants" className="preview-back"><ArrowLeft size={16} /> Back to matches</Link>
        <div className="preview-title-row">
          <div>
            <span className="preview-source"><BadgeCheck size={15} /> Official source verified {verifiedLabel}</span>
            <h1>{grant.name}</h1>
            <p>{grant.funder} · {grant.amount_label || 'Amount varies'} · {grant.deadline_label || 'Rolling'}</p>
          </div>
          <a href={grant.application_url || grant.source_url} target="_blank" rel="noreferrer" className="preview-official">Open official page <ExternalLink size={15} /></a>
        </div>

        {!profile && (
          <div className="preview-mode-strip"><FileCheck2 size={19} /><div><strong>Illustrative application preview</strong><span>Build your profile to replace placeholders with your real, reusable answers.</span></div><Link href="/onboarding">Build profile <ArrowRight size={15} /></Link></div>
        )}

        <div className="preview-layout">
          <div className="preview-form">
            <section>
              <div className="preview-section-head"><span>01</span><div><h2>About this opportunity</h2><p>{grant.category?.replaceAll('_', ' ')}</p></div></div>
              {grant.summary && <p className="eligibility-warning" style={{ color: 'var(--grant-ink)' }}>{grant.summary}</p>}
              {grant.eligibility_text && <p className="eligibility-warning">Eligibility: {grant.eligibility_text}</p>}
            </section>

            <section>
              <div className="preview-section-head"><span>02</span><div><h2>Your prefilled answers</h2><p>Edit every word before you submit. Blank fields are never invented.</p></div></div>
              <div className="grant-field"><label htmlFor="fit-answer">Why are you eligible?</label><textarea id="fit-answer" className="grant-textarea" value={answers.fit} onChange={(e) => setAnswers({ ...answers, fit: e.target.value })} /></div>

              {isIndividual ? (
                <>
                  <div className="onboarding-two-col">
                    <div className="grant-field"><label>Date of birth</label><div className="grant-input" style={{ paddingTop: 12 }}>{profile?.dob || 'Not provided'}</div></div>
                    <div className="grant-field"><label>Household size</label><div className="grant-input" style={{ paddingTop: 12 }}>{profile?.householdSize || 'Not provided'}</div></div>
                    <div className="grant-field"><label>Income range</label><div className="grant-input" style={{ paddingTop: 12 }}>{profile?.incomeRange || 'Not provided'}</div></div>
                    <div className="grant-field"><label>Employment</label><div className="grant-input" style={{ paddingTop: 12 }}>{profile?.employmentStatus || 'Not provided'}</div></div>
                    <div className="grant-field"><label>Education</label><div className="grant-input" style={{ paddingTop: 12 }}>{profile?.educationStatus || 'Not provided'}</div></div>
                    <div className="grant-field"><label>Gender</label><div className="grant-input" style={{ paddingTop: 12 }}>{profile?.gender || 'Not provided'}</div></div>
                  </div>
                  <div className="grant-field"><label>Background &amp; identity</label><div className="grant-input" style={{ paddingTop: 12 }}>{[...(profile?.raceEthnicity || []), ...(profile?.identityFlags || [])].join(', ') || 'None selected'}</div></div>
                  <div className="grant-field"><label>What you need help with</label><div className="grant-input" style={{ paddingTop: 12 }}>{profile?.needs?.join(', ') || 'None selected'}</div></div>
                  <div className="onboarding-two-col">
                    <div className="grant-field"><label>Veteran</label><div className="grant-input" style={{ paddingTop: 12 }}>{profile?.veteran ? 'Yes' : 'No'}</div></div>
                    <div className="grant-field"><label>Disability</label><div className="grant-input" style={{ paddingTop: 12 }}>{profile?.disability ? 'Yes' : 'No'}</div></div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grant-field"><label htmlFor="story-answer">Tell us about your organization or business.</label><textarea id="story-answer" className="grant-textarea" value={answers.story} onChange={(e) => setAnswers({ ...answers, story: e.target.value })} placeholder="Your reusable business story will be tailored here." /></div>
                  <div className="grant-field"><label htmlFor="use-answer">How will the funding be used?</label><textarea id="use-answer" className="grant-textarea" value={answers.use} onChange={(e) => setAnswers({ ...answers, use: e.target.value })} placeholder="Your funding plan will be adapted to the funder's priorities." /></div>
                </>
              )}
            </section>

            <section>
              <div className="preview-section-head"><span>03</span><div><h2>Submission gates</h2><p>These stay locked until you review the real application.</p></div></div>
              <div className="submission-gates">
                <div><LockKeyhole size={17} /><span>Identity and legal attestations</span><strong>Always manual</strong></div>
                <div><LockKeyhole size={17} /><span>Signature or certification</span><strong>Always manual</strong></div>
                <div><LockKeyhole size={17} /><span>Final external submission</span><strong>Separate approval</strong></div>
              </div>
            </section>
          </div>

          <aside className="preview-sidebar">
            <div className="preview-match"><span>APPLICANT TYPE</span><strong style={{ fontSize: 22 }}>{profile?.applicantType || 'Not set'}</strong><p>{isIndividual ? 'Individual / household profile' : 'Organization profile'}</p></div>
            <dl>
              <div><dt>Award</dt><dd>{grant.amount_label || 'Varies'}</dd></div>
              <div><dt>Deadline</dt><dd>{grant.deadline_label || 'Rolling'}</dd></div>
              <div><dt>Effort</dt><dd>{grant.effort || 'Moderate'}</dd></div>
              <div><dt>Fee</dt><dd>{feeLabel}</dd></div>
            </dl>
            {profile ? (
              <button type="button" onClick={saveDraft} disabled={saving} className="grant-button grant-button-primary">{saving ? 'Saving draft…' : signedIn ? 'Save draft and continue' : 'Create account to save'} {!saving && <ArrowRight size={17} />}</button>
            ) : (
              <Link href="/onboarding" className="grant-button grant-button-primary">Build profile for real answers <ArrowRight size={17} /></Link>
            )}
            {saveError && <p className="onboarding-error" role="alert">{saveError}</p>}
            <DfyButton item={grantDfyItem(grant.slug, grant.name, grant.effort, grant.amount_label)} variant="block" />
            <p className="preview-charge-note">Inspection approval never authorizes submission. Credits are charged only after a separate final approval.</p>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function ApplyPreviewPage() {
  return <Suspense fallback={<div className="grant-shell grant-empty">Loading application preview…</div>}><PreviewContent /></Suspense>;
}
