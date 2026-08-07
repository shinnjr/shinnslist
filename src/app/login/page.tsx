'use client';

import { useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    window.location.href = '/';
  };

  const handleMagicLink = async () => {
    setLoading(true);
    setError('');

    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  const handleGoogle = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <main className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">🆓</span>
          <h1 className="text-2xl font-bold text-white mt-3">
            Welcome back to <span className="text-[var(--shinnslist-pink)]">Shinnslist</span>
          </h1>
        </div>

        {sent ? (
          <div className="bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] rounded-2xl p-6 text-center">
            <div className="text-3xl mb-3">📧</div>
            <h2 className="text-white font-bold mb-2">Check your email</h2>
            <p className="text-[var(--shinnslist-muted)] text-sm">
              We sent a magic link to <span className="text-white">{email}</span>
            </p>
          </div>
        ) : (
          <div className="bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] rounded-2xl p-6">
            {/* Google sign-in */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full min-h-[48px] bg-white text-black font-medium py-3 rounded-xl hover:bg-gray-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-4 disabled:opacity-60"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-[var(--shinnslist-border)]" />
              <span className="text-xs text-[var(--shinnslist-muted)]">or</span>
              <div className="flex-1 h-px bg-[var(--shinnslist-border)]" />
            </div>

            <form onSubmit={handleEmailLogin}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="min-h-[48px] w-full bg-[var(--shinnslist-bg)] border border-[var(--shinnslist-border)] rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--shinnslist-pink)] mb-3 transition-colors"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="min-h-[48px] w-full bg-[var(--shinnslist-bg)] border border-[var(--shinnslist-border)] rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--shinnslist-pink)] mb-1 transition-colors"
              />

              {error && (
                <p className="text-red-400 text-xs mt-2 mb-2 animate-fade-in">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full min-h-[48px] bg-[var(--shinnslist-pink)] text-white font-bold py-3 rounded-xl hover:bg-fuchsia-600 active:scale-[0.98] transition-all disabled:opacity-50 mt-3 flex items-center justify-center gap-2"
              >
                {loading ? (<><Spinner /> Signing in...</>) : 'Sign in'}
              </button>

              <button
                type="button"
                onClick={handleMagicLink}
                disabled={loading || !email}
                className="w-full min-h-[48px] text-[var(--shinnslist-muted)] text-sm py-2 hover:text-white active:scale-[0.98] transition-all mt-2 disabled:opacity-50"
              >
                Send magic link instead
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-[var(--shinnslist-muted)] text-sm mt-6">
          Don&apos;t have an account?{' '}
          <a href="/signup" className="text-[var(--shinnslist-pink)] hover:underline">Sign up</a>
        </p>
      </div>
    </main>
  );
}
