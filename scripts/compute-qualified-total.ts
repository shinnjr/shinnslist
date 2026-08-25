import { scoreGrant } from '../functions/_lib/grants';
import { readFileSync } from 'node:fs';

const env: Record<string, string> = {};
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const i = line.indexOf('=');
  if (i > 0) env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;

async function fetchAllGrants(): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = [];
  let offset = 0;
  for (;;) {
    const res = await fetch(`${URL}/rest/v1/grant_opportunities?select=*&limit=1000&offset=${offset}`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    const rows = (await res.json()) as Record<string, unknown>[];
    out.push(...rows);
    if (rows.length < 1000) break;
    offset += 1000;
  }
  return out;
}

const profile: Record<string, unknown> = {
  applicant_type: 'individual',
  legal_name: 'Test Person',
  public_name: 'Test Person',
  city: 'Denver',
  state: 'Colorado',
  reusable_facts: {
    dob: '1990-01-01',
    household_size: '3',
    income_range: 'under_50k',
    gender: 'female',
    identity_flags: ['single_parent', 'woman'],
    needs: ['childcare', 'housing', 'utilities'],
    veteran: false,
    disability: false,
    immigration_status: '',
  },
};

function tierOf(g: Record<string, unknown>): 'benefit' | 'assistance' | 'competitive' | 'neutral' {
  const rules = (g.eligibility_rules || {}) as Record<string, unknown>;
  const source = String(rules.source_type || '').toLowerCase();
  if (source === 'federal_benefit') return 'benefit';
  const cat = String(g.category || '').toLowerCase();
  const assistance = new Set(['housing', 'emergency_relief', 'health', 'transportation', 'vocational_training', 'seniors', 'disability', 'veterans', 'workforce']);
  const competitive = new Set(['science_research', 'small_business', 'arts_culture', 'technology', 'environment', 'sports_athletics', 'entrepreneur']);
  if (assistance.has(cat)) return 'assistance';
  if (competitive.has(cat)) return 'competitive';
  return 'neutral';
}

const fmt = (c: number) => '$' + Math.round(c / 100).toLocaleString('en-US');

async function main() {
  const grants = await fetchAllGrants();
  const eligible = grants
    .map((g) => ({ g, m: scoreGrant(profile, g) }))
    .filter((s) => s.m.status === 'eligible');

  const buckets: Record<string, { count: number; cents: number; names: string[] }> = {
    benefit: { count: 0, cents: 0, names: [] },
    assistance: { count: 0, cents: 0, names: [] },
    competitive: { count: 0, cents: 0, names: [] },
    neutral: { count: 0, cents: 0, names: [] },
  };

  let totalCents = 0;
  let withAmount = 0;
  for (const s of eligible) {
    const min = Number(s.g.amount_min_cents) || 0;
    const max = Number(s.g.amount_max_cents) || 0;
    const upTo = max || min;
    if (upTo <= 0) continue;
    withAmount++;
    totalCents += upTo;
    const t = tierOf(s.g as Record<string, unknown>);
    buckets[t].count++;
    buckets[t].cents += upTo;
    if (buckets[t].names.length < 8) buckets[t].names.push(String(s.g.name).slice(0, 46));
  }

  console.log('ELIGIBLE total:', eligible.length, '| with a published amount:', withAmount);
  console.log('\n=== "UP TO" TOTAL ===');
  console.log('  up to', fmt(totalCents), 'we found for this person');
  console.log('\n=== breakdown ===');
  console.log('  benefit (receive if qualify): ', fmt(buckets.benefit.cents), `(${buckets.benefit.count} programs)`);
  console.log('  assistance (high likelihood):', fmt(buckets.assistance.cents), `(${buckets.assistance.count} programs)`);
  console.log('  competitive (not certain):   ', fmt(buckets.competitive.cents), `(${buckets.competitive.count} programs)`);
  console.log('  neutral/other:               ', fmt(buckets.neutral.cents), `(${buckets.neutral.count} programs)`);

  console.log('\n=== benefit names ===');
  buckets.benefit.names.forEach((n) => console.log('  -', n));
  console.log('=== assistance names ===');
  buckets.assistance.names.forEach((n) => console.log('  -', n));
}

main();
