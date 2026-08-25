// Browser helpers for calling Cloudflare Pages Functions aggregator APIs.
'use client';

import { createBrowserClient } from '@/lib/supabase/client';

export interface Aggregator {
  id: string;
  user_id: string;
  name: string;
  emoji: string | null;
  keywords: string[];
  categories: string[];
  sources: string[];
  min_price: number;
  max_price: number | null;
  min_deal_score: number;
  zone_id: string | null;
  active: boolean;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
  item_counts?: { unseen: number };
}

export interface AggregatorListing {
  id: string;
  title: string;
  description: string | null;
  photos: string[] | null;
  price: number;
  estimated_value: number | null;
  category: string | null;
  source: string | null;
  source_url: string | null;
  city: string | null;
  state: string | null;
  posted_at: string | null;
  flags: string[] | null;
  condition?: string | null;
}

export interface AggregatorItem {
  id: string;
  aggregator_id: string;
  listing_id: string;
  deal_score: number;
  matched_reason: string | null;
  seen: boolean;
  saved: boolean;
  created_at: string;
  listing: AggregatorListing | null;
}

export type AggregatorFilter = 'all' | 'new' | 'saved';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function authHeaders(): Promise<HeadersInit> {
  const supabase = createBrowserClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new ApiError('unauthorized', 401);
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let headers: HeadersInit;
  try {
    headers = await authHeaders();
  } catch (e) {
    if (e instanceof ApiError && e.status === 401 && typeof window !== 'undefined') {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
    }
    throw e;
  }

  const res = await fetch(path, {
    ...init,
    headers: { ...headers, ...(init?.headers || {}) },
  });

  const body = await res.json().catch(() => ({}));
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
    }
    throw new ApiError('unauthorized', 401);
  }
  if (!res.ok) {
    throw new ApiError(
      typeof body.error === 'string' ? body.error : `request_failed_${res.status}`,
      res.status
    );
  }
  return body as T;
}

export async function listAggregators(): Promise<Aggregator[]> {
  const data = await apiFetch<{ aggregators: Aggregator[] }>('/api/aggregators');
  return data.aggregators || [];
}

export async function getAggregator(id: string): Promise<Aggregator | null> {
  const all = await listAggregators();
  return all.find((a) => a.id === id) || null;
}

export async function createAggregator(
  body: Record<string, unknown>
): Promise<Aggregator> {
  const data = await apiFetch<{ aggregator: Aggregator }>('/api/aggregators', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return data.aggregator;
}

export async function updateAggregator(
  id: string,
  body: Record<string, unknown>
): Promise<Aggregator> {
  const data = await apiFetch<{ aggregator: Aggregator }>(`/api/aggregators/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return data.aggregator;
}

export async function deleteAggregator(id: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/api/aggregators/${id}`, { method: 'DELETE' });
}

export async function runAggregator(id: string): Promise<{
  inserted: number;
  total: number;
  last_run_at: string;
}> {
  return apiFetch(`/api/aggregators/${id}/run`, { method: 'POST' });
}

export async function listAggregatorItems(
  id: string,
  opts: { limit?: number; offset?: number; filter?: AggregatorFilter } = {}
): Promise<{ items: AggregatorItem[]; total: number; aggregator: Aggregator }> {
  const params = new URLSearchParams();
  if (opts.limit != null) params.set('limit', String(opts.limit));
  if (opts.offset != null) params.set('offset', String(opts.offset));
  if (opts.filter) params.set('filter', opts.filter);
  const qs = params.toString();
  return apiFetch(`/api/aggregators/${id}/items${qs ? `?${qs}` : ''}`);
}

export async function patchAggregatorItem(
  aggregatorId: string,
  itemId: string,
  body: { seen?: boolean; saved?: boolean }
): Promise<void> {
  await apiFetch(`/api/aggregators/${aggregatorId}/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return 'never';
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return 'never';
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function dealScoreLabel(score: number): string {
  if (score >= 90) return 'Only steals (90+)';
  if (score >= 70) return 'Hot deals (70+)';
  if (score >= 40) return 'Good finds (40+)';
  if (score >= 1) return `Score ≥ ${score}`;
  return 'Any deal score';
}
