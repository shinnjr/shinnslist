'use client';

import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center px-4">
      <div className="max-w-md mx-auto text-center py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-6xl mb-6"
        >
          🧭
        </motion.div>
        <h1 className="text-3xl font-bold text-white mb-3 animate-fade-in-up">
          <span className="text-[var(--shinnslist-pink)]">404</span> — This deal went off the market
        </h1>
        <p className="text-[var(--shinnslist-muted)] text-base mb-8 animate-fade-in-up">
          The page you&apos;re looking for doesn&apos;t exist or was moved. Let&apos;s get you back to the good stuff.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center stagger">
          <a
            href="/"
            className="min-h-[48px] inline-flex items-center justify-center bg-[var(--shinnslist-pink)] text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-fuchsia-600 active:scale-[0.97] transition-all"
          >
            View Deal Feed →
          </a>
          <a
            href="/pricing"
            className="min-h-[48px] inline-flex items-center justify-center border border-[var(--shinnslist-border)] text-white px-8 py-3 rounded-full font-medium text-sm hover:border-zinc-500 active:scale-[0.97] transition-all"
          >
            See Pricing
          </a>
        </div>
      </div>
    </main>
  );
}
