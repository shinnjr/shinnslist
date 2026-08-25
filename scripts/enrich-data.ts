// Grant-data enrichment: extract location (state) from name/summary for the ~1,225
// longtail rows that have no geography/states, and fix obvious category mis-tags
// (vehicle/transport programs tagged "housing").
// DRY RUN by default. Set APPLY=1 to write. Only ever ADDS location + fixes category;
// never deletes. Fully reversible (we can blank states/category back out).
import { readFileSync } from 'node:fs';

const APPLY = process.argv.includes('--apply');

const env: Record<string, string> = {};
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const i = line.indexOf('=');
  if (i > 0) env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;

// --- US state lexicon ---
const STATE_ABBREV: Record<string, string> = {
  alabama: 'Alabama', alaska: 'Alaska', arizona: 'Arizona', arkansas: 'Arkansas',
  california: 'California', colorado: 'Colorado', connecticut: 'Connecticut',
  delaware: 'Delaware', 'district of columbia': 'District of Columbia', florida: 'Florida',
  georgia: 'Georgia', hawaii: 'Hawaii', idaho: 'Idaho', illinois: 'Illinois',
  indiana: 'Indiana', iowa: 'Iowa', kansas: 'Kansas', kentucky: 'Kentucky',
  louisiana: 'Louisiana', maine: 'Maine', maryland: 'Maryland', massachusetts: 'Massachusetts',
  michigan: 'Michigan', minnesota: 'Minnesota', mississippi: 'Mississippi', missouri: 'Missouri',
  montana: 'Montana', nebraska: 'Nebraska', nevada: 'Nevada', 'new hampshire': 'New Hampshire',
  'new jersey': 'New Jersey', 'new mexico': 'New Mexico', 'new york': 'New York',
  'north carolina': 'North Carolina', 'north dakota': 'North Dakota', ohio: 'Ohio',
  oklahoma: 'Oklahoma', oregon: 'Oregon', pennsylvania: 'Pennsylvania',
  'rhode island': 'Rhode Island', 'south carolina': 'South Carolina', 'south dakota': 'South Dakota',
  tennessee: 'Tennessee', texas: 'Texas', utah: 'Utah', vermont: 'Vermont',
  virginia: 'Virginia', washington: 'Washington', 'west virginia': 'West Virginia',
  wisconsin: 'Wisconsin', wyoming: 'Wyoming', 'puerto rico': 'Puerto Rico',
  al: 'Alabama', ak: 'Alaska', az: 'Arizona', ar: 'Arkansas', ca: 'California',
  co: 'Colorado', ct: 'Connecticut', de: 'Delaware', dc: 'District of Columbia',
  fl: 'Florida', ga: 'Georgia', hi: 'Hawaii', id: 'Idaho', il: 'Illinois', in: 'Indiana',
  ia: 'Iowa', ks: 'Kansas', ky: 'Kentucky', la: 'Louisiana', me: 'Maine', md: 'Maryland',
  ma: 'Massachusetts', mi: 'Michigan', mn: 'Minnesota', ms: 'Mississippi', mo: 'Missouri',
  mt: 'Montana', ne: 'Nebraska', nv: 'Nevada', nh: 'New Hampshire', nj: 'New Jersey',
  nm: 'New Mexico', ny: 'New York', nc: 'North Carolina', nd: 'North Dakota', oh: 'Ohio',
  ok: 'Oklahoma', or: 'Oregon', pa: 'Pennsylvania', ri: 'Rhode Island', sc: 'South Carolina',
  sd: 'South Dakota', tn: 'Tennessee', tx: 'Texas', ut: 'Utah', vt: 'Vermont', va: 'Virginia',
  wa: 'Washington', wv: 'West Virginia', wi: 'Wisconsin', wy: 'Wyoming',
};

// Major cities → state (used to place "St Vincent de Paul Detroit" etc.)
const CITY_STATE: Record<string, string> = {
  detroit: 'Michigan', phoenix: 'Arizona', tucson: 'Arizona', mesa: 'Arizona',
  'los angeles': 'California', 'san francisco': 'California', 'san diego': 'California',
  sacramento: 'California', oakland: 'California', 'san jose': 'California', fresno: 'California',
  'long beach': 'California', oklahoma: 'Oklahoma', 'oklahoma city': 'Oklahoma', tulsa: 'Oklahoma',
  dallas: 'Texas', houston: 'Texas', austin: 'Texas', 'san antonio': 'Texas', 'fort worth': 'Texas',
  'el paso': 'Texas', denver: 'Colorado', 'colorado springs': 'Colorado', aurora: 'Colorado',
  boulder: 'Colorado', seattle: 'Washington', spokane: 'Washington',
  tacoma: 'Washington', portland: 'Oregon', salem: 'Oregon', boise: 'Idaho',
  'salt lake city': 'Utah', 'las vegas': 'Nevada', reno: 'Nevada',
  albuquerque: 'New Mexico', 'santa fe': 'New Mexico', minneapolis: 'Minnesota',
  'st. paul': 'Minnesota', 'saint paul': 'Minnesota', chicago: 'Illinois', springfield: 'Illinois',
  indianapolis: 'Indiana', cleveland: 'Ohio', cincinnati: 'Ohio', toledo: 'Ohio',
  pittsburgh: 'Pennsylvania', philadelphia: 'Pennsylvania', 'new york': 'New York', brooklyn: 'New York',
  buffalo: 'New York', rochester: 'New York', syracuse: 'New York', albany: 'New York',
  boston: 'Massachusetts', worcester: 'Massachusetts', baltimore: 'Maryland',
  'washington_dc': 'District of Columbia',
  atlanta: 'Georgia', miami: 'Florida', tampa: 'Florida', orlando: 'Florida', jacksonville: 'Florida',
  'st. louis': 'Missouri', 'saint louis': 'Missouri', 'kansas city': 'Missouri', 'kansas_city': 'Missouri', nashville: 'Tennessee',
  memphis: 'Tennessee', louisville: 'Kentucky', 'new orleans': 'Louisiana',
  charlotte: 'North Carolina', raleigh: 'North Carolina', durham: 'North Carolina', omaha: 'Nebraska',
  milwaukee: 'Wisconsin', madison: 'Wisconsin', 'des moines': 'Iowa', wichita: 'Kansas',
  honolulu: 'Hawaii', anchorage: 'Alaska', birmingham: 'Alabama', montgomery: 'Alabama', sealaska: 'Alaska',
  'little rock': 'Arkansas', richmond: 'Virginia',
  norfolk: 'Virginia', fargo: 'North Dakota', sioux: 'South Dakota',
  billings: 'Montana', cheyenne: 'Wyoming', manchester: 'New Hampshire', burlington: 'Vermont',
  hartford: 'Connecticut', providence: 'Rhode Island',
};

// Vehicle/transport programs mis-tagged as housing/community. Name-only, tight keywords.
const VEHICLE_KEYWORDS = /vehicle|vehicles|wheels|transport|transportation|automobile|automotive|garage|driv|mobility|road to recovery|car donation/i;

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

function detectState(name: string, summary: string, eligibility = ''): string | null {
  // Normalize ambiguous phrases so demographic/place words can't misfire:
  //  - "washington dc / washington, dc / washington d.c." → DC, not the state
  //  - "alaska native(s)" / "native alaskan(s)" / "native hawaiian(s)" are DEMOGRAPHICS, not locations
  //  - "kansas city" → the city key, not the state "kansas" (Kansas City is split; key = Missouri)
  let text = `${name} ${summary} ${eligibility}`.toLowerCase()
    .replace(/\bwashington\s*,?\s*d\.?\s*c\.?\b/g, 'washington_dc')
    .replace(/\balaska\s+natives?\b|\bnative\s+alaskans?\b/g, 'alaska_native_demographic')
    .replace(/\bnative\s+hawaiians?\b/g, 'native_hawaiian_demographic')
    .replace(/\bkansas\s+city\b/g, 'kansas_city');

  // Multi-city example lists ("SF, LA, Chicago, etc.") are NOT single locations —
  // a wrong location hides a grant from the right people, so under-detect instead.
  // Only fire "etc." when the token right before it is a known city/state
  // (so "grant types (Project, Career-Spanning, etc.)" does NOT get nuked).
  if (/\betc(?:\.|\b)/i.test(text)) {
    const beforeEtc = text.split(/\betc(?:\.|\b)/i)[0].trim();
    const parts = beforeEtc.split(/[,;]\s*/).filter((p) => p.trim());
    const lastToken = (parts.pop() || '').trim();
    const cityKeys = Object.keys(CITY_STATE).sort((a, b) => b.length - a.length);
    const cityRe = new RegExp(`\\b(${cityKeys.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'i');
    if (cityRe.test(lastToken)) return null;
  }
  if (/nationwide|multiple (states|cities|locations)|local chapters|across the (country|nation|u\.?s\.?)/.test(text)) return null;

  const hits = new Set<string>();

  // 1) Multi-word city keys first ("kansas city" must win over state-name "kansas").
  const multiCities = Object.keys(CITY_STATE).filter((c) => c.includes(' ')).sort((a, b) => b.length - a.length);
  for (const city of multiCities) {
    if (new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(text)) hits.add(CITY_STATE[city]);
  }

  // 2) Full state names are unambiguous — check them NEXT.
  //    (Two-letter abbrevs are too risky: "VA"=Veterans Affairs, "or"/"in"/"me"/"ok"
  //    are words — under-detect rather than mis-detect.)
  const states = Object.keys(STATE_ABBREV).filter((s) => s.length > 3).sort((a, b) => b.length - a.length);
  for (const st of states) {
    if (new RegExp(`\\b${st.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(text)) hits.add(STATE_ABBREV[st]);
  }

  // 3) Fall back to single-word cities.
  const cities = Object.keys(CITY_STATE).filter((c) => !c.includes(' ')).sort((a, b) => b.length - a.length);
  for (const city of cities) {
    if (new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(text)) hits.add(CITY_STATE[city]);
  }

  // Multiple distinct states → ambiguous (e.g. state "Alaska" + city "Phoenix" on a
  // different row, or a multi-state org). Under-detect rather than mis-detect.
  return hits.size === 1 ? [...hits][0] : null;
}

async function main() {
  const grants = await all();
  const updates: Array<{ id: string; name: string; state: string | null; categoryFix: string | null; mergedRules: Record<string, unknown> }> = [];
  let noLocation = 0;

  for (const g of grants) {
    const er = (g.eligibility_rules || {}) as Record<string, unknown>;
    const geography = String(er.geography || '');
    const states = Array.isArray(er.states) ? er.states : [];
    const hasLocation = states.length > 0 || geography === 'all_us' || geography === 'foreign';
    const name = String(g.name || '');
    const summary = String(g.summary || '');
    let state: string | null = null;
    let categoryFix: string | null = null;

    if (!hasLocation) {
      noLocation++;
      state = detectState(name, summary, String(g.eligibility_text || ''));
    }

    // category fix: vehicle/transport tagged housing/community
    if (VEHICLE_KEYWORDS.test(name) && (g.category === 'housing' || g.category === 'community' || g.category === 'emergency_relief')) {
      categoryFix = 'transportation';
    }

    if (state || categoryFix) {
      const mergedRules: Record<string, unknown> = { ...er };
      if (state) mergedRules.states = [state];
      updates.push({ id: String(g.id), name: name.slice(0, 50), state, categoryFix, mergedRules });
    }
  }

  console.log('TOTAL:', grants.length, '| no-location rows:', noLocation);
  console.log('Would update:', updates.length, 'rows');
  const located = updates.filter((u) => u.state);
  const cats = updates.filter((u) => u.categoryFix);
  console.log('  - add state/location:', located.length);
  console.log('  - fix category (vehicle→transportation):', cats.length);

  // show state distribution
  const byState = new Map<string, number>();
  located.forEach((u) => byState.set(u.state as string, (byState.get(u.state as string) || 0) + 1));
  console.log('\nTop detected states:');
  [...byState.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([s, n]) => console.log(`  ${s}: ${n}`));

  console.log('\nAll updates:');
  for (const u of updates) {
    console.log(`  [${u.state || '-'}|${u.categoryFix || '-'}] ${u.name}`);
  }

  if (!APPLY) {
    console.log('\nDRY RUN — no writes. Re-run with --apply to write.');
    return;
  }

  // Apply: PATCH the FULL merged eligibility_rules (preserves entity_types/service_focus/etc.)
  // plus the category fix. Non-destructive merge; never deletes.
  let applied = 0;
  for (const u of updates) {
    const body: Record<string, unknown> = { eligibility_rules: u.mergedRules };
    if (u.categoryFix) body.category = u.categoryFix;
    const res = await fetch(`${URL}/rest/v1/grant_opportunities?id=eq.${encodeURIComponent(u.id)}`, {
      method: 'PATCH',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(body),
    });
    if (res.ok) applied++;
    else console.error('FAILED', u.id, res.status, u.name);
  }
  console.log(`\nAPPLIED ${applied}/${updates.length} updates.`);
}

main().catch((e) => console.error('ERR', e.message));
