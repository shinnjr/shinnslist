'use client';

import { useState, useCallback } from 'react';
import { INTEREST_GROUPINGS, ONBOARDING_CARDS } from '@/data/interestTaxonomy';
import type { InterestGrouping } from '@/types';

type Step = 'pick-categories' | 'pick-interests' | 'email-signup';

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('pick-categories');
  const [selectedGroupings, setSelectedGroupings] = useState<string[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleGrouping = (id: string) => {
    setSelectedGroupings(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const toggleCard = (id: string) => {
    setSelectedCards(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, c]
    );
  };

  const handleContinue = () => {
    if (step === 'pick-categories') {
      setStep('pick-interests');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Store preferences in localStorage so the homepage can use them
      const prefs = {
        groupings: selectedGroupings,
        cards: selectedCards,
      };
      localStorage.setItem('shinnslist_prefs', JSON.stringify(prefs));

      // For now, skip Supabase auth and go straight to welcome
      window.location.href = '/welcome';
    } catch (err) {
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  };

  // Derived: unique categories from selected cards
  const selectedCategories = new Set(
    selectedCards.flatMap(id => {
      const card = ONBOARDING_CARDS.find(card => card.id === id);
      return card?.categories || [];
    })
  );

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="flex gap-1 mb-8">
          <div className={`h-1 rounded-full flex-1 ${step === 'pick-categories' || step === 'pick-interests' || step === 'email-signup' ? 'bg-[var(--shinnslist-pink)]' : 'bg-[var(--shinnslist-border)]'}`}/>
          <div className={`h-1 rounded-full flex-1 ${step === 'pick-interests' || step === 'email-signup' ? 'bg-[var(--shinnslist-pink)]' : 'bg-[var(--shinnslist-border)]'}`}/>
          <div className={`h-1 rounded-full flex-1 ${step === 'email-signup' ? 'bg-[var(--shinnslist-pink)]' : 'bg-[var(--shinnslist-border)]'}`}/>
        </div>

        {/* Step 1: Pick lifestyle categories */}
        {step === 'pick-categories' && (
          <>
            <div className="text-center mb-6">
              <span className="text-4xl">🎯</span>
              <h1 className="text-2xl font-bold text-white mt-3">What brings you here?</h1>
              <p className="text-[var(--shinnslist-muted)] text-sm mt-1">
                Pick one or more — we'll find the best deals for your life
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {INTEREST_GROUPINGS.map(g => (
                <button
                  key={g.id}
                  onClick={() => toggleGrouping(g.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedGroupings.includes(g.id)
                      ? 'border-[var(--shinnslist-pink)] bg-[var(--shinnslist-pink)]/10'
                      : 'border-[var(--shinnslist-border)] bg-[var(--shinnslist-surface)] hover:border-zinc-600'
                  }`}
                >
                  <div className="text-2xl mb-2">{g.emoji}</div>
                  <div className="text-white font-semibold text-sm">{g.label}</div>
                  <div className="text-[var(--shinnslist-muted)] text-xs mt-1">{g.description}</div>
                </button>
              ))}
            </div>

            <button
              onClick={handleContinue}
              disabled={selectedGroupings.length === 0}
              className="w-full bg-[var(--shinnslist-pink)] text-white font-bold py-4 rounded-xl hover:bg-fuchsia-600 transition-colors disabled:opacity-50"
            >
              Continue ({selectedGroupings.length} selected) →
            </button>
            <p className="text-center text-[var(--shinnslist-muted)] text-xs mt-4">
              Skip this? <button onClick={() => setStep('pick-interests')} className="text-[var(--shinnslist-pink)] hover:underline">Go straight to interests</button>
            </p>
          </>
        )}

        {/* Step 2: Pick specific interests */}
        {step === 'pick-interests' && (
          <>
            <div className="text-center mb-6">
              <span className="text-4xl">🔍</span>
              <h1 className="text-2xl font-bold text-white mt-3">Pick your interests</h1>
              <p className="text-[var(--shinnslist-muted)] text-sm mt-1">
                Select at least 3 — the more you pick, the better your deal feed
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-8 max-h-[400px] overflow-y-auto">
              {ONBOARDING_CARDS.map(card => (
                <button
                  key={card.id}
                  onClick={() => toggleCard(card.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedCards.includes(card.id)
                      ? 'border-[var(--shinnslist-pink)] bg-[var(--shinnslist-pink)]/10 scale-[1.02]'
                      : 'border-[var(--shinnslist-border)] bg-[var(--shinnslist-surface)] hover:border-zinc-600'
                  }`}
                >
                  <span className="text-xl">{card.emoji}</span>
                  <span className="block text-white text-xs font-medium mt-1">{card.label}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('pick-categories')}
                className="flex-1 bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] text-white font-medium py-4 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep('email-signup')}
                disabled={selectedCards.length < 3}
                className="flex-1 bg-[var(--shinnslist-pink)] text-white font-bold py-4 rounded-xl hover:bg-fuchsia-600 transition-colors disabled:opacity-50"
              >
                Continue ({selectedCards.length} selected) →
              </button>
            </div>
            <p className="text-center text-[var(--shinnslist-muted)] text-xs mt-4">
              <span className="text-[var(--shinnslist-pink)]">{selectedCategories.size}</span> categories from your picks
            </p>
          </>
        )}

        {/* Step 3: Email signup (no password needed for free tier) */}
        {step === 'email-signup' && (
          <>
            <div className="text-center mb-6">
              <span className="text-4xl">🚀</span>
              <h1 className="text-2xl font-bold text-white mt-3">You're all set!</h1>
              <p className="text-[var(--shinnslist-muted)] text-sm mt-1">
                Enter your email to start receiving deal alerts
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                {selectedCards.slice(0, 5).map(id => {
                  const card = ONBOARDING_CARDS.find(c => c.id === id);
                  return card ? (
                    <span key={id} className="text-xs bg-[var(--shinnslist-pink)]/20 text-[var(--shinnslist-pink)] px-2 py-1 rounded-full">
                      {card.emoji} {card.label}
                    </span>
                  ) : null;
                })}
                {selectedCards.length > 5 && (
                  <span className="text-xs text-[var(--shinnslist-muted)]">+{selectedCards.length - 5} more</span>
                )}
              </div>
            </div>

            <div className="bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] rounded-2xl p-6">
              <form onSubmit={handleSignup}>
                <input
                  type="email" placeholder="you@email.com" value={email}
                  onChange={e => setEmail(e.target.value)} required
                  className="w-full bg-[var(--shinnslist-bg)] border border-[var(--shinnslist-border)] rounded-xl px-4 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--shinnslist-pink)] mb-3 text-lg"
                />

                {error && <p className="text-red-400 text-xs mb-2">{error}</p>}

                <button
                  type="submit" disabled={loading || !email}
                  className="w-full bg-[var(--shinnslist-pink)] text-white font-bold py-4 rounded-xl hover:bg-fuchsia-600 transition-colors disabled:opacity-50 text-lg"
                >
                  {loading ? 'Setting up...' : 'Start finding deals →'}
                </button>
              </form>

              <p className="text-center text-[var(--shinnslist-muted)] text-xs mt-4">
                No password needed. No credit card. Cancel anytime.
              </p>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setStep('pick-interests')}
                className="flex-1 bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] text-white font-medium py-3 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                ← Back to interests
              </button>
              <button
                onClick={handleSignup}
                disabled={!email || loading}
                className="flex-1 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Continue with Google
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
