import type { EngineEnv, GrantRecord } from './types';

function supabaseFetch(env: EngineEnv, path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      ...(init.headers || {}),
    },
  });
}

export async function fetchExistingSlugs(env: EngineEnv): Promise<Set<string>> {
  const res = await supabaseFetch(env, 'grant_opportunities?select=slug', { method: 'GET' });
  if (!res.ok) return new Set();
  const rows = (await res.json()) as Array<{ slug: string }>;
  return new Set(rows.map((r) => r.slug));
}

export async function upsertGrants(env: EngineEnv, grants: GrantRecord[]): Promise<number> {
  if (!grants.length) return 0;
  const res = await supabaseFetch(env, 'grant_opportunities?on_conflict=slug', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(grants),
  });
  if (!res.ok) {
    throw new Error(`Supabase upsert failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  }
  return grants.length;
}
