'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function BottomNav() {
  const pathname = usePathname();
  const [hasPreferences, setHasPreferences] = useState(false);

  useEffect(() => {
    const prefs = localStorage.getItem('shinnslist_prefs');
    setHasPreferences(!!prefs);
  }, []);

  const links = [
    { href: '/', label: 'Deals', icon: '🏷️' },
    { href: '/post', label: 'Post', icon: '📸' },
    { href: '/zones', label: 'Zones', icon: '🗺️' },
    { href: hasPreferences ? '/pricing' : '/onboarding', label: hasPreferences ? 'Upgrade' : 'Setup', icon: hasPreferences ? '⚡' : '🎯' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--shinnslist-surface)]/95 backdrop-blur-xl border-t border-[var(--shinnslist-border)] safe-bottom">
      <div className="flex items-center justify-around h-16">
        {links.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-[48px] min-w-[48px] touch-target flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all active:scale-[0.95] ${
                active
                  ? 'text-[var(--shinnslist-pink)]'
                  : 'text-[var(--shinnslist-muted)] hover:text-zinc-300'
              }`}
            >
              <span className="text-lg">{icon}</span>
              <span className="text-[10px] font-medium">{label}</span>
              {active && (
                <motion.span
                  layoutId="bottom-nav-indicator"
                  className="w-1 h-1 rounded-full bg-[var(--shinnslist-pink)]"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
