import type { GrantRecord } from './types';
import { hasScamSignal } from './normalize';

export function passesVerification(g: GrantRecord): { ok: boolean; reason?: string } {
  if (hasScamSignal(`${g.name} ${g.summary} ${g.eligibility_text}`)) {
    return { ok: false, reason: 'scam-signal' };
  }
  if (g.fee_cents > 0) {
    return { ok: false, reason: 'application-fee' };
  }
  if (!g.source_url) {
    return { ok: false, reason: 'no-source-url' };
  }
  return { ok: true };
}

/** Liveness probe (for non-authoritative sources). HEAD first, GET fallback. */
export async function isUrlAlive(url: string): Promise<boolean> {
  if (!url) return false;
  const headers = { 'User-Agent': 'Mozilla/5.0 (Shinnslist Grant Engine; +https://shinnslist.com)' };
  try {
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(12000), headers });
    if (res.ok) return true;
    if (res.status === 403 || res.status === 405) {
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(12000), headers });
      return res.ok;
    }
    return false;
  } catch {
    return false;
  }
}
