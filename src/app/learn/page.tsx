import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Building2, Compass, FileText, Landmark, HeartHandshake } from 'lucide-react';

export const metadata: Metadata = {
  title: 'How to find and win grants — the free guide | Shinnslist',
  description: 'How to find grants you are actually eligible for and write an application that wins. Grant types, where to search, and a step-by-step playbook — free.',
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'How do I find grants I am actually eligible for?', acceptedAnswer: { '@type': 'Answer', text: 'Start from hard eligibility rules, not a keyword search: entity type, location, ownership, revenue, and the funder\'s allowed uses. Then screen every opportunity against those rules before writing anything. Shinnslist runs those rules against your applicant profile and returns only verified matches you can win.' } },
    { '@type': 'Question', name: 'Do small businesses get grants directly from the government?', acceptedAnswer: { '@type': 'Answer', text: 'Mostly no. The federal government directs most grant dollars to nonprofits, universities, and research, and the SBA primarily guarantees loans rather than making direct grants to most small businesses. Small-business grants are far more common from states, counties, corporations, and private foundations.' } },
    { '@type': 'Question', name: 'What is the difference between a grant and a loan?', acceptedAnswer: { '@type': 'Answer', text: 'A grant is money you do not repay, but it is competitive, restricted to the uses the funder defines, and usually requires reporting. A loan is repaid with interest but gives you more flexibility. Grants are worth pursuing when your project matches the funder\'s goals.' } },
    { '@type': 'Question', name: 'Do legitimate grants charge an application fee?', acceptedAnswer: { '@type': 'Answer', text: 'No. Legitimate grant programs are free to apply to. An "application fee" or a promise of a grant in exchange for payment is a red flag, and it is one of the signals Shinnslist uses to remove questionable opportunities from its verified queue.' } },
    { '@type': 'Question', name: 'How long does it take to write a grant application?', acceptedAnswer: { '@type': 'Answer', text: 'From a few hours to several weeks, depending on the funder and the size of the ask. Most of the time goes to gathering facts, writing the need statement, and building the budget — which is why a reusable applicant profile that pre-fills those sections saves so much time.' } },
  ],
};

const funders = [
  { icon: Landmark, title: 'Government', detail: 'Federal (Grants.gov), state, county, and city programs. Most competitive; heavy reporting. Often the largest dollar amounts.' },
  { icon: HeartHandshake, title: 'Foundations', detail: 'Private and family foundations. More targeted missions, lighter paperwork, and quicker decisions than federal grants.' },
  { icon: Building2, title: 'Corporate', detail: 'Company giving programs and small-business funds. Often tied to local communities, industries, or diversity goals.' },
];

export default function LearnPage() {
  return (
    <div className="grant-page learn-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="grant-shell">
        <div className="learn-hero">
          <h1>Grants, without the guesswork.</h1>
          <p>Free, plain-English guides on finding grants you can actually win and writing applications that get funded — plus how Shinnslist automates the repetitive parts so you only do the parts that need you.</p>
        </div>

        <div className="learn-grid">
          <Link href="/learn/find-grants" className="learn-card">
            <Compass size={24} color="#087a55" />
            <h2>How to find grants you can actually win</h2>
            <p>The three funder types, where they list opportunities, and how to screen for hard eligibility before you write a word.</p>
            <span className="grant-button grant-button-dark" style={{ alignSelf: 'flex-start', marginTop: 6 }}>Read the guide <ArrowRight size={16} /></span>
          </Link>
          <Link href="/learn/write-grant-application" className="learn-card">
            <FileText size={24} color="#087a55" />
            <h2>How to write a grant application that wins</h2>
            <p>The seven-part structure funders actually score — need statement, measurable goals, budget, capacity, and sustainability.</p>
            <span className="grant-button grant-button-dark" style={{ alignSelf: 'flex-start', marginTop: 6 }}>Read the guide <ArrowRight size={16} /></span>
          </Link>
          <Link href="/learn/grants-for-women-founders" className="learn-card">
            <Building2 size={24} color="#087a55" />
            <h2>Grants for women founders, verified</h2>
            <p>The real programs — Amber Grant, IFundWomen, Eileen Fisher, Tory Burch, and Cartier — with verified amounts, eligibility, and the application playbook.</p>
            <span className="grant-button grant-button-dark" style={{ alignSelf: 'flex-start', marginTop: 6 }}>Read the guide <ArrowRight size={16} /></span>
          </Link>
        </div>

        <div className="learn-prose">
          <h2>Where grant money actually comes from</h2>
          <div className="learn-grid">
            {funders.map(({ icon: Icon, title, detail }) => (
              <div key={title} className="learn-card">
                <Icon size={22} color="#087a55" />
                <h2>{title}</h2>
                <p>{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="learn-faq">
        <h2 style={{ fontSize: 26 }}>Frequently asked questions</h2>
        <details open>
          <summary>How do I find grants I am actually eligible for?</summary>
          <p>Start from hard eligibility rules, not a keyword search: entity type, location, ownership, revenue, and the funder&apos;s allowed uses. Then screen every opportunity against those rules before writing anything. Shinnslist runs those rules against your applicant profile and returns only verified matches you can win.</p>
        </details>
        <details>
          <summary>Do small businesses get grants directly from the government?</summary>
          <p>Mostly no. The federal government directs most grant dollars to nonprofits, universities, and research, and the SBA primarily guarantees loans rather than making direct grants to most small businesses. Small-business grants are far more common from states, counties, corporations, and private foundations.</p>
        </details>
        <details>
          <summary>What is the difference between a grant and a loan?</summary>
          <p>A grant is money you do not repay, but it is competitive, restricted to the uses the funder defines, and usually requires reporting. A loan is repaid with interest but gives you more flexibility. Grants are worth pursuing when your project matches the funder&apos;s goals.</p>
        </details>
        <details>
          <summary>Do legitimate grants charge an application fee?</summary>
          <p>No. Legitimate grant programs are free to apply to. An &quot;application fee&quot; or a promise of a grant in exchange for payment is a red flag, and it is one of the signals Shinnslist uses to remove questionable opportunities from its verified queue.</p>
        </details>
        <details>
          <summary>How long does it take to write a grant application?</summary>
          <p>From a few hours to several weeks, depending on the funder and the size of the ask. Most of the time goes to gathering facts, writing the need statement, and building the budget — which is why a reusable applicant profile that pre-fills those sections saves so much time.</p>
        </details>
      </div>
    </div>
  );
}
