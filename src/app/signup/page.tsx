'use client';

import Link from 'next/link';
import { ArrowRight, BadgeCheck, FileCheck2, SearchCheck, ShieldCheck } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const google = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/onboarding` } });
  };

  return (
    <main className="auth-page">
      <section className="auth-story">
        <span className="eyebrow eyebrow-dark">Free application preview</span>
        <h1>Build one profile. Reuse it across every grant.</h1>
        <p>Shinnslist checks eligibility first, drafts from facts you approve, and pauses before anything legally binding.</p>
        <div className="auth-benefits">
          <span><SearchCheck size={18} /> Verified grant matching</span>
          <span><FileCheck2 size={18} /> Editable application drafts</span>
          <span><ShieldCheck size={18} /> Human approval before submission</span>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-mark"><FileCheck2 size={22} /><span>Shinnslist</span></div>
        <h2>Create your grant workspace</h2>
        <p>No credit card. No submission fee. Preview a real application first.</p>
        <Link href="/onboarding" className="grant-button grant-button-primary">Build my profile first <ArrowRight size={17} /></Link>
        <div className="auth-divider"><span>or save it with an account</span></div>
        <button type="button" onClick={google} className="auth-google">Continue with Google</button>
        <div className="auth-trust"><BadgeCheck size={16} /><span>We never invent eligibility or application facts.</span></div>
        <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>
      </section>
    </main>
  );
}
