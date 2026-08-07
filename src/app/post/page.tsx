'use client';

import { useState, useRef, useCallback } from 'react';

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
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">🚀</div>
          <h1 className="text-2xl font-bold text-white">Posted!</h1>
          <p className="text-[var(--shinnslist-muted)] text-sm mt-2">
            Your {title || 'item'} is now live on {platform === 'facebook' ? 'Facebook Marketplace' : platform === 'craigslist' ? 'Craigslist' : 'OfferUp'}
          </p>
          <p className="text-[var(--shinnslist-muted)] text-xs mt-4">
            You'll get notified when someone messages you
          </p>
          <a href="/" className="inline-block mt-6 bg-[var(--shinnslist-pink)] text-white font-bold py-3 px-8 rounded-xl hover:bg-fuchsia-600 transition-colors">
            Back to deals
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <span className="text-4xl">📸</span>
          <h1 className="text-2xl font-bold text-white mt-3">Post a deal</h1>
          <p className="text-[var(--shinnslist-muted)] text-sm mt-1">
            One photo, one click — goes live on multiple marketplaces
          </p>
        </div>

        <div className="bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] rounded-2xl p-6">
          {/* Photo upload */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-4 ${
              photo
                ? 'border-[var(--shinnslist-pink)]'
                : 'border-[var(--shinnslist-border)] hover:border-zinc-600'
            }`}
          >
            {photo ? (
              <img src={photo} alt="Preview" className="max-h-[200px] mx-auto rounded-lg" />
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
          <input
            type="text"
            placeholder="What are you selling?" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-[var(--shinnslist-bg)] border border-[var(--shinnslist-border)] rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--shinnslist-pink)] mb-3"
          />

          {/* Price */}
          <input
            type="text"
            placeholder="Price (optional)" 
            value={price}
            onChange={e => setPrice(e.target.value.replace(/[^0-9.]/g, ''))}
            className="w-full bg-[var(--shinnslist-bg)] border border-[var(--shinnslist-border)] rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--shinnslist-pink)] mb-4"
          />

          {/* Platform selector */}
          <div className="flex gap-2 mb-4">
            {(['facebook', 'craigslist', 'offerup'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  platform === p
                    ? 'bg-[var(--shinnslist-pink)] text-white'
                    : 'bg-[var(--shinnslist-bg)] text-[var(--shinnslist-muted)] hover:text-white'
                }`}
              >
                {p === 'facebook' ? 'Facebook' : p === 'craigslist' ? 'Craigslist' : 'OfferUp'}
              </button>
            ))}
          </div>

          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

          <button
            onClick={handlePost}
            disabled={!photo || !title || posting}
            className="w-full bg-[var(--shinnslist-pink)] text-white font-bold py-4 rounded-xl hover:bg-fuchsia-600 transition-colors disabled:opacity-50"
          >
            {posting ? 'Posting...' : '🚀 Post to Marketplace'}
          </button>

          <p className="text-center text-[var(--shinnslist-muted)] text-xs mt-3">
            Posts to {platform === 'facebook' ? 'Facebook Marketplace' : platform === 'craigslist' ? 'Craigslist' : 'OfferUp'} instantly
          </p>
        </div>
      </div>
    </main>
  );
}
