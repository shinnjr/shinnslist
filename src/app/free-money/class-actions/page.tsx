import type { Metadata } from 'next';
import { ArrowRight, Scale, ShieldCheck, FileCheck2, Mail } from 'lucide-react';
import { classActionSources } from '@/data/free-money';
import { classActions } from '@/data/classActions';
import { classActionDfyItem, fmtCents, fmtMinutes } from '@/lib/dfy';
import DfyButton from '@/components/DfyButton';

export const metadata: Metadata = {
  title: 'Class-action settlements — check if you’re owed and file free | Shinnslist',
  description: 'When a company settles a lawsuit, the people affected may be owed a payment. Find open settlements and file your claim free. Filing a settlement claim yourself always costs nothing — Shinnslist also offers an optional done-for-you filing service for a disclosed flat fee.',
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Does filing a class-action claim cost money?', acceptedAnswer: { '@type': 'Answer', text: 'No. Filing a class-action settlement claim yourself is free. You file directly with the settlement administrator at no cost. Optional convenience services exist that prepare and file the paperwork for you for a disclosed fee, but you never have to use one.' } },
    { '@type': 'Question', name: 'How do I know if I am eligible for a settlement?', acceptedAnswer: { '@type': 'Answer', text: 'You typically receive a mailed or emailed notice if records show you are a class member. You can also search open settlements on an aggregator and read the class definition — if your situation matches, you can file.' } },
    { '@type': 'Question', name: 'How much do class-action settlements pay?', acceptedAnswer: { '@type': 'Answer', text: 'It varies widely — from a few dollars to hundreds or more, depending on the fund size, the number of claimants, and your documented losses.' } },
    { '@type': 'Question', name: 'Will someone ask me to pay to file a claim?', acceptedAnswer: { '@type': 'Answer', text: 'No legitimate settlement requires payment to file. Filing yourself is always free. Some services charge an optional disclosed convenience fee to complete and file the paperwork for you — that is a choice, never a requirement, and no one may take a cut of your settlement. Never pay anyone who says payment is required to file or who asks for a percentage of your payout.' } },
  ],
};

function daysLeft(d: string): number | null {
  const m = d.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!m) return null;
  let yy = parseInt(m[3], 10);
  yy = yy < 100 ? yy + 2000 : yy;
  const target = new Date(yy, parseInt(m[1], 10) - 1, parseInt(m[2], 10)).getTime();
  const now = Date.now();
  return Math.ceil((target - now) / 86400000);
}

export default function ClassActionsPage() {
  return (
    <div className="grant-page learn-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="grant-shell">
        <div className="learn-hero">
          <h1>If a company settled, you may be owed money.</h1>
          <p>When a company loses a class-action lawsuit, it funds a settlement for the people affected — and billions go unclaimed every year because people never file. Filing yourself is always free. In a hurry? We&apos;ll prepare and file it for you for a disclosed flat fee based on the work involved — never a cut of your payout.</p>
        </div>

        <div className="learn-prose" style={{ marginTop: 28 }}>
          <h2>{classActions.length} open settlements — file before the deadline</h2>
          <p>Updated daily. Click any settlement to open its official claim site and file free. Soonest deadline first — the &quot;ending soon&quot; ones close fast. The time and price shown is our optional done-for-you service.</p>

          <div style={{ maxHeight: 760, overflowY: 'auto', border: '1px solid #e2ece6', borderRadius: 12, background: '#fff' }}>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {classActions.map((c) => {
                const dl = daysLeft(c.deadline);
                const soon = dl !== null && dl >= 0 && dl <= 14;
                const item = classActionDfyItem(c.slug, c.name, c.description, c.proof, c.payout);
                return (
                  <li key={c.slug} style={{ borderBottom: '1px solid #eef4f0', padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <a href={c.claim_url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: '#0b3d29', textDecoration: 'none', fontSize: 15 }}>
                        {c.name}
                      </a>
                      {c.description ? <p style={{ margin: '4px 0 0', color: '#55665c', fontSize: 13, lineHeight: 1.45 }}>{c.description}</p> : null}
                      <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#0b7a4b', fontWeight: 700 }}>{c.payout}</span>
                        <span style={{ fontSize: 12, color: '#55665c' }}>· {fmtMinutes(item.estMinutes)} to file · proof {c.proof === 'No' ? 'not required' : 'may be required'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {c.deadline !== 'Varies' ? (
                        <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 9px', borderRadius: 999, background: soon ? '#fdeaea' : '#eef4f0', color: soon ? '#b42318' : '#55665c' }}>
                          {soon ? 'Ending soon · ' : 'Deadline '}{c.deadline}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 9px', borderRadius: 999, background: '#f4f8f5', color: '#55665c' }}>Deadline varies</span>
                      )}
                      <DfyButton item={item} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <p style={{ marginTop: 12, fontSize: 13, color: '#55665c' }}>
            Every claim on this page can be filed yourself for free from its official site. Our &quot;we&apos;ll file it&quot; price is a convenience fee for us to prepare and file it for you ({fmtCents(900)}–{fmtCents(3900)} depending on the form). Shinnslist is not a law firm, we take no cut of any settlement, and the claim is always yours.
          </p>
        </div>

        <div className="learn-prose" style={{ marginTop: 40 }}>
          <h2>More places to check</h2>
          <div className="learn-grid">
            {classActionSources.map((s) => (
              <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="learn-card">
                <Scale size={24} color="#087a55" />
                <h2>{s.name}</h2>
                <p>{s.detail}</p>
                <span className="grant-button grant-button-dark" style={{ alignSelf: 'flex-start', marginTop: 6 }}>Check settlements <ArrowRight size={16} /></span>
              </a>
            ))}
          </div>
        </div>

        <div className="learn-prose">
          <h2>How filing a claim works</h2>
          <div className="learn-grid">
            <div className="learn-card">
              <Mail size={22} color="#087a55" />
              <h2>1. Find the notice</h2>
              <p>If records show you&apos;re a class member, you&apos;ll get a mailed or emailed notice naming the administrator and the official claim site. Did you find one here instead? You can file anyway — the administrator checks your eligibility against the class records.</p>
            </div>
            <div className="learn-card">
              <FileCheck2 size={22} color="#087a55" />
              <h2>2. File the claim</h2>
              <p>Complete the claim form on the official administrator site with your details and any proof of purchase or losses. It takes minutes and costs nothing. File only claims you genuinely qualify for — false claims are perjury, and we&apos;ll never file one for you.</p>
            </div>
            <div className="learn-card">
              <ShieldCheck size={22} color="#087a55" />
              <h2>3. You never HAVE to pay</h2>
              <p>Filing is free, always. Our optional done-for-you service prepares and files the paperwork for a disclosed fee — your choice, never a requirement, and we never take a percentage of what you recover.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="learn-faq">
        <h2 style={{ fontSize: 26 }}>Frequently asked questions</h2>
        <details open>
          <summary>Does filing a class-action claim cost money?</summary>
          <p>No. Filing a class-action settlement claim yourself is free. You file directly with the settlement administrator at no cost. Optional convenience services exist that prepare and file the paperwork for you for a disclosed fee, but you never have to use one.</p>
        </details>
        <details>
          <summary>How do I know if I am eligible for a settlement?</summary>
          <p>You typically receive a mailed or emailed notice if records show you are a class member. You can also search open settlements on an aggregator and read the class definition — if your situation matches, you can file.</p>
        </details>
        <details>
          <summary>How much do class-action settlements pay?</summary>
          <p>It varies widely — from a few dollars to hundreds or more, depending on the fund size, the number of claimants, and your documented losses. The class definition and notice spell out the payment terms.</p>
        </details>
        <details>
          <summary>Will someone ask me to pay to file a claim?</summary>
          <p>No legitimate settlement requires payment to file. Filing yourself is always free. Some services charge an optional disclosed convenience fee to complete and file the paperwork for you — that is a choice, never a requirement, and no one may take a cut of your settlement. Never pay anyone who says payment is required to file or who asks for a percentage of your payout.</p>
        </details>
      </div>
    </div>
  );
}
