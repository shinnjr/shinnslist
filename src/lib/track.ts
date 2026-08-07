// Anonymous analytics — the free-user data pipeline.
// Events buffer in localStorage and flush in batches to the events worker,
// which rate-limits and inserts into Supabase (service role). No PII.
// The sellable dataset: deal ids, categories, prices, deltas, metro, timestamps.

const EVENTS_KEY = 'shinnslist_events';
const DEVICE_KEY = 'shinnslist_device_id';
const EVENTS_WORKER =
  process.env.NEXT_PUBLIC_EVENTS_WORKER || 'https://shinnslist-events.jamesrshinn.workers.dev';

export type TrackEvent =
  | 'page_view'
  | 'vertical_select'
  | 'deal_view'
  | 'deal_save'
  | 'search'
  | 'blur_impression'
  | 'unlock_click'
  | 'checkout_start'
  | 'checkout_success'
  | 'vision_scan'
  | 'post_created';

interface EventRow {
  device_id: string;
  event: TrackEvent;
  ts: string;
  // structured payload — the sellable signals
  category?: string;
  deal_id?: string;
  price?: number;
  estimated_value?: number;
  delta_pct?: number;
  city?: string;
  vertical?: string;
  plan?: string;
  extra?: Record<string, unknown>;
}

export function deviceId(): string {
  if (typeof window === 'undefined') return 'anon';
  try {
    let id = window.localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : `d-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      window.localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return 'anon';
  }
}

export function track(evt: TrackEvent, fields: Omit<EventRow, 'device_id' | 'event' | 'ts'> = {}): void {
  if (typeof window === 'undefined') return;
  try {
    const row: EventRow = { device_id: deviceId(), event: evt, ts: new Date().toISOString(), ...fields };
    const buf = JSON.parse(window.localStorage.getItem(EVENTS_KEY) || '[]') as EventRow[];
    buf.push(row);
    // keep the buffer small; flush handles the rest
    window.localStorage.setItem(EVENTS_KEY, JSON.stringify(buf.slice(-200)));
    scheduleFlush();
  } catch {
    /* never break the app for analytics */
  }
}

let flushTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushEvents();
  }, 15000);
}

export async function flushEvents(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(EVENTS_KEY);
    if (!raw) return;
    const buf = JSON.parse(raw) as EventRow[];
    if (buf.length === 0) return;
    const res = await fetch(`${EVENTS_WORKER}/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: buf }),
    });
    if (res.ok) window.localStorage.removeItem(EVENTS_KEY);
  } catch {
    /* retry next flush */
  }
}

// flush on tab close so nothing is lost
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flushEvents();
  });
}
