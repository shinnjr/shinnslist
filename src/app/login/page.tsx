'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, FileCheck2, Mail, ShieldCheck } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true); setError('');
    const supabase = createBrowserClient();
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error) { setError(result.error.message); setLoading(false); return; }
    window.location.href = '/applications';
  };

  const magicLink = async () => {
    if (!email) { setError('Enter your email first.'); return; }
    setLoading(true); setError('');
    const supabase = createBrowserClient();
    const result = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/applications` } });
    if (result.error) { setError(result.error.message); setLoading(false); return; }
    setSent(true); setLoading(false);
  };

  const google = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/applications` } });
  };

  return (
    <main className="auth-page">
      <section className="auth-story">
        <span className="eyebrow eyebrow-dark">Welcome back</span>
        <h1>Your grant queue is waiting.</h1>
        <p>Pick up every match, draft, approval gate, and submission from one secure workspace.</p>
        <div className="auth-proof"><ShieldCheck size={19} /><span>No legal attestations or submissions happen without your approval.</span></div>
      </section>
      <section className="auth-panel">
        <div className="auth-mark"><FileCheck2 size={22} /><span>Shinnslist</span></div>
        {sent ? (
          <div className="auth-sent"><Mail size={28} /><h2>Check your email</h2><p>We sent a secure sign-in link to <strong>{email}</strong>.</p></div>
        ) : (
          <>
            <h2>Sign in</h2>
            <p>Return to your grant application workspace.</p>
            <button type="button" onClick={google} className="auth-google">Continue with Google</button>
            <div className="auth-divider"><span>or use email</span></div>
            <form onSubmit={login}>
              <label htmlFor="login-email">Email</label>
              <input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@business.com" />
              <label htmlFor="login-password">Password</label>
              <input id="login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" />
              {error && <p className="auth-error" role="alert">{error}</p>}
              <button type="submit" className="grant-button grant-button-primary" disabled={loading || !email}>{loading ? 'Signing in…' : <>Sign in <ArrowRight size={16} /></>}</button>
              <button type="button" onClick={magicLink} className="auth-magic" disabled={loading || !email}>Send a magic link instead</button>
            </form>
          </>
        )}
        <p className="auth-switch">New to Shinnslist? <Link href="/signup">Build your free profile</Link></p>
      </section>
    </main>
  );
}
