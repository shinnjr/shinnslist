import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Scale, ShieldCheck, BadgeDollarSign, Search } from 'lucide-react';
import FreeMoneyLeadCapture from '@/components/FreeMoneyLeadCapture';

export const metadata: Metadata = {
  title: 'Open class-action settlements — free to claim | Shinnslist',
  description:
    'Open class-action settlements you may qualify for, plus grants and benefits — one search, free, and sourced from the official holders of the money.',
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Does filing a class-action claim cost anything?', acceptedAnswer: { '@type': 'Answer', text: 'No. Filing a class-action settlement claim is free. If you are a member of the class, you file directly with the settlement administrator at no cost.' } },
    { '@type': 'Question', name: 'How do I know if I qualify for a settlement?', acceptedAnswer: { '@type': 'Answer', text: 'Read the class definition on the settlement site. If your situation matches — you bought the product, used the service, or were affected by the data breach — you can file.' } },
    { '@type': 'Question', name: 'What else can I find here?', acceptedAnswer: { '@type': 'Answer', text: 'Grants, benefits, loans, and cost-share programs you may qualify for. One search covers it all.' } },
  ],
};

export default function FreeMoneyPage() {
  return (
    <div className="grant-page learn-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="grant-shell">
        <div className="learn-hero">
          <h1>Money that&apos;s already yours — found and claimed.</h1>
          <p>Open class-action settlements you may qualify for, plus grants and benefits — one search, free, and sourced from the official holders of the money.</p>
        </div>

        <div style={{ margin: '8px 0 24px' }}>
          <Link href="/find" className="grant-button grant-button-dark">Search everything at once <ArrowRight size={16} /></Link>
        </div>

        <FreeMoneyLeadCapture />

        <div className="learn-grid">
          <Link href="/free-money/class-actions" className="learn-card">
            <Scale size={24} color="#087a55" />
            <h2>Class-action settlements</h2>
            <p>Open settlements you may be owed a payment from. Filing a claim is free — we list the deadline, payout, and how to check eligibility.</p>
            <span className="grant-button grant-button-dark" style={{ alignSelf: 'flex-start', marginTop: 6 }}>Browse settlements <ArrowRight size={16} /></span>
          </Link>
          <Link href="/grants" className="learn-card">
            <Search size={24} color="#087a55" />
            <h2>Grants &amp; benefits</h2>
            <p>Thousands of verified grants, benefits, loans, and cost-share programs, matched to your situation.</p>
            <span className="grant-button grant-button-dark" style={{ alignSelf: 'flex-start', marginTop: 6 }}>Find programs <ArrowRight size={16} /></span>
          </Link>
        </div>

        <div className="learn-prose">
          <h2>The rules we hold ourselves to</h2>
          <div className="learn-grid">
            <div className="learn-card">
              <ShieldCheck size={22} color="#087a55" />
              <h2>Free, always</h2>
              <p>Searching and filing is free at the official sources. We never charge you to get money that is already yours.</p>
            </div>
            <div className="learn-card">
              <BadgeDollarSign size={22} color="#087a55" />
              <h2>No fake numbers</h2>
              <p>Every payout and amount is sourced from the settlement administrator or the program&apos;s own terms.</p>
            </div>
            <div className="learn-card">
              <ArrowRight size={22} color="#087a55" />
              <h2>Straight to the source</h2>
              <p>We point you to the settlement administrator or the program itself — the people who actually hold the money.</p>
            </div>
          </div>
        </div>

        <div className="learn-faq">
          <h2 style={{ fontSize: 26 }}>Frequently asked questions</h2>
          <details open>
            <summary>Does filing a class-action claim cost anything?</summary>
            <p>No. Filing a class-action settlement claim is free. If you are a member of the class, you file directly with the settlement administrator at no cost.</p>
          </details>
          <details>
            <summary>How do I know if I qualify for a settlement?</summary>
            <p>Read the class definition on the settlement site. If your situation matches — you bought the product, used the service, or were affected by the breach — you can file.</p>
          </details>
          <details>
            <summary>What else can I find here?</summary>
            <p>Grants, benefits, loans, and cost-share programs you may qualify for. Search everything at once from the search box.</p>
          </details>
        </div>
      </div>
    </div>
  );
}
