// Subscription entitlement — localStorage-based (zero-friction: no account needed).
// The product is SPEED and CONVENIENCE; deals are public, so client gating is honest.

export interface SubState {
  allIn: boolean; // everything unlocked (Pro / all-verticals)
  verticals: string[]; // individually unlocked vertical slugs
  plan?: string; // lookup key of what they bought
  since: number;
}

const KEY = 'shinnslist_sub';

export function getSub(): SubState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const sub = JSON.parse(raw) as SubState;
    if (!sub || typeof sub !== 'object') return null;
    return sub;
  } catch {
    return null;
  }
}

export function isUnlocked(verticalSlug: string): boolean {
  const sub = getSub();
  if (!sub) return false;
  if (sub.allIn) return true;
  return sub.verticals.includes(verticalSlug);
}

/** Record a subscription purchase. Called on checkout success redirect. */
export function recordSub(plan: string, verticalSlug: string | null): SubState {
  const prev = getSub();
  const verticals = new Set(prev?.verticals || []);
  if (verticalSlug) verticals.add(verticalSlug);
  const allIn = prev?.allIn || plan === 'pro' || plan === 'pro-flipper';
  const sub: SubState = { allIn, verticals: [...verticals], plan, since: Date.now() };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(sub));
  } catch {
    /* storage full/blocked — ignore */
  }
  return sub;
}

/** Read onboarding prefs (categories, interest cards, projects). */
export interface Prefs {
  groupings: string[];
  cards: string[];
  projects: string[];
}

export function getPrefs(): Prefs | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('shinnslist_prefs');
    if (!raw) return null;
    return JSON.parse(raw) as Prefs;
  } catch {
    return null;
  }
}

export function categorySlug(category: string): string {
  return (category || '').toLowerCase().replace(/_/g, '-');
}
