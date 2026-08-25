import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Shinnslist',
  description: 'How Shinnslist collects, uses, and may share your grant-application profile data.',
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <div className="legal-wrap">
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: August 15, 2026</p>

        <h2>1. What we collect</h2>
        <p>To find grants, benefits, and assistance you qualify for, Shinnslist collects the information you provide in your profile. This may include your name, date of birth, address, city, state, ZIP code, household size, income range, employment status, education, gender, race/ethnicity, veteran and disability status, immigration status, and the types of help you need (education, housing, transportation, food, utilities, medical, childcare, elder care, home repair, emergency, or business).</p>
        <p>We <strong>never</strong> collect your Social Security number, EIN, bank account details, or signature during profile creation. Those are requested only by a specific funder on its own secure application form, at the moment of submission, and never by Shinnslist itself.</p>

        <h2>2. How we use it</h2>
        <p>We use your profile to (a) determine which grants, benefits, and assistance programs you may qualify for, (b) prefill applications so you can review, edit, and submit them faster, and (c) draft responses tailored to each funder&apos;s requirements.</p>

        <h2>3. Sharing and selling of information</h2>
        <p>Shinnslist is a free service. To fund the service without charging you, we may share or sell your profile information to vetted third parties, including funders, researchers, and data partners, consistent with applicable law. When we share data, we take reasonable steps to do so in a manner consistent with this policy and with your consent.</p>
        <p>You consent to this sharing when you check the consent box during signup. You may withdraw consent and opt out at any time; doing so may limit your use of the free service but will not affect any application you have already submitted.</p>

        <h2>4. Your choices</h2>
        <p>You may review, edit, or delete your profile at any time from your account settings. You may opt out of data sharing by contacting us. We retain edits you make to your profile as part of our records.</p>

        <h2>5. Security</h2>
        <p>We use industry-standard safeguards to protect your information in transit and at rest, and we limit access to authorized personnel and systems. No method of transmission or storage is 100% secure, and we cannot guarantee absolute security.</p>

        <h2>6. Contact</h2>
        <p>Questions about this policy or requests to access or delete your data: <a href="mailto:privacy@shinnslist.com">privacy@shinnslist.com</a>.</p>
      </div>
    </main>
  );
}
