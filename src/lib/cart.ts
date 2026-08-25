// Shinnslist — DFY cart + membership (localStorage, zero-friction:
// no account required to check out). Honest client gating: prices
// are informational; the server is authoritative at checkout.
import type { DfyItem } from './dfy';

export interface CartItem extends DfyItem {
  addedAt: number;
}

const CART_KEY = 'shinnslist_dfy_cart';
const MEMBER_KEY = 'shinnslist_member';

function isWindow(): boolean {
  return typeof window !== 'undefined';
}

export function getCart(): CartItem[] {
  if (!isWindow()) return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i) => i && typeof i.kind === 'string' && typeof i.slug === 'string'
    );
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]): void {
  if (!isWindow()) return;
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    /* storage full/blocked — ignore */
  }
}

export function inCart(kind: string, slug: string): boolean {
  return getCart().some((i) => i.kind === kind && i.slug === slug);
}

export function addToCart(item: DfyItem): boolean {
  const cart = getCart();
  if (cart.some((i) => i.kind === item.kind && i.slug === item.slug)) return false;
  saveCart([...cart, { ...item, addedAt: Date.now() }]);
  return true;
}

export function removeFromCart(kind: string, slug: string): void {
  saveCart(getCart().filter((i) => !(i.kind === kind && i.slug === slug)));
}

export function clearCart(): void {
  if (!isWindow()) return;
  try {
    window.localStorage.removeItem(CART_KEY);
  } catch {
    /* ignore */
  }
}

export function cartCount(): number {
  return getCart().length;
}

// --- Membership (75% off DFY, $19/mo after free first month) ---

export interface MemberState {
  since: number;
  plan: string;
}

export function getMember(): MemberState | null {
  if (!isWindow()) return null;
  try {
    const raw = window.localStorage.getItem(MEMBER_KEY);
    if (!raw) return null;
    const m = JSON.parse(raw) as MemberState;
    return m && typeof m.since === 'number' ? m : null;
  } catch {
    return null;
  }
}

export function isMember(): boolean {
  return getMember() !== null;
}

export function recordMember(plan = 'dfy-member'): MemberState {
  const m: MemberState = { since: Date.now(), plan };
  if (isWindow()) {
    try {
      window.localStorage.setItem(MEMBER_KEY, JSON.stringify(m));
    } catch {
      /* ignore */
    }
  }
  return m;
}
