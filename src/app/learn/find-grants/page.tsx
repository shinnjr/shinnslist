import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'How to find grants you can actually win | Shinnslist',
  description: 'A step-by-step guide to finding grants you are eligible for: the three funder types, where to search, and how to screen for hard eligibility before you write anything.',
};

const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to find grants you can actually win',
  description: 'Find grants by starting from hard eligibility rules, searching the right funder channels, and screening every opportunity before you invest time in an application.',
  step: [
    { '@type': 'HowToStep', name: 'Define your hard eligibility profile', text: 'Write down your entity type, legal location, ownership status, years operating, revenue range, and the exact thing you would fund. These are the filters that eliminate most of the internet immediately.' },
    { '@type': 'HowToStep', name: 'Know the three funder types and where they list', text: 'Government grants live on Grants.gov and state, county, and city sites. Foundations publish on their own sites and in foundation databases. Corporate programs are usually on company giving pages.' },
    { '@type': 'HowToStep', name: 'Screen against hard rules before you write', text: 'For every opportunity, check geography, entity type, and allowed uses first. If you fail any hard rule, skip it — no amount of writing fixes an ineligible application.' },
    { '@type': 'HowToStep', name: 'Confirm the deadline and the source', text: 'Verify the deadline, amount, and requirements on the official funder page, not a third-party listing. Deadlines move and listings go stale.' },
    { '@type': 'HowToStep', name: 'Track everything in one queue', text: 'Keep a single list of matched opportunities with their deadlines, requirements, and status so nothing slips. This is exactly what Shinnslist maintains for you automatically.' },
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Where do I search for grants for free?', acceptedAnswer: { '@type': 'Answer', text: 'Start with Grants.gov for federal opportunities, your state and county economic-development sites for local programs, and the giving pages of large corporations in your industry. Many foundation grants are also free to find through their own websites.' } },
    { '@type': 'Question', name: 'What are the three main types of grant funders?', acceptedAnswer: { '@type': 'Answer', text: 'Government (federal, state, and local), private foundations, and corporate giving programs. Each has different application styles, reporting burdens, and typical award sizes.' } },
    { '@type': 'Question', name: 'How do I know if a grant is a scam?', acceptedAnswer: { '@type': 'Answer', text: 'Legitimate grants are free to apply to and never guarantee you an award for a fee. A request for an application fee or a "guaranteed" grant in exchange for payment is a red flag.' } },
  ],
};

const table = [
  { type: 'Government', where: 'Grants.gov, state/county/city sites', size: 'Largest awards', burden: 'Highest reporting', bestFor: 'Nonprofits, research, infrastructure' },
  { type: 'Foundations', where: 'Foundation sites, databases', size: 'Mid-sized', burden: 'Lighter', bestFor: 'Nonprofits, community programs' },
  { type: 'Corporate', where: 'Company giving pages', size: 'Smaller, more frequent', burden: 'Lowest', bestFor: 'Small businesses, local initiatives' },
];

export default function FindGrantsPage() {
  return (
    <div className="grant-page learn-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="grant-shell">
        <div className="learn-hero">
          <h1>How to find grants you can actually win.</h1>
          <p>Most grant searching wastes time on opportunities you were never eligible for. The fix is to filter on hard rules first, then write. Here is the playbook.</p>
        </div>
      </div>

      <div className="learn-prose">
        <h2>The three funder types</h2>
        <table className="learn-table">
          <thead>
            <tr><th>Funder</th><th>Where to find</th><th>Award size</th><th>Reporting</th><th>Best for</th></tr>
          </thead>
          <tbody>
            {table.map((r) => (
              <tr key={r.type}><td><strong>{r.type}</strong></td><td>{r.where}</td><td>{r.size}</td><td>{r.burden}</td><td>{r.bestFor}</td></tr>
            ))}
          </tbody>
        </table>

        <h2>Find grants: step by step</h2>
        <ol>
          <li><strong>Define your hard eligibility profile.</strong> Entity type, location, ownership, years operating, revenue, and what you would fund. These filters eliminate most of the internet immediately.</li>
          <li><strong>Know the three funder types and where they list.</strong> Federal grants on Grants.gov, state and local programs on government sites, foundation opportunities on their own sites, and corporate programs on company giving pages.</li>
          <li><strong>Screen against hard rules before you write.</strong> Geography, entity type, and allowed uses come first. If you fail any hard rule, skip it — writing cannot fix an ineligible application.</li>
          <li><strong>Confirm the deadline and the source.</strong> Verify amount, deadline, and requirements on the official funder page, not a third-party listing. Deadlines move and listings go stale.</li>
          <li><strong>Track everything in one queue.</strong> One list of matches with deadlines, requirements, and status so nothing slips. This is the queue Shinnslist maintains for you automatically.</li>
        </ol>

        <div className="learn-note">Shinnslist does steps one through five for you: it verifies every opportunity against its official source, runs your profile against hard eligibility rules, and keeps your matched queue current — then drafts the application and stops at your approval.</div>

        <h2>Red flags that keep people chasing grants that do not exist</h2>
        <ul>
          <li><strong>Application fees.</strong> Legitimate grant programs are free to apply to.</li>
          <li><strong>&quot;Guaranteed&quot; awards.</strong> No legitimate funder guarantees you money before reviewing an application.</li>
          <li><strong>Dead links and stale deadlines.</strong> A sign the listing is a recycled directory, not a verified opportunity.</li>
        </ul>

        <h2>Frequently asked questions</h2>
        <details>
          <summary>Where do I search for grants for free?</summary>
          <p>Start with Grants.gov for federal opportunities, your state and county economic-development sites for local programs, and the giving pages of large corporations in your industry. Many foundation grants are also free to find through their own websites.</p>
        </details>
        <details>
          <summary>What are the three main types of grant funders?</summary>
          <p>Government (federal, state, and local), private foundations, and corporate giving programs. Each has different application styles, reporting burdens, and typical award sizes.</p>
        </details>
        <details>
          <summary>How do I know if a grant is a scam?</summary>
          <p>Legitimate grants are free to apply to and never guarantee you an award for a fee. A request for an application fee or a &quot;guaranteed&quot; grant in exchange for payment is a red flag.</p>
        </details>

        <div style={{ marginTop: 32 }}><Link href="/onboarding" className="grant-button grant-button-dark">Find grants I can win <ArrowRight size={17} /></Link></div>
      </div>
    </div>
  );
}
