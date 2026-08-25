'use client';

import { motion } from 'framer-motion';

// template.tsx re-mounts on every route navigation (unlike layout.tsx which persists),
// so this gives a smooth fade+rise transition between pages without touching next.config.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
}
