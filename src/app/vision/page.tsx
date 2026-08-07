'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { getSub, isUnlocked } from '@/lib/subscription';
import { track } from '@/lib/track';

const VISION_WORKER = 'https://shinnslist-vision.jamesrshinn.workers.dev';

interface Verdict {
  item: string;
  condition: string;
  retailValue: number | null;
  deltaPct?: number;
  verdict?: 'deal' | 'meh' | 'skip';
  confidence: string;
  category?: string;
  notes?: string;
}

export default function VisionPage() {
  const sub = getSub();
  const [photo, setPhoto] = useState<string | null>(null); // data uri
  const [priceTag, setPriceTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Paid gate — subscribers only
  if (!sub) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-white mb-2">Deal Vision — subscriber feature</h1>
          <p className="text-[var(--shinnslist-muted)] text-sm mb-6">
            Take a photo of any item at a thrift store, garage sale, or Goodwill.
            Our AI identifies it, pulls sold comps, and tells you if it&apos;s a deal.
          </p>
          <a
            href="/pricing"
            className="inline-flex min-h-[48px] items-center bg-[var(--shinnslist-pink)] text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-fuchsia-600 active:scale-[0.97] transition-all"
          >
            Unlock subscriptions →
          </a>
          <p className="text-[var(--shinnslist-muted)] text-[11px] mt-4">
            Engine costs are covered by subscribers. Free feed + scores are always free.
          </p>
        </div>
      </main>
    );
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setVerdict(null);
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const analyze = useCallback(async () => {
    if (!photo) return;
    setLoading(true);
    setError('');
    setVerdict(null);
    track('vision_scan');
    try {
      // strip data URI prefix for the worker (it re-adds)
      const b64 = photo.includes('base64,') ? photo.split('base64,')[1] : photo;
      const payload: any = { image: b64 };
      if (priceTag && !isNaN(Number(priceTag))) payload.priceTag = Number(priceTag);
      const res = await fetch(`${VISION_WORKER}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || 'Vision engine failed — try another photo.');
        return;
      }
      setVerdict(data);
    } catch {
      setError('Network error — check your connection.');
    } finally {
      setLoading(false);
    }
  }, [photo, priceTag]);

  const reset = () => { setPhoto(null); setVerdict(null); setPriceTag(''); setError(''); };
  const categoryFromVerdict = verdict?.category || 'other';

  return (
    <main className="flex-1 max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-1">
        🔍 Deal Vision
      </h1>
      <p className="text-[var(--shinnslist-muted)] text-sm mb-6">
        {isUnlocked(categoryFromVerdict) || sub?.allIn
          ? 'Snap any item to check its value.'
          : `Unlock the ${verdict?.category || ''} vertical to save scans.`}
      </p>

      {/* Photo input / preview */}
      <div className="mb-5">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          className="hidden"
        />
        {!photo ? (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full min-h-[200px] bg-[var(--shinnslist-surface)] border-2 border-dashed border-[var(--shinnslist-border)] rounded-2xl flex flex-col items-center justify-center gap-3 text-[var(--shinnslist-muted)] hover:border-[var(--shinnslist-pink)] hover:text-white transition-colors"
          >
            <span className="text-5xl">📸</span>
            <span className="text-sm font-medium">Tap to take a photo</span>
            <span className="text-[11px]">Opens your camera</span>
          </button>
        ) : (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="Item to scan" className="w-full rounded-2xl max-h-72 object-cover border border-[var(--shinnslist-border)]" />
            <button onClick={reset} className="absolute top-3 right-3 bg-black/60 text-white text-xs rounded-full px-3 py-1.5 hover:bg-black/80 transition-colors">
              Retake
            </button>
          </div>
        )}
      </div>

      {/* Price tag (optional) */}
      {photo && (
        <div className="mb-5">
          <label className="text-white text-sm font-medium block mb-1.5" htmlFor="price-tag">
            Price tag (optional)
          </label>
          <input
            id="price-tag"
            type="number"
            value={priceTag}
            onChange={e => setPriceTag(e.target.value)}
            placeholder="$0"
            className="w-full bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--shinnslist-pink)] text-lg"
          />
        </div>
      )}

      {/* Analyze button */}
      {photo && (
        <button
          onClick={analyze}
          disabled={loading}
          className="w-full min-h-[48px] bg-[var(--shinnslist-pink)] text-white font-bold py-4 rounded-xl hover:bg-fuchsia-600 active:scale-[0.98] transition-all disabled:opacity-60 mb-6 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><span className="animate-spin inline-block w-5 h-5 border-2 border-white/40 border-t-white rounded-full" /> Identifying item…</>
          ) : (
            'Analyze deal →'
          )}
        </button>
      )}

      {error && (
        <p className="text-red-400 text-sm text-center mb-4">{error}</p>
      )}

      {/* Verdict card */}
      {verdict && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] rounded-2xl p-5"
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-white font-bold text-base flex-1">{verdict.item}</h3>
            <span className={`text-xs font-bold rounded-full px-3 py-1 ml-3 ${
              verdict.verdict === 'deal' ? 'bg-[var(--shinnslist-green)]/20 text-[var(--shinnslist-green)]' :
              verdict.verdict === 'skip' ? 'bg-red-500/20 text-red-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}>
              {verdict.verdict === 'deal' ? '🔥 DEAL' :
               verdict.verdict === 'skip' ? '🙅 SKIP' : '🤷 MEH'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
            <div>
              <span className="text-[var(--shinnslist-muted)] text-[11px] block">Condition</span>
              <span className="text-white font-medium capitalize">{verdict.condition}</span>
            </div>
            <div>
              <span className="text-[var(--shinnslist-muted)] text-[11px] block">Fair market value</span>
              <span className="text-white font-medium">{verdict.retailValue ? `$${verdict.retailValue.toLocaleString()}` : 'Unknown'}</span>
            </div>
            {verdict.deltaPct !== undefined && (
              <div>
                <span className="text-[var(--shinnslist-muted)] text-[11px] block">Below market</span>
                <span className="text-[var(--shinnslist-green)] font-bold">{Math.round(verdict.deltaPct * 100)}%</span>
              </div>
            )}
            <div>
              <span className="text-[var(--shinnslist-muted)] text-[11px] block">Confidence</span>
              <span className="text-white capitalize">{verdict.confidence}</span>
            </div>
          </div>

          {verdict.notes && (
            <p className="text-[var(--shinnslist-muted)] text-xs leading-relaxed border-t border-[var(--shinnslist-border)] pt-3">
              {verdict.notes}
            </p>
          )}

          <div className="flex gap-3 mt-4">
            <button onClick={reset} className="flex-1 min-h-[44px] bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] text-white text-sm font-medium rounded-xl hover:bg-zinc-800 active:scale-[0.97] transition-all">
              Scan another
            </button>
            <button
              onClick={() => {
                const text = `🔥 Scanned with Shinnslist: ${verdict.item} — ${verdict.retailValue ? `$${verdict.retailValue} value` : 'check this deal'}`;
                navigator.clipboard?.writeText?.(text).catch(() => {});
              }}
              className="flex-1 min-h-[44px] bg-[var(--shinnslist-pink)]/10 border border-[var(--shinnslist-pink)]/30 text-[var(--shinnslist-pink)] text-sm font-bold rounded-xl hover:bg-[var(--shinnslist-pink)]/20 active:scale-[0.97] transition-all"
            >
              Share deal
            </button>
          </div>
        </motion.div>
      )}
    </main>
  );
}
