import Link from 'next/link';
import { ArrowRight, BadgeCheck, CheckCircle2, FilePenLine, LockKeyhole, SearchCheck, Send } from 'lucide-react';

const steps = [
  { icon: SearchCheck, title: 'Discover and verify', text: 'Official funder pages are checked for deadline, amount, eligibility, fees, geography, and application status. Stale and paid opportunities are removed.' },
  { icon: BadgeCheck, title: 'Qualify before drafting', text: 'Your applicant profile runs against hard rules first. A match explanation shows what passes, what is inferred, and what still needs proof.' },
  { icon: FilePenLine, title: 'Build the application', text: 'Verified facts, prior narratives, budgets, and documents become funder-specific answers. Missing facts stay visibly blank instead of being invented.' },
  { icon: LockKeyhole, title: 'Review the exact submission', text: 'You see every answer and attachment before approval. SSN, EIN, signatures, legal attestations, and paid fees remain protected gates.' },
  { icon: Send, title: 'Submit and save the receipt', text: 'Approved applications enter the browser workflow. Confirmation numbers, reporting duties, deadlines, and funder-cycle limits are written back to your queue.' },
];

export default function HowItWorksPage() {
  return (
    <div className="grant-page how-page">
      <div className="grant-shell">
        <div className="how-hero"><div><h1>From official grant page to finished application.</h1><p>Shinnslist is not another directory. It is the controlled workflow that turns verified opportunities into applications you can review and approve.</p></div><Link href="/onboarding" className="grant-button grant-button-dark">Build my profile <ArrowRight size={17} /></Link></div>
        <div className="how-track">
          {steps.map(({ icon: Icon, title, text }, index) => <section key={title}><div className="how-step-mark"><Icon size={22} /><span>{String(index + 1).padStart(2, '0')}</span></div><div><h2>{title}</h2><p>{text}</p></div></section>)}
        </div>
        <div className="how-boundary"><CheckCircle2 size={24} /><div><h2>Automation ends where your authority begins.</h2><p>Shinnslist handles repetition. You retain control of identity, money, legal claims, signatures, and any funder action that requires a human applicant.</p></div></div>
      </div>
    </div>
  );
}
