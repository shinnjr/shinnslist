'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function PostPage() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [platform, setPlatform] = useState<'facebook' | 'craigslist' | 'offerup'>('facebook');
  const [posting, setPosting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const handlePost = async () => {
    if (!photo || !title) return;
    setPosting(true);
    setError('');

    try {
      // Simulate posting — in production, this calls a Cloudflare Worker
      // that uses Browser Rendering to post to Facebook Marketplace
      await new Promise(resolve => setTimeout(resolve, 1500));
      setDone(true);
    } catch (err) {
      setError('Failed to post. Try again.');
    } finally {
      setPosting(false);
    }
  };

  if (done) {
    return (
      <main className="flex-1 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="w-full max-w-sm text-center animate-fade-in"
        >
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }}
            className="mx-auto mb-4 text-6xl"
          >
            🚀
          </motion.div>
          <h1 className="text-2xl font-bold text-white">Posted!</h1>
          <p className="text-[var(--shinnslist-muted)] text-sm mt-2">
            Your {title || 'item'} is now live on {platform === 'facebook' ? 'Facebook Marketplace' : platform === 'craigslist' ? 'Craigslist' : 'OfferUp'}
          </p>
          <p className="text-[var(--shinnslist-muted)] text-xs mt-4">
            You'll get notified when someone messages you
          </p>
          <a href="/" className="inline-flex min-h-[48px] items-center mt-6 bg-[var(--shinnslist-pink)] text-black font-bold py-3 px-8 rounded-xl hover:bg-emerald-600 active:scale-[0.97] transition-all">
            Back to deals
          </a>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 animate-fade-in-up">
          <span className="text-4xl">📸</span>
          <h1 className="text-2xl font-bold text-white mt-3">Post a deal</h1>
          <p className="text-[var(--shinnslist-muted)] text-sm mt-1">
            One photo, one click — goes live on multiple marketplaces
          </p>
        </div>

        <ErrorBoundary label="This form">
          <div className="bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] rounded-2xl p-6">
            {/* Photo upload */}
            <div
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all active:scale-[0.99] mb-4 ${
                photo
                  ? 'border-[var(--shinnslist-pink)] bg-[var(--shinnslist-pink)]/5'
                  : 'border-[var(--shinnslist-border)] hover:border-zinc-600'
              }`}
            >
              {photo ? (
                <img src={photo} alt="Preview" className="max-h-[200px] mx-auto rounded-lg animate-fade-in" />
              ) : (
                <>
                  <div className="text-4xl mb-2">📷</div>
                  <p className="text-white font-medium">Tap to take a photo</p>
                  <p className="text-[var(--shinnslist-muted)] text-xs mt-1">or choose from gallery</p>
                </>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
            </div>

            {/* Title */}
            <label htmlFor="post-title" className="sr-only">Title</label>
            <input
              id="post-title"
              type="text"
              placeholder="What are you selling?" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="min-h-[48px] w-full bg-[var(--shinnslist-bg)] border border-[var(--shinnslist-border)] rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--shinnslist-pink)] mb-3 transition-colors"
            />

            {/* Price */}
            <label htmlFor="post-price" className="sr-only">Price</label>
            <input
              id="post-price"
              type="text"
              placeholder="Price (optional)" 
              value={price}
              onChange={e => setPrice(e.target.value.replace(/[^0-9.]/g, ''))}
              className="min-h-[48px] w-full bg-[var(--shinnslist-bg)] border border-[var(--shinnslist-border)] rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--shinnslist-pink)] mb-4 transition-colors"
            />

            {/* Platform selector */}
            <div className="flex gap-2 mb-4">
              {(['facebook', 'craigslist', 'offerup'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  aria-pressed={platform === p}
                  className={`flex-1 min-h-[48px] py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.97] ${
                    platform === p
                      ? 'bg-[var(--shinnslist-pink)] text-black shadow-lg shadow-[var(--shinnslist-pink)]/20'
                      : 'bg-[var(--shinnslist-bg)] text-[var(--shinnslist-muted)] hover:text-white'
                  }`}
                >
                  {p === 'facebook' ? 'Facebook' : p === 'craigslist' ? 'Craigslist' : 'OfferUp'}
                </button>
              ))}
            </div>

            {error && <p role="alert" className="text-red-400 text-xs mb-3 animate-fade-in">{error}</p>}

            <button
              onClick={handlePost}
              disabled={!photo || !title || posting}
              className="w-full min-h-[48px] bg-[var(--shinnslist-pink)] text-black font-bold py-4 rounded-xl hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {posting ? (<><Spinner /> Posting...</>) : '🚀 Post to Marketplace'}
            </button>

            <p className="text-center text-[var(--shinnslist-muted)] text-xs mt-3">
              Posts to {platform === 'facebook' ? 'Facebook Marketplace' : platform === 'craigslist' ? 'Craigslist' : 'OfferUp'} instantly
            </p>
          </div>
        </ErrorBoundary>
      </div>
    </main>
  );
}
