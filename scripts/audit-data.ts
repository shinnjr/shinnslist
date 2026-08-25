import { readFileSync } from 'node:fs';

const env: Record<string, string> = {};
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const i = line.indexOf('=');
  if (i > 0) env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;

async function all(): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = [];
  let offset = 0;
  for (;;) {
    const res = await fetch(`${URL}/rest/v1/grant_opportunities?select=*&limit=1000&offset=${offset}`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
    if (!res.ok) throw new Error(String(res.status));
    const rows = (await res.json()) as Record<string, unknown>[];
    out.push(...rows);
    if (rows.length < 1000) break;
    offset += 1000;
  }
  return out;
}

async function main() {
  try {
    const grants = await all();
    const src = new Map<string, number>();
    const geo = new Map<string, number>();
    const cat = new Map<string, number>();
    let noLocation = 0;
    let hasStates = 0;
    let hasServiceFocus = 0;
    let junkCandidates: string[] = [];

    for (const g of grants) {
      const er = (g.eligibility_rules || {}) as Record<string, unknown>;
      const sourceType = String(er.source_type || '(none)');
      const geography = String(er.geography || '(none)');
      const states = Array.isArray(er.states) ? er.states : [];
      const serviceFocus = Array.isArray(er.service_focus) ? er.service_focus : [];
      const category = String(g.category || '(none)');
      const entityTypes = Array.isArray(er.entity_types) ? er.entity_types : [];

      src.set(sourceType, (src.get(sourceType) || 0) + 1);
      geo.set(geography, (geo.get(geography) || 0) + 1);
      cat.set(category, (cat.get(category) || 0) + 1);
      if (states.length) hasStates++;
      if (serviceFocus.length) hasServiceFocus++;
      if (!geography || geography === '(none)' || geography === '') {
        if (!states.length) noLocation++;
      }
      if ((!geography || geography === '(none)') && !states.length && !serviceFocus.length) {
        junkCandidates.push(String(g.name || '').slice(0, 60));
      }
    }

    console.log('TOTAL:', grants.length);
    console.log('\n=== source_type ===');
    [...src.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
    console.log('\n=== geography ===');
    [...geo.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
    console.log('\n=== top categories ===');
    [...cat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
    console.log('\nhas states:', hasStates, '| has service_focus:', hasServiceFocus, '| NO location at all:', noLocation);
    console.log('\n=== junk candidates (no location + no service_focus), count:', junkCandidates.length, '===');
    console.log(junkCandidates.slice(0, 60).join('\n'));
  } catch (e) {
    console.error('ERR', (e as Error).message);
  }
}

main();
