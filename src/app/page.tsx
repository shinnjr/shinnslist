import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  Clock3,
  FilePenLine,
  LockKeyhole,
  SearchCheck,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react';
import { GRANTS } from '@/data/grants';

const proofGrants = [GRANTS[1], GRANTS[5], GRANTS[7]];

function StageRail() {
  return (
    <div className="strip-bay" aria-label="Illustrative grant application workflow">
      <div className="strip-bay-head">
        <span>APPLICATION CONTROL</span>
        <span className="strip-live"><i /> LIVE QUEUE</span>
      </div>
      <div className="strip-column-labels" aria-hidden="true">
        <span>OPPORTUNITY</span><span>READINESS</span><span>NEXT ACTION</span>
      </div>

      <div className="flight-strip strip-priority">
        <div className="strip-grant">
          <span className="strip-code">TDF–26</span>
          <strong>Strengthening Neighborhoods</strong>
          <small>$500–$5,000 · due Oct 19</small>
        </div>
        <div className="strip-score"><strong>91</strong><span>strong fit</span></div>
        <div className="strip-state is-ready"><CheckCircle2 size={17} /> Draft ready</div>
      </div>

      <div className="flight-strip">
        <div className="strip-grant">
          <span className="strip-code">LNV–26</span>
          <strong>Lenovo Evolve Small</strong>
          <small>$25,000 + technology · rolling</small>
        </div>
        <div className="strip-score"><strong>88</strong><span>strong fit</span></div>
        <div className="strip-state is-writing"><FilePenLine size={17} /> Drafting answers</div>
      </div>

      <div className="flight-strip">
        <div className="strip-grant">
          <span className="strip-code">BRV–Q4</span>
          <strong>Breva Thrive Grant</strong>
          <small>$5,000 · opens Oct 1</small>
        </div>
        <div className="strip-score"><strong>86</strong><span>strong fit</span></div>
        <div className="strip-state is-watch"><Clock3 size={17} /> Watching window</div>
      </div>

      <div className="strip-approval">
        <ShieldCheck size={19} />
        <div><strong>Nothing submits without approval.</strong><span>You see the exact answers first.</span></div>
        <Link href="/applications">Open queue <ArrowRight size={15} /></Link>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="grant-hero">
        <div className="grant-shell grant-hero-grid">
          <div className="grant-hero-copy">
            <div className="source-proof"><BadgeCheck size={17} /> Verified from official funder sources</div>
            <h1>Stop searching for grants. <span>Start submitting them.</span></h1>
            <p className="grant-hero-lede">
              Shinnslist checks what you qualify for, drafts the complete application, and puts it in front of you for approval—before a deadline disappears.
            </p>
            <div className="grant-hero-actions">
              <Link href="/onboarding" className="grant-button grant-button-primary">Find grants I can win <ArrowRight size={18} /></Link>
              <Link href="/grants" className="grant-text-link">See verified grants <ArrowRight size={16} /></Link>
            </div>
            <ul className="grant-trust-list">
              <li><Check size={16} /> No credit card to see matches</li>
              <li><Check size={16} /> Fee traps blocked</li>
              <li><Check size={16} /> Final answers stay under your control</li>
            </ul>
          </div>
          <StageRail />
        </div>
      </section>

      <section className="grant-proof-band">
        <div className="grant-shell proof-band-inner">
          <p>Every opportunity carries its source, deadline, eligibility rules, fee, and verification date.</p>
          <div className="proof-band-stats">
            <span><strong>$0</strong> application fees in the verified queue</span>
            <span><strong>1</strong> reusable applicant profile</span>
            <span><strong>0</strong> submissions without approval</span>
          </div>
        </div>
      </section>

      <section className="grant-section mechanism-section">
        <div className="grant-shell">
          <div className="grant-section-heading">
            <h2>One profile. Every application moves forward.</h2>
            <p>A search result is not useful until it becomes a finished application.</p>
          </div>
          <div className="mechanism-rail">
            {[
              { icon: SearchCheck, title: 'Verify', text: 'We monitor official sources and throw out stale, paid, or ineligible opportunities.' },
              { icon: ShieldCheck, title: 'Qualify', text: 'Hard rules run first. A bad fit never wastes your time or submission credits.' },
              { icon: FilePenLine, title: 'Draft', text: 'Your verified facts become funder-specific answers, budgets, and narratives.' },
              { icon: LockKeyhole, title: 'Approve', text: 'You review the exact application and control attestations, signatures, and fees.' },
              { icon: Send, title: 'Submit', text: 'Approved applications enter the browser workflow and return a confirmation receipt.' },
            ].map(({ icon: Icon, title, text }, index) => (
              <div className="mechanism-stop" key={title}>
                <div className="mechanism-marker"><Icon size={20} /><span>{index + 1}</span></div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grant-section grant-evidence-section">
        <div className="grant-shell evidence-grid">
          <div className="evidence-copy">
            <h2>Real grants. Real requirements. No “perfect match” theater.</h2>
            <p>Each match explains why it fits, what could block it, and the work required. You can audit the official source yourself.</p>
            <Link href="/grants" className="grant-button grant-button-dark">Browse current matches <ArrowRight size={17} /></Link>
          </div>
          <div className="evidence-strips">
            {proofGrants.map((grant) => (
              <article className="evidence-strip" key={grant.id}>
                <div className="evidence-funder"><span>{grant.funder}</span><small>Verified {grant.verifiedAt}</small></div>
                <div className="evidence-main"><h3>{grant.name}</h3><p>{grant.eligibility}</p></div>
                <div className="evidence-amount"><strong>{grant.amount}</strong><span>{grant.deadlineLabel}</span></div>
                <a href={`/apply?id=${grant.id}`} aria-label={`Preview ${grant.name}`}><ArrowRight size={18} /></a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grant-section guardrail-section">
        <div className="grant-shell guardrail-grid">
          <div className="guardrail-board">
            <div className="guardrail-row is-stop"><X size={18} /><span>Ineligible entity type</span><strong>BLOCKED</strong></div>
            <div className="guardrail-row is-stop"><X size={18} /><span>Application fee detected</span><strong>BLOCKED</strong></div>
            <div className="guardrail-row is-pass"><Check size={18} /><span>Official deadline verified</span><strong>PASS</strong></div>
            <div className="guardrail-row is-pass"><Check size={18} /><span>Applicant facts sourced</span><strong>PASS</strong></div>
            <div className="guardrail-row is-hold"><LockKeyhole size={18} /><span>Legal attestation required</span><strong>YOUR APPROVAL</strong></div>
          </div>
          <div className="guardrail-copy">
            <h2>Autopilot does not mean reckless.</h2>
            <p>Grant funders remember spam. Shinnslist protects your reputation by blocking bad fits, rewriting every narrative for the funder, and stopping at real legal and financial gates.</p>
            <ul>
              <li><CheckCircle2 size={18} /> One application per funder per cycle</li>
              <li><CheckCircle2 size={18} /> No invented facts or copied narratives</li>
              <li><CheckCircle2 size={18} /> Receipts and obligations saved after submission</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="grant-final-cta">
        <div className="grant-shell grant-final-inner">
          <div><h2>Your next grant should already be in motion.</h2><p>Build the profile once. See verified matches and the first application preview before paying.</p></div>
          <Link href="/onboarding" className="grant-button grant-button-paper">Build my grant profile <ArrowRight size={18} /></Link>
        </div>
      </section>
    </>
  );
}
