// Grants.gov — the authoritative federal grant firehose (primary source, not a
// competitor crawl). Uses the official public API. Requires a free API key.
// https://api.grants.gov/v1/api/opportunities/search2  (header: X-Api-Key)
import type { EngineEnv, GrantRecord } from '../types';
import { slugify, formatAmount, inferCategory, inferDemographics, fmtDate } from '../normalize';

const GRANTS_GOV_URL = 'https://api.grants.gov/v1/api/opportunities/search2';
const MAX_PAGES = 25; // 100/page → up to 2,500 per run (bounded for worker CPU)

interface RawOpp {
  opportunityNumber?: string;
  opportunityTitle?: string;
  agencyName?: string;
  category?: unknown;
  closeDate?: string;
  awardCeiling?: number;
  awardFloor?: number;
  description?: string;
  link?: string;
  grantorContactText?: string;
  fundingActivityCategories?: unknown;
  [key: string]: unknown;
}

function firstString(v: unknown): string {
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.map(String).join(', ');
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.name === 'string') return o.name;
  }
  return '';
}

function extractOpps(raw: unknown): RawOpp[] {
  if (!raw || typeof raw !== 'object') return [];
  const obj = raw as Record<string, unknown>;
  const candidates = obj.opportunities ?? obj.data ?? obj.items ?? obj.results;
  return Array.isArray(candidates) ? (candidates as RawOpp[]) : [];
}

export function normalizeGrantsGov(raw: unknown): GrantRecord[] {
  const opps = extractOpps(raw);
  const now = new Date().toISOString();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const out: GrantRecord[] = [];

  for (const o of opps) {
    const title = (o.opportunityTitle || '').trim();
    const number = (o.opportunityNumber || '').trim();
    const agency = (o.agencyName || '').trim();
    if (!title && !number) continue;

    const deadline = typeof o.closeDate === 'string' && o.closeDate ? o.closeDate : null;
    if (deadline && new Date(deadline).getTime() < today.getTime()) continue; // skip closed

    const body = [o.description, o.grantorContactText, firstString(o.fundingActivityCategories), firstString(o.category)].join(' ');
    const category = inferCategory(`${title} ${body}`);
    const demos = inferDemographics(`${title} ${body}`);
    const link = (o.link || '').trim();

    out.push({
      slug: slugify(`${agency} ${number} ${title}`) || slugify(number || title),
      name: title || number,
      funder: agency || 'U.S. Federal Government',
      amount_label: formatAmount(
        typeof o.awardFloor === 'number' ? o.awardFloor : null,
        typeof o.awardCeiling === 'number' ? o.awardCeiling : null
      ),
      deadline,
      deadline_label: deadline ? fmtDate(deadline) : 'Rolling',
      cycle_key: new Date().getFullYear().toString(),
      status: deadline ? 'open' : 'rolling',
      category,
      summary: (o.description || '').slice(0, 500),
      eligibility_text: (o.grantorContactText || '').slice(0, 1000),
      eligibility_rules: {
        source_type: 'federal_gov',
        categories: [category],
        service_focus: demos,
        geography: 'all_us',
        entity_types: [],
        opportunity_number: number,
      },
      effort: 'moderate',
      fee_cents: 0,
      source_url: link,
      application_url: link,
      verified_at: now,
    });
  }
  return out;
}

export async function fetchGrantsGov(env: EngineEnv): Promise<{ raw: unknown; note?: string }> {
  if (!env.GRANTS_GOV_API_KEY) {
    return { raw: null, note: 'Grants.gov API key missing — set the GRANTS_GOV_API_KEY secret to enable the federal firehose' };
  }
  const collected: RawOpp[] = [];
  try {
    for (let page = 0; page < MAX_PAGES; page++) {
      const res = await fetch(GRANTS_GOV_URL, {
        method: 'POST',
        headers: { 'X-Api-Key': env.GRANTS_GOV_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: null, status: 'posted', page, size: 100, sortBy: 'closeDate|asc' }),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) {
        if (page === 0) return { raw: null, note: `Grants.gov API error ${res.status}` };
        break;
      }
      const json = (await res.json()) as Record<string, unknown>;
      const batch = extractOpps(json);
      if (!batch.length) break;
      collected.push(...batch);
    }
  } catch (e) {
    return { raw: collected, note: `partial (${String(e)})` };
  }
  return { raw: collected };
}
