'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, ExternalLink, ShieldCheck, XCircle } from 'lucide-react';
import { classActions } from '@/data/classActions';
import { classActionDfyItem, fmtCents } from '@/lib/dfy';
import { addToCart } from '@/lib/cart';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface FormState {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export default function ClaimWizard({ slug }: { slug: string }) {
  const router = useRouter();
  const claim = useMemo(() => classActions.find((c) => c.slug === slug), [slug]);
  const item = useMemo(
    () => (claim ? classActionDfyItem(claim.slug, claim.name, claim.description, claim.proof, claim.payout) : null),
    [claim]
  );

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({ name: '', email: '', phone: '', address: '', city: '', state: '', zip: '' });
  const [eligible, setEligible] = useState<'yes' | 'unsure' | 'no' | null>(null);
  const [details, setDetails] = useState('');
  const [proof, setProof] = useState(false);
  const [notice, setNotice] = useState(false);
  const [terminal, setTerminal] = useState<'ineligible' | 'self-filed' | null>(null);

  if (!claim || !item) {
    return (
      <div className="grant-page learn-page">
        <div className="grant-shell learn-prose" style={{ padding: 40, textAlign: 'center' }}>
          <h1>That settlement isn&apos;t in our list.</h1>
          <Link href="/free-money/class-actions" className="grant-button grant-button-primary">Browse open settlements</Link>
        </div>
      </div>
    );
  }

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function saveProgress(nextStep: number, done = false, declined = false) {
    setStep(nextStep);
    if (EMAIL_RE.test(form.email.trim())) {
      try {
        await fetch('/api/dfy-wizard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email.trim().toLowerCase(),
            kind: 'class-action',
            slug,
            step: Math.max(nextStep, done ? 4 : nextStep),
            total_steps: 4,
            done,
            declined,
          }),
        });
      } catch {
        /* progress save is best-effort */
      }
    }
  }

  function step1Valid() {
    return form.name.trim().length >= 2 && form.email.trim().length > 0;
  }

  function chooseEligible(v: 'yes' | 'unsure' | 'no') {
    setEligible(v);
    if (v === 'no') {
      saveProgress(4, true, true).then(() => setTerminal('ineligible'));
    } else {
      setStep(3);
    }
  }

  async function selfFile() {
    window.open(claim!.claim_url, '_blank', 'noopener');
    await saveProgress(4, true, false);
    setTerminal('self-filed');
  }

  async function letUsFile() {
    const answers = {
      name: form.name, email: form.email, phone: form.phone,
      address: form.address, city: form.city, state: form.state, zip: form.zip,
      eligible, details, proof, notice,
    };
    try {
      window.localStorage.setItem(`shinnslist_dfy_answers_class-action_${slug}`, JSON.stringify(answers));
    } catch { /* ignore */ }
    addToCart(item!);
    await saveProgress(4, false, false);
    router.push('/cart');
  }

  const addressParts = [form.address, `${form.city || ''}${form.city && form.state ? ', ' : ''}${form.state || ''}`.trim(), form.zip].filter((p) => p && p.trim());
  const prepared = [
    `Name: ${form.name || '(your name)'}`,
    `Email: ${form.email || '(your email)'}`,
    ...(form.phone ? [`Phone: ${form.phone}`] : []),
    ...(addressParts.length ? [`Address: ${addressParts.join(' ')}`] : []),
    details ? `What happened / when: ${details}` : '',
    proof ? 'I have proof of purchase or account records.' : '',
    notice ? 'I received a settlement notice by mail or email.' : '',
  ].filter(Boolean).join('\n');

  if (terminal === 'ineligible') {
    return (
      <div className="grant-page learn-page">
        <div className="grant-shell learn-prose" style={{ maxWidth: 640, margin: '0 auto', padding: '40px 0', textAlign: 'center' }}>
          <XCircle size={40} color="#b42318" style={{ margin: '0 auto' }} />
          <h1 style={{ fontSize: 26, marginTop: 12 }}>Then this one isn&apos;t for you.</h1>
          <p>Good call — never file a claim you don&apos;t genuinely qualify for. There are {classActions.length} other open settlements; the next one might have your name on it.</p>
          <Link href="/free-money/class-actions" className="grant-button grant-button-primary" style={{ marginTop: 8, display: 'inline-flex' }}>
            Browse open settlements
          </Link>
        </div>
      </div>
    );
  }

  if (terminal === 'self-filed') {
    return (
      <div className="grant-page learn-page">
        <div className="grant-shell learn-prose" style={{ maxWidth: 680, margin: '0 auto', padding: '40px 0' }}>
          <CheckCircle2 size={40} color="#087a55" style={{ margin: '0 auto', display: 'block' }} />
          <h1 style={{ fontSize: 26, textAlign: 'center', marginTop: 12 }}>You&apos;re filing it yourself — here&apos;s your prep.</h1>
          <p style={{ textAlign: 'center' }}>
            The official claim site opened in a new tab. Copy your prepared answers below into its form. File before <strong>{claim.deadline}</strong>.
          </p>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f6faf7', border: '1px solid #e2ece6', borderRadius: 10, padding: 16, fontSize: 13, lineHeight: 1.5 }}>
            {prepared}
          </pre>
          <p style={{ fontSize: 13, color: '#55665c' }}>
            Changed your mind? <Link href="/cart">Add it to your cart</Link> and we&apos;ll file it for {fmtCents(item.listedCents)}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grant-page learn-page">
      <div className="grant-shell learn-prose" style={{ maxWidth: 680, margin: '0 auto' }}>
        <Link href="/free-money/class-actions" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#0b7a4b', textDecoration: 'none', marginBottom: 8 }}>
          <ArrowLeft size={14} /> All settlements
        </Link>
        <h1 style={{ fontSize: 28, marginTop: 4 }}>{claim.name}</h1>
        <p>{claim.description}</p>
        <p style={{ fontSize: 13, color: '#55665c' }}>
          Payout <strong>{claim.payout}</strong> · Deadline <strong>{claim.deadline}</strong> · Proof {claim.proof === 'No' ? 'not required' : 'may be required'}
        </p>

        <div style={{ display: 'flex', gap: 6, margin: '20px 0' }}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} style={{ height: 6, flex: 1, borderRadius: 999, background: n <= step ? '#0b7a4b' : '#e2ece6' }} />
          ))}
        </div>

        {step === 1 && (
          <section>
            <h2 style={{ fontSize: 20 }}>1 · Your info</h2>
            <p style={{ fontSize: 13, color: '#55665c' }}>Used only to prepare your claim. We never share it beyond filing this claim.</p>
            <div className="learn-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input placeholder="Full name" value={form.name} onChange={(e) => set('name', e.target.value)} style={inputStyle} />
              <input placeholder="Email (for your copy)" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} style={inputStyle} />
              <input placeholder="Phone (optional)" value={form.phone} onChange={(e) => set('phone', e.target.value)} style={inputStyle} />
              <input placeholder="Street address" value={form.address} onChange={(e) => set('address', e.target.value)} style={inputStyle} />
              <input placeholder="City" value={form.city} onChange={(e) => set('city', e.target.value)} style={inputStyle} />
              <input placeholder="State" value={form.state} onChange={(e) => set('state', e.target.value)} style={inputStyle} />
              <input placeholder="ZIP" value={form.zip} onChange={(e) => set('zip', e.target.value)} style={inputStyle} />
            </div>
            <button type="button" className="grant-button grant-button-primary" style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6 }} disabled={!step1Valid()} onClick={() => saveProgress(2)}>
              Continue <ArrowRight size={16} />
            </button>
          </section>
        )}

        {step === 2 && (
          <section>
            <h2 style={{ fontSize: 20 }}>2 · Are you in this class?</h2>
            <p style={{ fontSize: 13, color: '#55665c' }}>
              If you&apos;re not sure, answer honestly — the administrator verifies eligibility against records. Never invent a purchase or an incident; false claims are perjury and we won&apos;t file one for you.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
              <button type="button" className="grant-button grant-button-primary" onClick={() => chooseEligible('yes')}>Yes — I&apos;m covered by this settlement</button>
              <button type="button" className="grant-button grant-button-dark" onClick={() => chooseEligible('unsure')}>Not sure — check my eligibility anyway</button>
              <button type="button" style={{ ...buttonBase, background: 'none', color: '#b42318', border: '1px solid #f3c9c4' }} onClick={() => chooseEligible('no')}>No — this doesn&apos;t apply to me</button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <h2 style={{ fontSize: 20 }}>3 · Your claim details</h2>
            <textarea
              rows={4}
              placeholder="What happened and when — e.g. 'My account was opened with X in 2022; I was notified of the breach in June 2026.'"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              style={{ ...inputStyle, width: '100%', marginTop: 6 }}
            />
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, fontSize: 14 }}>
              <input type="checkbox" checked={proof} onChange={(e) => setProof(e.target.checked)} /> I have proof of purchase or account records
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, fontSize: 14 }}>
              <input type="checkbox" checked={notice} onChange={(e) => setNotice(e.target.checked)} /> I received a settlement notice by mail or email
            </label>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button type="button" className="grant-button grant-button-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => saveProgress(4)}>
                Review <ArrowRight size={16} />
              </button>
              <button type="button" style={{ ...buttonBase, background: 'none', color: '#55665c' }} onClick={() => setStep(1)}>Back</button>
            </div>
          </section>
        )}

        {step === 4 && (
          <section>
            <h2 style={{ fontSize: 20 }}>4 · Review</h2>
            <pre style={{ whiteSpace: 'pre-wrap', background: '#f6faf7', border: '1px solid #e2ece6', borderRadius: 10, padding: 16, fontSize: 13, lineHeight: 1.5 }}>
              {prepared}
            </pre>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
              <button type="button" className="grant-button grant-button-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center' }} onClick={selfFile}>
                <ExternalLink size={16} /> I&apos;ll file it myself — free
              </button>
              <button type="button" className="grant-button grant-button-dark" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center' }} onClick={letUsFile}>
                <ClipboardCheck size={16} /> We&apos;ll file it for you — {fmtCents(item.listedCents)}
              </button>
            </div>
            <p style={{ fontSize: 12, color: '#55665c', marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={14} /> Free to file yourself. Our price is a convenience fee only — no cut of your payout, claim stays yours.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #d5e2da',
  fontSize: 15,
};

const buttonBase: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 15,
  cursor: 'pointer',
};
