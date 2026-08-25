import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Grants for women founders: verified programs, amounts, and how to apply | Shinnslist',
  description: 'The real grants for women-owned businesses and women founders — Amber Grant, IFundWomen, Eileen Fisher, Tory Burch, and Cartier — with verified amounts, eligibility, and a step-by-step application playbook.',
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Grants for women founders: verified programs, amounts, and how to apply',
  description: 'A verified rundown of the main grants for women-owned businesses — Amber Grant, IFundWomen, Eileen Fisher, Tory Burch Foundation, and Cartier Women\u2019s Initiative — with award amounts, eligibility, and a step-by-step application playbook.',
  dateModified: '2026-08-15',
  publisher: { '@type': 'Organization', name: 'Shinnslist' },
};

const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to apply for a grant as a woman founder',
  description: 'Apply for women-founder grants by checking eligibility first, using one reusable profile, writing a need statement that matches the funder, and verifying every deadline on the official source.',
  step: [
    { '@type': 'HowToStep', name: 'Check hard eligibility before anything else', text: 'Entity type, women-owned percentage, years operating, revenue range, and business location. Most women-founder grants require majority women ownership; some require three years of operations or a revenue floor. Skip programs you fail — no application fixes it.' },
    { '@type': 'HowToStep', name: 'Keep one reusable applicant profile', text: 'A single profile with your entity, ownership, revenue, location, and the project you want funded lets you reuse verified facts across every application instead of re-entering them.' },
    { '@type': 'HowToStep', name: 'Match your ask to the funder\u2019s stated goals', text: 'Read what the funder says it funds — sustainability, early-stage growth, community impact — and write the need statement and budget to that, with concrete numbers and a clear use of funds.' },
    { '@type': 'HowToStep', name: 'Verify the deadline and requirements on the official page', text: 'Third-party listings go stale. Confirm amount, deadline, and documents on the funder\u2019s own site before submitting.' },
    { '@type': 'HowToStep', name: 'Apply early and keep a queue of matches', text: 'Deadlines cluster and applications take time. Keep one list of matched programs with deadlines and status so nothing slips.' },
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'What is the Amber Grant for women?', acceptedAnswer: { '@type': 'Answer', text: 'WomensNet awards three $10,000 Amber Grants every month to women-owned businesses, and each monthly winner becomes eligible for one of three $50,000 annual grants at year-end. It is free to apply and open to women-owned businesses in the United States and Canada.' } },
    { '@type': 'Question', name: 'How much can I get from grants for women founders?', acceptedAnswer: { '@type': 'Answer', text: 'The most commonly cited programs range from about $5,000 (Tory Burch Foundation Fellows) to $10,000\u2013$40,000 (Eileen Fisher) and up to $100,000 (Cartier Women\u2019s Initiative). Amounts change every cycle, so confirm on the official funder page.' } },
    { '@type': 'Question', name: 'Does the SBA give grants to women-owned businesses?', acceptedAnswer: { '@type': 'Answer', text: 'The SBA does not provide grants for starting or expanding a business. It funds nonprofits, Resource Partners, and educational organizations, and it guarantees loans. Most women-founder grants come from private foundations, corporate giving programs, and state or local programs.' } },
    { '@type': 'Question', name: 'Are grants for women founders free to apply to?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Legitimate grant programs are free to apply to and never guarantee an award for a fee. An application fee, a \u201cguaranteed\u201d grant in exchange for payment, or a request for bank details is a red flag.' } },
    { '@type': 'Question', name: 'Do I need to be a registered business to apply for women founder grants?', acceptedAnswer: { '@type': 'Answer', text: 'Usually yes. Most programs require a formed business (LLC, corporation, or sole proprietorship depending on the funder) and majority women ownership. Some programs also require minimum revenue or a minimum number of years operating — check each funder\u2019s rules.' } },
  ],
};

const table = [
  { program: 'WomensNet Amber Grant', amount: '$10,000 monthly; three awarded; monthly winners eligible for $50,000 annual grants', eligibility: 'Women-owned business; US and Canada', frequency: 'Every month', source: 'ambergrantsforwomen.com' },
  { program: 'IFundWomen Universal Grant Application', amount: 'Varies by corporate partner', eligibility: 'Women entrepreneurs in the IFundWomen network', frequency: 'Rolling, partner-dependent', source: 'ifundwomen.com' },
  { program: 'Eileen Fisher Women-Owned Business Grant', amount: '$10,000\u2013$40,000; about $100,000 distributed annually', eligibility: 'Women-owned; 3+ years operating; under $1M revenue', frequency: 'Annual', source: 'eileenfisher.com' },
  { program: 'Tory Burch Foundation Fellows', amount: '$5,000', eligibility: 'Women-founded US business; majority women-owned; $75K+ revenue', frequency: 'Annual', source: 'toryburchfoundation.org' },
  { program: 'Cartier Women\u2019s Initiative', amount: 'Up to $100,000', eligibility: 'Women impact entrepreneurs; for-profit, early-stage', frequency: 'Annual', source: 'cartierwomensinitiative.com' },
];

export default function GrantsForWomenFoundersPage() {
  return (
    <div className="grant-page learn-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="grant-shell">
        <div className="learn-hero">
          <h1>Grants for women founders, verified.</h1>
          <p>The well-known women-founder grants — Amber Grant, IFundWomen, Eileen Fisher, Tory Burch, and Cartier — with the amounts and eligibility rules you need to screen them fast, and the application playbook that actually wins.</p>
        </div>
      </div>

      <div className="learn-prose">
        <h2>The size of the opportunity</h2>
        <p>Women owned <strong>12.9 million nonemployer businesses — 42.3% of the total — with $423.1 billion in receipts</strong>, according to U.S. Census Bureau data released in November 2025. A 2026 Wells Fargo report cited by Forbes puts women&apos;s share of all U.S. businesses above <strong>40%</strong>, employing 12.6 million people and generating <strong>$2.8 trillion in revenue</strong>.</p>
        <p>Yet most of that growth is funded by savings and loans. Direct grants for women founders exist, but they are competitive and concentrated in a handful of programs — so screening on eligibility first is what separates funded applicants from everyone who writes a great essay for a program they never qualified for.</p>

        <h2>The main grants for women founders</h2>
        <table className="learn-table">
          <thead>
            <tr><th>Program</th><th>Amount</th><th>Eligibility</th><th>Cadence</th></tr>
          </thead>
          <tbody>
            {table.map((r) => (
              <tr key={r.program}><td><strong>{r.program}</strong></td><td>{r.amount}</td><td>{r.eligibility}</td><td>{r.frequency}</td></tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: 13, color: '#6b7280' }}>Amounts and eligibility change every cycle — always confirm on the official funder page (listed in the final column) before applying. Source details verified August 2026.</p>

        <h2>The programs, one by one</h2>
        <h3>WomensNet Amber Grant</h3>
        <p><a href="https://www.ambergrantsforwomen.com/get-an-amber-grant" rel="noopener">WomensNet</a> awards <strong>three $10,000 Amber Grants every month</strong> to women-owned businesses, and each monthly winner becomes eligible for one of <strong>three $50,000 annual grants</strong> at year-end. It is free to apply, open to businesses in the United States and Canada, and judges pick winners from a short story-style application each month.</p>
        <h3>IFundWomen Universal Grant Application</h3>
        <p><a href="https://ifundwomen.com/grants/universal-grant-application-0" rel="noopener">IFundWomen</a> maintains one universal application: when the platform partners with a brand, it matches the partner&apos;s grant criteria against businesses in the network. Award amounts vary by partner, and grants are distributed through the network rather than as a single fixed program.</p>
        <h3>Eileen Fisher Women-Owned Business Grant</h3>
        <p>The <a href="https://www.eileenfisher.com/sustainability/women-entrepreneurship" rel="noopener">Eileen Fisher program</a> distributes about <strong>$100,000 per year</strong> in grants ranging from <strong>$10,000 to $40,000</strong> to women-owned businesses that have operated for at least three years with annual revenue under $1 million. Sustainability and environmental practices are the stated focus.</p>
        <h3>Tory Burch Foundation Fellows</h3>
        <p>The <a href="https://www.toryburchfoundation.org/fellows" rel="noopener">Tory Burch Foundation Fellows</a> program awards a <strong>$5,000</strong> grant to women-founded, majority women-owned U.S. businesses generating at least <strong>$75,000 in annual revenue</strong>, alongside a business-education curriculum and access to a network of women entrepreneurs.</p>
        <h3>Cartier Women&apos;s Initiative</h3>
        <p>The <a href="https://www.cartierwomensinitiative.com" rel="noopener">Cartier Women&apos;s Initiative</a> funds women-led, for-profit impact businesses with grants <strong>up to $100,000</strong> per fellow. The 2026 cohort announced in March 2026 included 30 impact entrepreneurs from nine regions plus a thematic award.</p>

        <div className="learn-note">A quick reality check: the <strong>federal government and SBA do not hand most small businesses direct start-up grants</strong>. The SBA states plainly that it does not provide grants for starting or expanding a business — its grants fund nonprofits, Resource Partners, and educational organizations. Women-founder grants overwhelmingly come from private foundations, corporate giving programs, and state or local initiatives. Programs like the Amber Grant and IFundWomen fill that gap.</div>

        <h2>How to apply: the playbook</h2>
        <ol>
          <li><strong>Check hard eligibility before anything else.</strong> Entity type, women-owned percentage, years operating, revenue, and location. If you fail any hard rule, skip it — no amount of writing fixes an ineligible application.</li>
          <li><strong>Keep one reusable applicant profile.</strong> Entity, ownership, revenue, location, and the project you would fund. Reuse verified facts across every application instead of re-entering them.</li>
          <li><strong>Match your ask to the funder&apos;s goals.</strong> Read what the funder says it funds — sustainability, growth, community impact — and write the need statement and budget to that with concrete numbers.</li>
          <li><strong>Verify the deadline on the official page.</strong> Third-party listings go stale. Confirm amount, deadline, and documents on the funder&apos;s own site.</li>
          <li><strong>Apply early and track your queue.</strong> Deadlines cluster. Keep one list of matches with deadlines and status so nothing slips.</li>
        </ol>

        <div className="learn-note">Shinnslist automates steps one through five: it verifies every opportunity against its official source, runs your profile against hard eligibility rules, and keeps your matched queue current — then drafts the application and stops at your approval before anything submits.</div>

        <h2>Red flags in women-founder grant searches</h2>
        <ul>
          <li><strong>Application fees.</strong> Legitimate programs are free to apply to.</li>
          <li><strong>&quot;Guaranteed&quot; awards for payment.</strong> No legitimate funder sells a guarantee.</li>
          <li><strong>&quot;Government grant&quot; lists that ask for bank details.</strong> The SBA does not run a grant program most small businesses can simply sign up for.</li>
          <li><strong>Stale amounts and dead links.</strong> Program details change every cycle; a recycled directory is not a verified opportunity.</li>
        </ul>

        <h2>Frequently asked questions</h2>
        <details>
          <summary>What is the Amber Grant for women?</summary>
          <p>WomensNet awards three $10,000 Amber Grants every month to women-owned businesses, and each monthly winner becomes eligible for one of three $50,000 annual grants at year-end. It is free to apply and open to women-owned businesses in the United States and Canada.</p>
        </details>
        <details>
          <summary>How much can I get from grants for women founders?</summary>
          <p>The most commonly cited programs range from about $5,000 (Tory Burch Foundation Fellows) to $10,000&ndash;$40,000 (Eileen Fisher) and up to $100,000 (Cartier Women&apos;s Initiative). Amounts change every cycle, so confirm on the official funder page.</p>
        </details>
        <details>
          <summary>Does the SBA give grants to women-owned businesses?</summary>
          <p>The SBA does not provide grants for starting or expanding a business. It funds nonprofits, Resource Partners, and educational organizations, and it guarantees loans. Most women-founder grants come from private foundations, corporate giving programs, and state or local programs.</p>
        </details>
        <details>
          <summary>Are grants for women founders free to apply to?</summary>
          <p>Yes. Legitimate grant programs are free to apply to and never guarantee an award for a fee. An application fee, a &quot;guaranteed&quot; grant in exchange for payment, or a request for bank details is a red flag.</p>
        </details>
        <details>
          <summary>Do I need to be a registered business to apply for women founder grants?</summary>
          <p>Usually yes. Most programs require a formed business and majority women ownership. Some programs also require minimum revenue or a minimum number of years operating — check each funder&apos;s rules.</p>
        </details>

        <div style={{ marginTop: 32 }}><Link href="/onboarding" className="grant-button grant-button-dark">Match me to grants I can win <ArrowRight size={17} /></Link></div>
      </div>
    </div>
  );
}
