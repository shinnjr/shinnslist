import { scoreGrant } from '../functions/_lib/grants';
import { readFileSync } from 'node:fs';

const env: Record<string, string> = {};
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const i = line.indexOf('=');
  if (i > 0) env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) throw new Error('missing env');

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

// A representative Colorado individual — single mom, low income, needs childcare/housing/utilities.
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

async function main() {
  const grants = await fetchAllGrants();
  const scored = grants.map((g) => ({ g, m: scoreGrant(profile, g) }));
  const eligible = scored.filter((s) => s.m.status === 'eligible').sort((a, b) => b.m.score - a.m.score);
  const needsReview = scored.filter((s) => s.m.status === 'needs_review');
  const ineligible = scored.filter((s) => s.m.status === 'ineligible');

  console.log('TOTAL in DB          :', grants.length);
  console.log('ELIGIBLE (shown)     :', eligible.length);
  console.log('NEEDS_REVIEW (shown) :', needsReview.length);
  console.log('INELIGIBLE (hidden)  :', ineligible.length);
  console.log('\n=== TOP 12 ELIGIBLE ===');
  for (const s of eligible.slice(0, 12)) {
    console.log(`[${String(s.m.score).padStart(2)}] ${s.g.name}`);
    console.log(`      ${s.m.reasons.join(' | ')}`);
  }
}

main();
