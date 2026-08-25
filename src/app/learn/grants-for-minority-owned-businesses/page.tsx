import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Grants for minority-owned small businesses: what actually exists in 2026 | Shinnslist',
  description: 'The real grants for minority-owned small businesses in 2026 — SBA facts, the 2024–2026 MBDA and 8(a) rule changes, STEP, SBIR/STTR, and corporate programs — with eligibility, verified amounts, and the application playbook.',
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Grants for minority-owned small businesses: what actually exists in 2026',
  description: 'A verified rundown of grants and programs relevant to minority-owned small businesses — SBIR/STTR, STEP, SBA manufacturing grants, Amber Grant, IFundWomen, MBDA, and 8(a) — including the 2024–2026 rule changes that removed racial and ethnic presumptions, with eligibility, amounts, and a step-by-step application playbook.',
  dateModified: '2026-08-16',
  publisher: { '@type': 'Organization', name: 'Shinnslist' },
};

const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to apply for grants as a minority-owned small business',
  description: 'Apply for grants as a minority-owned business by checking hard eligibility first, understanding which ownership definition the program uses, separating grants from certifications and loans, and verifying every deadline on the official source.',
  step: [
    { '@type': 'HowToStep', name: 'Check hard eligibility before anything else', text: 'Entity type, ownership percentage, years operating, revenue range, and location. Every program defines "minority-owned" differently — some use a 51% ownership rule, some require a certification, and some use self-attestation. Skip programs you fail; no application fixes an ineligible one.' },
    { '@type': 'HowToStep', name: 'Know whether the program is a grant, a certification, or a loan', text: 'Federal contracting certifications such as 8(a) and HUBZone are not cash grants, but they unlock set-aside contracts worth more than most grants. Loans are not grants. Match your goal to the right instrument before spending time on applications.' },
    { '@type': 'HowToStep', name: 'Keep one reusable applicant profile', text: 'A single profile with your entity, ownership structure, revenue, location, and the project you want funded lets you reuse verified facts across every application instead of re-entering them.' },
    { '@type': 'HowToStep', name: 'Match your ask to the funder\u2019s stated goals', text: 'Read what the funder says it funds — export growth, R&D, manufacturing, community impact — and write the need statement and budget to that, with concrete numbers and a clear use of funds.' },
    { '@type': 'HowToStep', name: 'Verify the deadline and requirements on the official page', text: 'Third-party listings go stale. Confirm amount, deadline, and documents on the funder\u2019s own site before submitting, and keep one queue of matched programs with deadlines and status.' },
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Does the federal government give grants to minority-owned small businesses?', acceptedAnswer: { '@type': 'Answer', text: 'Rarely as direct cash. The SBA states plainly that it does not provide grants for starting or expanding a business; its grants fund nonprofits, Resource Partners, and educational organizations. The main federal grants small businesses can win directly are SBIR and STTR for scientific research and development, plus state-level programs such as STEP for export growth. Most other "minority business grants" come from corporate and foundation programs.' } },
    { '@type': 'Question', name: 'What changed for minority business programs in 2024\u20132026?', acceptedAnswer: { '@type': 'Answer', text: 'Federal court rulings struck down race-based presumptions in business-assistance programs. The Minority Business Development Agency removed its list of racial and ethnic presumptions effective January 15, 2025 (89 FR 101466), and the SBA published a final rule on August 11, 2026, effective September 10, 2026, that removes the 8(a) program\u2019s rebuttable presumption of social disadvantage for individually owned firms (91 FR 51568). Entity-owned firms \u2014 tribes, Alaska Native Corporations, Native Hawaiian Organizations, and Community Development Corporations \u2014 are not affected. Individuals must now demonstrate social disadvantage under revised standards.' } },
    { '@type': 'Question', name: 'Is the 8(a) program a grant?', acceptedAnswer: { '@type': 'Answer', text: 'No. The SBA 8(a) Business Development program is a federal contracting certification that makes certified firms eligible for set-aside contracts, not a cash grant. The federal government targets at least 23% of federal contracting dollars to small businesses through programs including 8(a), HUBZone, and WOSB.' } },
    { '@type': 'Question', name: 'Are grants for minority-owned businesses free to apply to?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Legitimate grant programs are free to apply to and never guarantee an award for a fee. An application fee, a "guaranteed" grant in exchange for payment, or a request for bank details is a red flag. The SBA only communicates from email addresses ending in @sba.gov.' } },
    { '@type': 'Question', name: 'What does "minority-owned" mean for grant eligibility?', acceptedAnswer: { '@type': 'Answer', text: 'It depends on the program. Corporate and foundation programs typically require majority ownership (often 51%) by one or more people in a designated group and may use self-attestation. Federal programs historically used presumptions tied to group membership; after the 2024\u20132026 rule changes, applicants to 8(a) must demonstrate social disadvantage individually and meet economic-disadvantage standards. Always read the specific ownership and certification rules for each program.' } },
    { '@type': 'Question', name: 'Are there grants for minority women founders?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Programs like the WomensNet Amber Grant ($10,000 monthly) and the IFundWomen universal application are open to women-owned businesses, including women of color, and some corporate-partner cycles specifically target underrepresented founders. See our verified guide to grants for women founders for the full rundown.' } },
  ],
};

const table = [
  { program: 'SBIR / STTR (federal R&D grants)', amount: 'Phased awards; amounts vary by agency and phase', eligibility: 'For-profit small business doing scientific R&D with commercialization potential', frequency: 'Multiple solicitations per year', source: 'sbir.gov' },
  { program: 'SBA STEP (state export grants)', amount: 'State-level awards; e.g., Colorado $900,000 in FY24', eligibility: 'Established US small business seeking export growth; apply through your state\u2019s STEP awardee', frequency: 'Annual', source: 'sba.gov' },
  { program: 'SBA E2G Manufacturing grants', amount: 'Varies; funds organizations that train small manufacturers', eligibility: 'Organizations providing hands-on manufacturing training; current cycle closed', frequency: 'Cycle-based', source: 'sba.gov' },
  { program: 'WomensNet Amber Grant', amount: '$10,000 monthly; three awarded; monthly winners eligible for $50,000 annual grants', eligibility: 'Women-owned business; US and Canada — includes women of color; not minority-exclusive', frequency: 'Every month', source: 'ambergrantsforwomen.com' },
  { program: 'IFundWomen Universal Grant Application', amount: 'Varies by corporate partner', eligibility: 'Women entrepreneurs in the IFundWomen network; partner criteria vary', frequency: 'Rolling, partner-dependent', source: 'ifundwomen.com' },
  { program: 'MBDA programs (Minority Business Development Agency)', amount: 'Technical assistance and grants; no direct cash grants to businesses', eligibility: 'Minority-owned businesses receive services; grant funding goes to organizations', frequency: 'Ongoing', source: 'mbda.gov' },
  { program: 'SBA 8(a) certification (not a grant)', amount: 'No cash; access to federal set-aside contracts', eligibility: 'Small business owned by socially and economically disadvantaged individuals; individual disadvantage must now be demonstrated', frequency: 'Rolling', source: 'sba.gov' },
];

export default function GrantsForMinorityOwnedPage() {
  return (
    <div className="grant-page learn-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="grant-shell">
        <div className="learn-hero">
          <h1>Grants for minority-owned small businesses, verified.</h1>
          <p>The honest 2026 picture: the programs that actually exist — SBIR/STTR, STEP, SBA manufacturing grants, MBDA, Amber Grant, and IFundWomen — the 2024–2026 rule changes that reshaped race-based programs, and the eligibility screen that separates funded applicants from wasted essays.</p>
        </div>
      </div>

      <div className="learn-prose">
        <h2>The reality check first</h2>
        <p>Most &quot;grants for minority-owned businesses&quot; you will find in search results are recycled lists. The verified facts are narrower and more useful:</p>
        <ul>
          <li><strong>The SBA does not provide grants for starting or expanding a business.</strong> Its own grants page says so plainly: SBA grants fund nonprofits, Resource Partners, and educational organizations, plus a handful of program areas — scientific R&amp;D (SBIR/STTR), manufacturing (the E2G grant), and exporting (STEP).</li>
          <li><strong>Federal money for minority-owned businesses is concentrated in contracting, not cash grants.</strong> The federal government targets <strong>at least 23% of all federal contracting dollars</strong> to small businesses through programs including 8(a), HUBZone, and WOSB.</li>
          <li><strong>The rules changed in 2024–2026.</strong> After federal court rulings, race-based presumptions were removed from MBDA and SBA 8(a) programs. Eligibility now turns on individual demonstration and economic-disadvantage standards, not group membership. Details below.</li>
          <li><strong>Most actual cash grants come from corporate and foundation programs</strong> — and most of the well-known ones are women-focused programs that minority women founders are eligible for, not minority-exclusive programs.</li>
        </ul>

        <h2>What actually exists for minority-owned businesses in 2026</h2>
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
        <p style={{ fontSize: 13, color: '#6b7280' }}>Amounts and eligibility change every cycle — always confirm on the official funder page (final column) before applying. Source details verified August 2026.</p>

        <h2>The programs, one by one</h2>
        <h3>SBIR and STTR — the main federal grants small businesses can win directly</h3>
        <p>The <a href="https://www.sbir.gov" rel="noopener">Small Business Innovation Research (SBIR) and Small Business Technology Transfer (STTR)</a> programs are the federal government&apos;s primary grants for for-profit small businesses: they fund scientific research and development with commercialization potential, in phases with increasing award sizes. Minority-owned firms are eligible like any small business; the qualification bar is the research, not the ownership. Solicitations run multiple times per year across eleven participating agencies.</p>
        <h3>STEP — state export grants with real money behind them</h3>
        <p>The SBA&apos;s <a href="https://www.sba.gov/funding-programs/grants" rel="noopener">State Trade Expansion Program (STEP)</a> gives financial awards to state and territory governments, which in turn help small businesses pay for export activities — trade missions, trade-show exhibits, translation, and export training. Awards are real and public: <strong>Colorado received $900,000 in FY24</strong>, for example, and California, Michigan, Montana, North Carolina, New York, and Virginia each received $900,000. You apply through your state&apos;s STEP awardee, not SBA directly, and the program targets established businesses looking to grow exports.</p>
        <h3>SBA E2G Manufacturing grants</h3>
        <p>The <a href="https://www.sba.gov/funding-programs/grants" rel="noopener">Empower To Grow (E2G) Manufacturing in America grant</a> funds organizations that provide hands-on, in-person manufacturing training and technical assistance to small manufacturers — operating machinery, quality control, industrial software, and workplace safety. It is a grant for training providers, not a direct cash grant to an individual business, and the current application cycle is closed with awards to be announced.</p>
        <h3>WomensNet Amber Grant</h3>
        <p><a href="https://www.ambergrantsforwomen.com/get-an-amber-grant" rel="noopener">WomensNet</a> awards <strong>three $10,000 Amber Grants every month</strong> to women-owned businesses, and each monthly winner becomes eligible for one of <strong>three $50,000 annual grants</strong>. It is free to apply and open to women-owned businesses in the United States and Canada — including women of color. It is not a minority-exclusive program, but it is one of the most accessible cash grants for minority women founders.</p>
        <h3>IFundWomen Universal Grant Application</h3>
        <p><a href="https://ifundwomen.com/grants/universal-grant-application-0" rel="noopener">IFundWomen</a> keeps one universal application and matches it against corporate-partner grant criteria, so the award amounts vary by partner and cycle. Partner rounds have historically included cycles aimed at underrepresented founders. It is worth one application that stays on file rather than a per-grant scramble.</p>
        <h3>MBDA — the federal agency for minority business development</h3>
        <p>The <a href="https://www.mbda.gov" rel="noopener">Minority Business Development Agency (MBDA)</a>, part of the U.S. Department of Commerce, is the federal agency focused on minority-owned businesses. Its programs provide technical assistance and business development support through funded centers and ecosystem grants — MBDA does not hand cash grants directly to individual businesses. After the 2024 ruling in <em>Nuziard v. MBDA</em>, the agency removed its list of racial and ethnic presumptions, effective January 15, 2025, so its programs now serve all businesses while keeping its minority-business development mission. Check mbda.gov for the current program footprint.</p>
        <h3>SBA 8(a) — a certification, not a grant, and it just changed</h3>
        <p>The <a href="https://www.sba.gov/federal-contracting/contracting-assistance-programs/8a-business-development-program" rel="noopener">8(a) Business Development program</a> is a federal contracting certification that makes certified firms eligible for set-aside contracts — no cash changes hands, but contracts can be worth far more than typical grants. On <strong>August 11, 2026, SBA published a final rule (91 FR 51568) that removes the 8(a) program&apos;s rebuttable presumption of social disadvantage for individually owned firms</strong>, effective September 10, 2026. Entity-owned firms — tribes, Alaska Native Corporations, Native Hawaiian Organizations, and Community Development Corporations — are not affected. Individual applicants must now demonstrate social disadvantage under revised standards.</p>

        <div className="learn-note">A quick reality check: the <strong>federal government and SBA do not hand most small businesses direct start-up grants</strong>. The SBA states plainly that it does not provide grants for starting or expanding a business — its grants fund nonprofits, Resource Partners, and educational organizations, with the main business-facing exceptions being SBIR/STTR for R&amp;D and state STEP grants for exporters. Corporate and foundation programs like the Amber Grant and IFundWomen fill the gap for minority-owned businesses, and federal contracting certifications like 8(a), HUBZone, and WOSB are often worth more than any grant.</div>

        <h2>The 2024–2026 changes every minority-owned business should know</h2>
        <p>Federal court rulings in 2024 struck down race-based presumptions in business-assistance programs. The consequences, both now final:</p>
        <ul>
          <li><strong>MBDA removed its racial and ethnic presumptions effective January 15, 2025</strong> (89 FR 101466), following <em>Nuziard v. MBDA</em>.</li>
          <li><strong>SBA&apos;s 8(a) final rule (91 FR 51568)</strong>, published August 11, 2026 and effective September 10, 2026, removes the rebuttable presumption of social disadvantage for individually owned firms and sets revised standards for individuals establishing social disadvantage. Entity-owned firms are explicitly unaffected.</li>
          <li><strong>Practical impact:</strong> eligibility for these programs now rests on individual demonstration plus economic-disadvantage standards rather than group membership. Certifications and set-asides remain available, but the paperwork changed — read the current rules on sba.gov before applying.</li>
        </ul>

        <h2>Not grants, but worth more than most grants</h2>
        <p>The most valuable federal programs for minority-owned businesses are often <strong>certifications, not cash grants</strong>: <strong>8(a)</strong> for socially and economically disadvantaged owners, <strong>HUBZone</strong> for businesses in historically underutilized business zones, and <strong>WOSB/EDWOSB</strong> for women-owned businesses. Together they support the federal goal of directing <strong>at least 23% of federal contracting dollars</strong> to small businesses. In the private sector, large corporate buyers and supplier-diversity programs frequently look for certifications such as MBE or DBE status when awarding supplier contracts — a certification can produce recurring revenue that no one-time grant matches.</p>

        <h2>How to apply: the playbook</h2>
        <ol>
          <li><strong>Check hard eligibility before anything else.</strong> Entity type, ownership percentage, years operating, revenue, and location. Every program defines &quot;minority-owned&quot; differently — a 51% ownership rule, a required certification, or self-attestation. If you fail any hard rule, skip it.</li>
          <li><strong>Know whether the program is a grant, a certification, or a loan.</strong> 8(a), HUBZone, and WOSB are certifications that unlock contracts; they are not cash. Loans are not grants. Match your goal to the right instrument.</li>
          <li><strong>Keep one reusable applicant profile.</strong> Entity, ownership, revenue, location, and the project you would fund. Reuse verified facts across every application instead of re-entering them.</li>
          <li><strong>Match your ask to the funder&apos;s goals.</strong> Export growth, R&amp;D, manufacturing, or community impact — write the need statement and budget to what the funder says it funds, with concrete numbers.</li>
          <li><strong>Verify the deadline on the official page.</strong> Third-party listings go stale. Confirm amount, deadline, and documents on the funder&apos;s own site, then track your matched queue so nothing slips.</li>
        </ol>

        <div className="learn-note">Shinnslist automates steps one through five: it verifies every opportunity against its official source, runs your profile against hard eligibility rules, and keeps your matched queue current — then drafts the application and stops at your approval before anything submits.</div>

        <h2>Red flags in minority-business grant searches</h2>
        <ul>
          <li><strong>Application fees.</strong> Legitimate programs are free to apply to.</li>
          <li><strong>&quot;Guaranteed&quot; awards for payment.</strong> No legitimate funder sells a guarantee.</li>
          <li><strong>&quot;Minority grant&quot; lists that ask for bank details.</strong> The SBA does not run a sign-up grant program, and it only emails from <strong>@sba.gov</strong> addresses.</li>
          <li><strong>Stale amounts and dead links.</strong> Program details change every cycle; a recycled directory is not a verified opportunity.</li>
          <li><strong>Outdated rule claims.</strong> Anything describing 8(a) or MBDA eligibility using the old group-based presumptions is pre-2025 information.</li>
        </ul>

        <h2>Frequently asked questions</h2>
        <details>
          <summary>Does the federal government give grants to minority-owned small businesses?</summary>
          <p>Rarely as direct cash. The SBA states plainly that it does not provide grants for starting or expanding a business; its grants fund nonprofits, Resource Partners, and educational organizations. The main federal grants small businesses can win directly are SBIR and STTR for scientific R&amp;D, plus state-level programs such as STEP for export growth. Most other &quot;minority business grants&quot; come from corporate and foundation programs.</p>
        </details>
        <details>
          <summary>What changed for minority business programs in 2024&ndash;2026?</summary>
          <p>Federal court rulings struck down race-based presumptions in business-assistance programs. MBDA removed its list of racial and ethnic presumptions effective January 15, 2025 (89 FR 101466), and SBA published a final rule on August 11, 2026, effective September 10, 2026, removing the 8(a) rebuttable presumption of social disadvantage for individually owned firms (91 FR 51568). Entity-owned firms — tribes, Alaska Native Corporations, Native Hawaiian Organizations, and Community Development Corporations — are unaffected. Individuals must now demonstrate social disadvantage under revised standards.</p>
        </details>
        <details>
          <summary>Is the 8(a) program a grant?</summary>
          <p>No. The SBA 8(a) Business Development program is a federal contracting certification that makes certified firms eligible for set-aside contracts, not a cash grant. The federal government targets at least 23% of federal contracting dollars to small businesses through programs including 8(a), HUBZone, and WOSB.</p>
        </details>
        <details>
          <summary>Are grants for minority-owned businesses free to apply to?</summary>
          <p>Yes. Legitimate grant programs are free to apply to and never guarantee an award for a fee. An application fee, a &quot;guaranteed&quot; grant in exchange for payment, or a request for bank details is a red flag. The SBA only communicates from email addresses ending in @sba.gov.</p>
        </details>
        <details>
          <summary>What does &quot;minority-owned&quot; mean for grant eligibility?</summary>
          <p>It depends on the program. Corporate and foundation programs typically require majority ownership (often 51%) by one or more people in a designated group and may use self-attestation. Federal programs historically used presumptions tied to group membership; after the 2024&ndash;2026 rule changes, applicants to 8(a) must demonstrate social disadvantage individually and meet economic-disadvantage standards. Always read the specific ownership and certification rules for each program.</p>
        </details>
        <details>
          <summary>Are there grants for minority women founders?</summary>
          <p>Yes. Programs like the WomensNet Amber Grant ($10,000 monthly) and the IFundWomen universal application are open to women-owned businesses, including women of color, and some corporate-partner cycles specifically target underrepresented founders. See our <Link href="/learn/grants-for-women-founders">verified guide to grants for women founders</Link> for the full rundown.</p>
        </details>

        <h2>Sources</h2>
        <ul>
          <li>SBA — Grants overview (sba.gov/funding-programs/grants): SBA&apos;s grant areas and the &quot;no grants for starting or expanding&quot; statement</li>
          <li>SBA — Certifications overview (sba.gov/federal-contracting): 8(a), HUBZone, WOSB and the 23% federal contracting goal</li>
          <li>Federal Register, 89 FR 101466 — MBDA final rule removing racial and ethnic presumptions (effective January 15, 2025)</li>
          <li>Federal Register, 91 FR 51568 — SBA final rule removing the 8(a) rebuttable presumption of social disadvantage for individually owned firms (published August 11, 2026; effective September 10, 2026)</li>
          <li>WomensNet — Amber Grant program details; IFundWomen — Universal Grant Application</li>
        </ul>
        <p>Related guides: <Link href="/learn/find-grants">How to find grants you can actually win</Link> · <Link href="/learn/grants-for-women-founders">Grants for women founders</Link> · <Link href="/learn/write-grant-application">How to write a grant application that wins</Link></p>

        <div style={{ marginTop: 32 }}><Link href="/onboarding" className="grant-button grant-button-dark">Match me to grants I can win <ArrowRight size={17} /></Link></div>
      </div>
    </div>
  );
}
