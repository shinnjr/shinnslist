// Supabase helpers for Cloudflare Pages Functions.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const _clients = new WeakMap<object, SupabaseClient>();

export function serviceClient(env: Record<string, unknown>): SupabaseClient {
  const url = (env.NEXT_PUBLIC_SUPABASE_URL as string) || '';
  const key = (env.SUPABASE_SERVICE_ROLE_KEY as string) || '';
  let c = _clients.get(env);
  if (!c) {
    c = createClient(url, key);
    _clients.set(env, c);
  }
  return c;
}

/**
 * Authenticated Supabase client from a request cookie/header token.
 * We rely on the service-role client + the user id we can read from the
 * Supabase access token in the `sb-<ref>-auth-token` cookie.
 */
export async function userIdFromRequest(
  request: Request,
  env: Record<string, unknown>
): Promise<{ id: string; email?: string } | null> {
  const token = authTokenFromRequest(request);
  if (!token) return null;

  const url = (env.NEXT_PUBLIC_SUPABASE_URL as string) || '';
  const anon = (env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) || '';
  const authClient = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await authClient.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? undefined };
}

function authTokenFromRequest(request: Request): string | null {
  // Authorization: Bearer <jwt> takes precedence.
  const auth = request.headers.get('authorization');
  if (auth?.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();

  // Supabase session cookie: sb-<project-ref>-auth-token = JSON[access_token, refresh_token, ...]
  const cookies = parseCookies(request.headers.get('cookie') || '');
  for (const [name, value] of Object.entries(cookies)) {
    if (name.startsWith('sb-') && name.endsWith('-auth-token')) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed) && typeof parsed[0] === 'string') return parsed[0];
        if (typeof value === 'string' && value.startsWith('eyJ')) return value;
      } catch {
        /* not JSON — ignore */
      }
    }
  }
  return null;
}

export function parseCookies(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    let v = part.slice(idx + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    if (k) out[k] = v;
  }
  return out;
}
