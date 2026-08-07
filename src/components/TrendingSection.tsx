'use client';

import { useState, useEffect } from 'react';

interface Props {
  categories: string[];
}

const CHALLENGES = [
  { emoji: '🔥', title: 'Streak Master', desc: 'Visit 7 days in a row', target: 7, unit: 'days' },
  { emoji: '👀', title: 'Deal Spotter', desc: 'View 50 deals today', target: 50, unit: 'deals' },
  { emoji: '🆓', title: 'Freebie Hunter', desc: 'Find 10 free items', target: 10, unit: 'free items' },
  { emoji: '💎', title: 'Diamond Hands', desc: 'Save 5 high-value deals', target: 5, unit: 'saves' },
];

export default function TrendingSection({ categories }: Props) {
  const [streak, setStreak] = useState(0);
  const [dealsViewed, setDealsViewed] = useState(0);

  useEffect(() => {
    // Track streak
    const lastVisit = localStorage.getItem('shinnslist_last_visit');
    const today = new Date().toDateString();
    if (lastVisit === today) {
      const s = parseInt(localStorage.getItem('shinnslist_streak') || '0');
      setStreak(s);
    } else {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const s = lastVisit === yesterday ? parseInt(localStorage.getItem('shinnslist_streak') || '0') + 1 : 1;
      localStorage.setItem('shinnslist_last_visit', today);
      localStorage.setItem('shinnslist_streak', s.toString());
      setStreak(s);
    }
    // Track deals viewed
    const d = parseInt(localStorage.getItem('shinnslist_deals_viewed') || '0');
    setDealsViewed(d);
  }, []);

  // Track deal views
  useEffect(() => {
    if (dealsViewed > 0) {
      localStorage.setItem('shinnslist_deals_viewed', dealsViewed.toString());
    }
  }, [dealsViewed]);

  if (categories.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-lg">📈 Your Progress</h2>
        <span className="text-[var(--shinnslist-muted)] text-xs">{streak > 0 ? `🔥 ${streak} day streak` : 'Start your streak!'}</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {CHALLENGES.map(challenge => {
          const progress = challenge.title === 'Streak Master' ? streak :
            challenge.title === 'Deal Spotter' ? dealsViewed : 0;
          const pct = Math.min((progress / challenge.target) * 100, 100);
          
          return (
            <div key={challenge.title} className="bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] rounded-xl p-4">
              <div className="text-2xl mb-2">{challenge.emoji}</div>
              <div className="text-white text-sm font-semibold">{challenge.title}</div>
              <div className="text-[var(--shinnslist-muted)] text-xs mt-1">{challenge.desc}</div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-[var(--shinnslist-muted)] mb-1">
                  <span>{progress}/{challenge.target}</span>
                  <span>{Math.round(pct)}%</span>
                </div>
                <div className="h-1.5 bg-[var(--shinnslist-bg)] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[var(--shinnslist-pink)] to-fuchsia-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
