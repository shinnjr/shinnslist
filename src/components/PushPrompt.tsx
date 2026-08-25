'use client';

import { useState, useEffect } from 'react';

// VAPID public key for push subscription
const VAPID_PUBLIC = 'BG80yZAIdz0maw1UoiUebr8ErFrpj8DTxaLMdEjgdgi45hEzT8y6ISnkpt-H-ClLr1OyvzAT54DRi7y6Nq1HnS0';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
  } catch (err) {
    console.error('SW registration failed:', err);
    return null;
  }
}

async function subscribeToPush(registration: ServiceWorkerRegistration) {
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
  });

  await fetch('/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'subscribe', subscription: subscription.toJSON() }),
  });

  return subscription;
}

export default function PushPrompt() {
  const [status, setStatus] = useState<'idle' | 'prompt' | 'granted' | 'denied' | 'unsupported'>('idle');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!('Notification' in window)) {
      setStatus('unsupported');
      return;
    }

    if (Notification.permission === 'granted') {
      setStatus('granted');
      registerAndSubscribe();
    } else if (Notification.permission === 'denied') {
      setStatus('denied');
    } else {
      // Show prompt after 5 seconds
      const timer = setTimeout(() => {
        const stored = localStorage.getItem('push_dismissed');
        if (!stored) setStatus('prompt');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  async function registerAndSubscribe() {
    const registration = await registerServiceWorker();
    if (!registration) return;
    try {
      await subscribeToPush(registration);
    } catch (err) {
      // User blocked or unsupported
    }
  }

  async function handleEnable() {
    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        setStatus('granted');
        await registerAndSubscribe();
      } else {
        setStatus('denied');
      }
    } catch {
      setStatus('denied');
    }
  }

  function handleDismiss() {
    setDismissed(true);
    setStatus('idle');
    localStorage.setItem('push_dismissed', Date.now().toString());
  }

  if (status === 'unsupported' || status === 'denied' || status === 'idle' || dismissed) return null;

  if (status === 'granted') {
    // Subtle confirmation
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className="bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] rounded-2xl p-4 shadow-2xl animate-slide-up">
        <button
          onClick={handleDismiss}
          aria-label="Dismiss notification"
          className="absolute top-2 right-2 flex h-12 w-12 items-center justify-center rounded-full text-[var(--shinnslist-muted)] hover:text-white hover:bg-white/5 transition-colors"
        >
          ×
        </button>
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔔</span>
          <div className="flex-1">
            <h3 className="text-white font-semibold text-sm mb-1">Never miss a deal</h3>
            <p className="text-[var(--shinnslist-muted)] text-xs mb-3">
              Get instant alerts when new deals drop in your zones.
            </p>
            <button
              onClick={handleEnable}
              className="min-h-[48px] bg-[var(--shinnslist-pink)] text-black text-xs font-bold px-5 py-2 rounded-full hover:bg-emerald-600 transition-colors"
            >
              Enable alerts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
