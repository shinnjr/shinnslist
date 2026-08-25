import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'How to write a grant application that wins | Shinnslist',
  description: 'The seven-part grant proposal structure funders actually score: need statement, measurable goals, budget, capacity, and sustainability — with a checklist.',
};

const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to write a grant application that wins',
  description: 'Write a competitive grant application by structuring your proposal around the parts funders actually score: need, goals, budget, capacity, and sustainability.',
  step: [
    { '@type': 'HowToStep', name: 'Read the full request for proposals', text: 'Find every requirement, scoring rubric, deadline, and attachment. Funders score against their own criteria — write to the rubric, not a template.' },
    { '@type': 'HowToStep', name: 'Write the need statement', text: 'State the specific problem, who it affects, and the evidence behind it. Ground it in real data about the community you serve, not generalities.' },
    { '@type': 'HowToStep', name: 'Set measurable goals and objectives', text: 'Describe exactly what will change, by how much, and by when. Funders fund outcomes they can measure and report on.' },
    { '@type': 'HowToStep', name: 'Build a budget that matches the narrative', text: 'Every line item should trace to an activity in your proposal. Round numbers and vague "miscellaneous" categories weaken the application.' },
    { '@type': 'HowToStep', name: 'Show capacity and sustainability', text: 'Prove your team can deliver, and explain how the work continues after the grant ends. Funders avoid projects that die when the money stops.' },
    { '@type': 'HowToStep', name: 'Proof against the rubric, then get a human sign-off', text: 'Check every requirement is met and nothing is fabricated. Approve the exact submission before it goes out — never auto-submit.' },
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'What are the main parts of a grant proposal?', acceptedAnswer: { '@type': 'Answer', text: 'A need statement, measurable goals and objectives, a budget that matches the narrative, a description of your organization, and a plan for capacity and sustainability. Funders score each part against their own rubric.' } },
    { '@type': 'Question', name: 'How long should a grant application be?', acceptedAnswer: { '@type': 'Answer', text: 'Exactly as long as the funder requests — no more, no less. Answer every prompt directly and respect word and page limits; reviewers penalize padding and missing sections alike.' } },
    { '@type': 'Question', name: 'Can AI write my grant application for me?', acceptedAnswer: { '@type': 'Answer', text: 'AI is excellent at drafting structure and reusing verified facts, but it must never invent numbers or claims. The strongest applications pair AI drafting with a human who verifies every fact and signs off before submission.' } },
  ],
};

const rubric = [
  { section: 'Need statement', what: 'A specific problem with evidence', why: 'Shows the funder the money fixes a real gap' },
  { section: 'Goals & objectives', what: 'Measurable outcomes with a timeline', why: 'Funders fund results they can report' },
  { section: 'Budget', what: 'Every dollar tied to an activity', why: 'Proves the request is real and deliberate' },
  { section: 'Capacity', what: 'Team and track record', why: 'Shows you can deliver' },
  { section: 'Sustainability', what: 'Plan beyond the grant period', why: 'Avoids projects that die when money stops' },
];

export default function WriteGrantPage() {
  return (
    <div className="grant-page learn-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="grant-shell">
        <div className="learn-hero">
          <h1>How to write a grant application that wins.</h1>
          <p>Funders score against a rubric, not a vibe. Here is the structure they actually grade — and how to build each part without inventing anything.</p>
        </div>
      </div>

      <div className="learn-prose">
        <h2>What funders actually score</h2>
        <table className="learn-table">
          <thead>
            <tr><th>Section</th><th>What it needs</th><th>Why it matters</th></tr>
          </thead>
          <tbody>
            {rubric.map((r) => (
              <tr key={r.section}><td><strong>{r.section}</strong></td><td>{r.what}</td><td>{r.why}</td></tr>
            ))}
          </tbody>
        </table>

        <h2>Write the application: step by step</h2>
        <ol>
          <li><strong>Read the full request for proposals.</strong> Every requirement, scoring rubric, deadline, and attachment. Write to the rubric, not a template.</li>
          <li><strong>Write the need statement.</strong> The specific problem, who it affects, and the evidence. Ground it in real data about the community you serve — not generalities.</li>
          <li><strong>Set measurable goals and objectives.</strong> Exactly what will change, by how much, and by when. Funders fund outcomes they can measure and report on.</li>
          <li><strong>Build a budget that matches the narrative.</strong> Every line item traces to an activity in your proposal. Round numbers and vague categories weaken the application.</li>
          <li><strong>Show capacity and sustainability.</strong> Prove your team can deliver, and explain how the work continues after the grant ends.</li>
          <li><strong>Proof against the rubric, then get a human sign-off.</strong> Confirm every requirement is met and nothing is fabricated, then approve the exact submission before it goes out.</li>
        </ol>

        <div className="learn-note">Shinnslist drafts each section from your verified facts and prior narratives, keeps any missing detail visibly blank instead of inventing it, and stops at your approval — so the finished application is fast to review and safe to submit.</div>

        <h2>Frequently asked questions</h2>
        <details>
          <summary>What are the main parts of a grant proposal?</summary>
          <p>A need statement, measurable goals and objectives, a budget that matches the narrative, a description of your organization, and a plan for capacity and sustainability. Funders score each part against their own rubric.</p>
        </details>
        <details>
          <summary>How long should a grant application be?</summary>
          <p>Exactly as long as the funder requests — no more, no less. Answer every prompt directly and respect word and page limits; reviewers penalize padding and missing sections alike.</p>
        </details>
        <details>
          <summary>Can AI write my grant application for me?</summary>
          <p>AI is excellent at drafting structure and reusing verified facts, but it must never invent numbers or claims. The strongest applications pair AI drafting with a human who verifies every fact and signs off before submission.</p>
        </details>

        <div style={{ marginTop: 32 }}><Link href="/onboarding" className="grant-button grant-button-dark">Start my application <ArrowRight size={17} /></Link></div>
      </div>
    </div>
  );
}
