'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  }, [query, onSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    onSearch('');
  }, [onSearch]);

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto mb-4">
      <div className={`flex items-center gap-2 bg-[var(--shinnslist-surface)] border rounded-xl px-4 py-3 transition-all ${
        focused ? 'border-[var(--shinnslist-pink)] shadow-[0_0_20px_rgba(255,20,147,0.1)]' : 'border-[var(--shinnslist-border)]'
      }`}>
        <span className="text-lg">🔍</span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search deals... (e.g. 'RTX 4090', 'free couch', 'Rolex')"
          className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-zinc-600 text-sm"
        />
        {query && (
          <button type="button" onClick={handleClear} className="text-zinc-500 hover:text-white transition-colors text-sm">
            ✕
          </button>
        )}
        <motion.button
          type="submit"
          whileTap={{ scale: 0.95 }}
          className="bg-[var(--shinnslist-pink)] text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-fuchsia-600 transition-colors"
        >
          Search
        </motion.button>
      </div>
      {query && (
        <p className="text-[var(--shinnslist-muted)] text-xs mt-2 text-center">
          AI-powered search across all listings. Try: "free furniture", "vintage watches", "GPU deals"
        </p>
      )}
    </form>
  );
}
