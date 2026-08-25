// POST /api/research-profile — deterministic, no-LLM "magic prefill".
// Two paths:
//   • Organization (name + optional website / pasted text) → website + IRS nonprofit records.
//   • Individual (email and/or username) → public-profile enrichment: Gravatar (email →
//     linked accounts + bio), GitHub, GitLab. Returns identity flags, needs, location,
//     and a list of discovered accounts so onboarding is near-clickless.
// No hosted AI, no spend, no secrets. Every fetch degrades to a partial profile, never a 500.
import { json, type PagesContext } from '../../_lib/http';
import { rateLimit, rateLimitedResponse } from '../../_lib/rate-limit';
import { load } from 'cheerio';

interface ResearchInput {
  name?: unknown;
  email?: unknown;
  username?: unknown;
  website?: unknown;
  text?: unknown;
}

interface DiscoveredAccount {
  platform: string;
  handle: string;
  url: string;
  displayName?: string;
  location?: string;
  bio?: string;
}

interface ResearchProfile {
  applicantType: string;
  businessName: string;
  city: string;
  state: string;
  yearsOperating: string;
  employees: string;
  revenue: string;
  identities: string[];
  mission: string;
  fundingUse: string;
  // individual enrichment extras
  identityFlags?: string[];
  needs?: string[];
  employmentStatus?: string;
  interests?: string[];
  accounts?: DiscoveredAccount[];
}

const IDENTITY_RULES: Array<{ label: string; re: RegExp }> = [
  { label: 'Woman-owned', re: /\b(women|woman|female)\b|women-?(owned|led|founded)|woman-?(owned|led|founded)/i },
  { label: 'AAPI-led', re: /\b(aapi|asian[- ]american|pacific islander|native hawaiian)\b/i },
  { label: 'Immigrant-led', re: /\b(immigrant|refugee|new[- ]american|first[- ]generation)\b/i },
  { label: 'Black-owned', re: /\bblack-?(owned|led)|african[- ]american\b/i },
  { label: 'Latino-owned', re: /\b(latino|latina|latinx|hispanic|chicano|chicana)\b/i },
  { label: 'Veteran-owned', re: /\b(veteran|military[- ]connected|service[- ]disabled)\b/i },
  { label: 'Disabled founder', re: /\b(disabilit|disabled[- ]owned|disability[- ]owned)\b/i },
  { label: 'Rural business', re: /\brural\b/i },
];

// Individual demographic / identity flags — reuse the onboarding's EXACT labels.
const INDIVIDUAL_FLAGS: Array<{ label: string; re: RegExp }> = [
  { label: 'Single parent', re: /\b(single (mom|mother|dad|father|parent)|co[- ]parent)\b/i },
  { label: 'Caregiver', re: /\b(caregiver|caretaker|carer|elder care)\b/i },
  { label: 'First-generation college', re: /\bfirst[- ]gen(eration)? (college|student|graduate)\b/i },
  { label: 'Formerly incarcerated', re: /\b(formerly incarcerated|ex[- ]con|felon|reentry|justice[- ]involved)\b/i },
  { label: 'Foster youth', re: /\b(foster (youth|care|child)|aged out of foster)\b/i },
  { label: 'Expecting / new parent', re: /\b(expecting|pregnant|new (mom|dad|parent)|baby on the way|due (in|with)|first[- ]time (mom|dad))\b/i },
  { label: 'LGBTQ+', re: /\b(lgbtq?\+?|gay|lesbian|trans(gender)?|queer|non[- ]binary|bisexual)\b/i },
  { label: 'Rural resident', re: /\b(rural|small town|farmer|farming|ranch(er)?)\b/i },
  { label: 'Low-income', re: /\b(low[- ]income|broke|struggling financially|fixed income|food insecure)\b/i },
  { label: 'Veteran', re: /\b(veteran|military|army|navy|air force|marine(s)?|served in the)\b/i },
  { label: 'Student', re: /\b(student|college|university|undergrad|graduate student|phd candidate)\b/i },
  { label: 'Immigrant', re: /\b(immigrant|refugee|asylee|asylum seeker|green card holder|permanent resident)\b/i },
  { label: 'Disabled', re: /\b(disabilit|disabled|autistic|adhd|chronic illness|chronic pain)\b/i },
];

// Individual needs — reuse the onboarding's EXACT labels.
const NEED_KEYWORDS: Array<{ label: string; re: RegExp }> = [
  { label: 'Education / retraining', re: /\b(student|school|college|university|study|degree|bootcamp|training|upskill|tuition)\b/i },
  { label: 'Housing / rent', re: /\b(housing|rent|landlord|eviction|mortgage|homeless|shelter|affordable home)\b/i },
  { label: 'Car / transportation', re: /\b(car|vehicle|transportation|transit|commute|auto repair)\b/i },
  { label: 'Food', re: /\b(food insecure|hungry|groceries|meal|snap|nutrition)\b/i },
  { label: 'Utilities', re: /\b(utilities|electric bill|water bill|heating|energy bill)\b/i },
  { label: 'Medical / health', re: /\b(medical|healthcare|hospital|surgery|therapy|medication|chronic|insurance)\b/i },
  { label: 'Childcare', re: /\b(childcare|child care|daycare|babysit|nanny|preschool)\b/i },
  { label: 'Elder care / caregiving', re: /\b(elder care|caregiver|aging parent|senior care)\b/i },
  { label: 'Home repair', re: /\b(home repair|renovation|roof|hvac|plumbing|handyman)\b/i },
  { label: 'Emergency / hardship', re: /\b(emergency|hardship|crisis|laid off|job loss|unemployed|fired|eviction)\b/i },
  { label: 'Starting or growing a business', re: /\b(founder|entrepreneur|startup|small business|self[- ]employed|freelance|side hustle|side business)\b/i },
];

// US state 2-letter codes for reliable location parsing.
const US_STATE_CODES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
]);

const STATE_NAMES: Record<string, string> = {
  'alabama':'AL','alaska':'AK','arizona':'AZ','arkansas':'AR','california':'CA','colorado':'CO',
  'connecticut':'CT','delaware':'DE','florida':'FL','georgia':'GA','hawaii':'HI','idaho':'ID',
  'illinois':'IL','indiana':'IN','iowa':'IA','kansas':'KS','kentucky':'KY','louisiana':'LA',
  'maine':'ME','maryland':'MD','massachusetts':'MA','michigan':'MI','minnesota':'MN',
  'mississippi':'MS','missouri':'MO','montana':'MT','nebraska':'NE','nevada':'NV',
  'new hampshire':'NH','new jersey':'NJ','new mexico':'NM','new york':'NY',
  'north carolina':'NC','north dakota':'ND','ohio':'OH','oklahoma':'OK','oregon':'OR',
  'pennsylvania':'PA','rhode island':'RI','south carolina':'SC','south dakota':'SD',
  'tennessee':'TN','texas':'TX','utah':'UT','vermont':'VT','virginia':'VA',
  'washington':'WA','west virginia':'WV','wisconsin':'WI','wyoming':'WY','district of columbia':'DC',
};

async function fetchJson(url: string, timeoutMs = 5000): Promise<Record<string, unknown> | Record<string, unknown>[] | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ShinnslistProfileBot/1.0; +https://shinnslist.com)' },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeWebsite(raw: unknown): string {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

function extractYear(text: string): number {
  const m = text.match(/(?:©|&copy;|\(c\)|copyright|est\.?|founded|established|since)\s*[^\d]{0,14}((?:19|20)\d{2})/i);
  return m ? parseInt(m[1], 10) : 0;
}

function yearsBucket(foundedYear: number): string {
  const now = new Date().getFullYear();
  if (!foundedYear || foundedYear < 1900 || foundedYear > now + 1) return '';
  const age = now - foundedYear;
  if (age < 0) return 'Pre-launch';
  if (age < 1) return 'Under 1 year';
  if (age <= 2) return '1–2 years';
  if (age <= 5) return '3–5 years';
  return '6+ years';
}

function revenueBucket(totalRevenue: number): string {
  if (!Number.isFinite(totalRevenue) || totalRevenue < 0) return '';
  if (totalRevenue === 0) return 'Pre-revenue';
  if (totalRevenue < 50000) return 'Under $50K';
  if (totalRevenue < 250000) return '$50K–$250K';
  if (totalRevenue < 1000000) return '$250K–$1M';
  return '$1M+';
}

function classifyApplicantType(corpus: string, irsNtee: string | null): string {
  const hasNonprofit = irsNtee !== null || /\b(501\s*\(?\s*c\s*\)?\s*\(?\s*3|nonprofit|non-profit|not[- ]for[- ]profit|charity|charitable|foundation)\b/i.test(corpus);
  if (hasNonprofit) return 'Nonprofit';
  if (/\b(llc|l\.l\.c\.|inc\.?|corp\.?|corporation|company|co\.|llp|small business|startup)\b/i.test(corpus)) return 'Small business';
  if (/\b(collective|initiative|community (project|program)|grassroots)\b/i.test(corpus)) return 'Community project';
  return 'Sole founder / individual';
}

function detectLocation(text: string, jsonLd: Record<string, unknown>[]): { city: string; state: string } {
  for (const node of jsonLd) {
    const addr = findAddress(node);
    if (addr && (addr.city || addr.state)) {
      const st = addr.state && addr.state.length === 2 ? addr.state.toUpperCase() : (addr.state ? STATE_NAMES[addr.state.toLowerCase()] ?? '' : '');
      return { city: (addr.city ?? '').slice(0, 60), state: st || (addr.state ?? '').slice(0, 30) };
    }
  }
  const m = text.match(/\b([A-Z][a-zA-Z.' -]{2,40}),?\s+([A-Z]{2})\b/);
  if (m && US_STATE_CODES.has(m[2])) return { city: m[1], state: m[2] };
  return { city: '', state: '' };
}

function findAddress(node: unknown): { city?: string; state?: string } | null {
  if (!node || typeof node !== 'object') return null;
  const obj = node as Record<string, unknown>;
  if (obj.address && typeof obj.address === 'object') {
    const a = obj.address as Record<string, unknown>;
    return { city: typeof a.addressLocality === 'string' ? a.addressLocality : undefined, state: typeof a.addressRegion === 'string' ? a.addressRegion : undefined };
  }
  if (typeof obj.addressLocality === 'string' || typeof obj.addressRegion === 'string') {
    return { city: typeof obj.addressLocality === 'string' ? obj.addressLocality : undefined, state: typeof obj.addressRegion === 'string' ? obj.addressRegion : undefined };
  }
  return null;
}

function parseJsonLd(html: string): Record<string, unknown>[] {
  const blocks: Record<string, unknown>[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1].trim());
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of arr) if (item && typeof item === 'object') blocks.push(item as Record<string, unknown>);
    } catch { /* ignore malformed blocks */ }
  }
  return blocks;
}

function cleanMission(raw: string): string {
  const text = raw.replace(/\s+/g, ' ').replace(/^["'\s]+|["'\s]+$/g, '').trim();
  const sentences = text.match(/[^.!?]+[.!?]?/g);
  let out = '';
  if (sentences) {
    for (let i = 0; i < sentences.length && out.length < 200; i++) out += sentences[i];
  } else {
    out = text;
  }
  return out.trim().slice(0, 240);
}

async function scrapeWebsite(url: string): Promise<{ html: string; text: string; title: string; description: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ShinnslistProfileBot/1.0; +https://shinnslist.com)' },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return { html: '', text: '', title: '', description: '' };
    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('html') && !ct.includes('text')) return { html: '', text: '', title: '', description: '' };
    const html = (await res.text()).slice(0, 400000);
    const $ = load(html);
    const title = $('title').first().text().replace(/\s+/g, ' ').trim();
    const description = ($('meta[name="description"]').attr('content') ?? $('meta[property="og:description"]').attr('content') ?? '').replace(/\s+/g, ' ').trim();
    $('script, style, noscript, nav, footer, header').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    return { html, text, title, description };
  } catch {
    return { html: '', text: '', title: '', description: '' };
  }
}

interface IrsOrg {
  ein: string;
  name: string;
  city: string | null;
  state: string | null;
  ntee_code: string | null;
  ruling_date: string | null;
  total_revenue: number | null;
}

async function lookupNonprofit(name: string): Promise<IrsOrg | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`https://projects.propublica.org/nonprofits/api/v2/search.json?q=${encodeURIComponent(name)}`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as { organizations?: Array<Record<string, unknown>> };
    const orgs = data.organizations ?? [];
    if (!orgs.length) return null;
    const target = name.toLowerCase();
    const best = orgs.find((o) => String(o.name ?? '').toLowerCase() === target) ?? orgs[0];
    const ein = String(best.ein ?? '');
    const base: IrsOrg = {
      ein,
      name: String(best.name ?? ''),
      city: best.city ? String(best.city) : null,
      state: best.state ? String(best.state) : null,
      ntee_code: best.ntee_code ? String(best.ntee_code) : null,
      ruling_date: best.ruling_date ? String(best.ruling_date) : null,
      total_revenue: null,
    };
    if (!ein) return base;
    try {
      const c2 = new AbortController();
      const t2 = setTimeout(() => c2.abort(), 5000);
      const dres = await fetch(`https://projects.propublica.org/nonprofits/api/v2/organizations/${ein}.json`, { signal: c2.signal });
      clearTimeout(t2);
      if (dres.ok) {
        const detail = (await dres.json()) as { organization?: { filings_with_data?: Array<{ totalrevenue?: number }> } };
        const filings = detail.organization?.filings_with_data ?? [];
        if (filings.length && Number.isFinite(filings[0].totalrevenue)) base.total_revenue = Number(filings[0].totalrevenue);
      }
    } catch { /* non-fatal */ }
    return base;
  } catch {
    return null;
  }
}

// ---------- Individual (email / username) enrichment ----------

function gravatarHash(email: string): string {
  return md5(email.toLowerCase().trim());
}

// Pure-JS MD5 (RFC 1321) — no node:crypto / nodejs_compat dependency on the edge.
function md5(input: string): string {
  const cmn = (q: number, a: number, b: number, x: number, s: number, t: number): number => {
    a = (((a + q) | 0) + ((x + t) | 0)) | 0;
    return (((a << s) | (a >>> (32 - s))) + b) | 0;
  };
  const ff = (a: number, b: number, c: number, d: number, x: number, s: number, t: number): number => cmn((b & c) | (~b & d), a, b, x, s, t);
  const gg = (a: number, b: number, c: number, d: number, x: number, s: number, t: number): number => cmn((b & d) | (c & ~d), a, b, x, s, t);
  const hh = (a: number, b: number, c: number, d: number, x: number, s: number, t: number): number => cmn(b ^ c ^ d, a, b, x, s, t);
  const ii = (a: number, b: number, c: number, d: number, x: number, s: number, t: number): number => cmn(c ^ (b | ~d), a, b, x, s, t);

  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) bytes.push(input.charCodeAt(i) & 0xff);
  const origLen = bytes.length;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  const bitLen = origLen * 8;
  for (let i = 0; i < 4; i++) bytes.push((bitLen >>> (i * 8)) & 0xff);
  for (let i = 0; i < 4; i++) bytes.push(0);

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;

  for (let bs = 0; bs < bytes.length; bs += 64) {
    const M = new Array<number>(16).fill(0);
    for (let i = 0; i < 16; i++) {
      M[i] = bytes[bs + i * 4] | (bytes[bs + i * 4 + 1] << 8) | (bytes[bs + i * 4 + 2] << 16) | (bytes[bs + i * 4 + 3] << 24);
    }
    let A = a0, B = b0, C = c0, D = d0;

    A = ff(A, B, C, D, M[0], 7, 0xd76aa478); D = ff(D, A, B, C, M[1], 12, 0xe8c7b756);
    C = ff(C, D, A, B, M[2], 17, 0x242070db); B = ff(B, C, D, A, M[3], 22, 0xc1bdceee);
    A = ff(A, B, C, D, M[4], 7, 0xf57c0faf); D = ff(D, A, B, C, M[5], 12, 0x4787c62a);
    C = ff(C, D, A, B, M[6], 17, 0xa8304613); B = ff(B, C, D, A, M[7], 22, 0xfd469501);
    A = ff(A, B, C, D, M[8], 7, 0x698098d8); D = ff(D, A, B, C, M[9], 12, 0x8b44f7af);
    C = ff(C, D, A, B, M[10], 17, 0xffff5bb1); B = ff(B, C, D, A, M[11], 22, 0x895cd7be);
    A = ff(A, B, C, D, M[12], 7, 0x6b901122); D = ff(D, A, B, C, M[13], 12, 0xfd987193);
    C = ff(C, D, A, B, M[14], 17, 0xa679438e); B = ff(B, C, D, A, M[15], 22, 0x49b40821);

    A = gg(A, B, C, D, M[1], 5, 0xf61e2562); D = gg(D, A, B, C, M[6], 9, 0xc040b340);
    C = gg(C, D, A, B, M[11], 14, 0x265e5a51); B = gg(B, C, D, A, M[0], 20, 0xe9b6c7aa);
    A = gg(A, B, C, D, M[5], 5, 0xd62f105d); D = gg(D, A, B, C, M[10], 9, 0x02441453);
    C = gg(C, D, A, B, M[15], 14, 0xd8a1e681); B = gg(B, C, D, A, M[4], 20, 0xe7d3fbc8);
    A = gg(A, B, C, D, M[9], 5, 0x21e1cde6); D = gg(D, A, B, C, M[14], 9, 0xc33707d6);
    C = gg(C, D, A, B, M[3], 14, 0xf4d50d87); B = gg(B, C, D, A, M[8], 20, 0x455a14ed);
    A = gg(A, B, C, D, M[13], 5, 0xa9e3e905); D = gg(D, A, B, C, M[2], 9, 0xfcefa3f8);
    C = gg(C, D, A, B, M[7], 14, 0x676f02d9); B = gg(B, C, D, A, M[12], 20, 0x8d2a4c8a);

    A = hh(A, B, C, D, M[5], 4, 0xfffa3942); D = hh(D, A, B, C, M[8], 11, 0x8771f681);
    C = hh(C, D, A, B, M[11], 16, 0x6d9d6122); B = hh(B, C, D, A, M[14], 23, 0xfde5380c);
    A = hh(A, B, C, D, M[1], 4, 0xa4beea44); D = hh(D, A, B, C, M[4], 11, 0x4bdecfa9);
    C = hh(C, D, A, B, M[7], 16, 0xf6bb4b60); B = hh(B, C, D, A, M[10], 23, 0xbebfbc70);
    A = hh(A, B, C, D, M[13], 4, 0x289b7ec6); D = hh(D, A, B, C, M[0], 11, 0xeaa127fa);
    C = hh(C, D, A, B, M[3], 16, 0xd4ef3085); B = hh(B, C, D, A, M[6], 23, 0x04881d05);
    A = hh(A, B, C, D, M[9], 4, 0xd9d4d039); D = hh(D, A, B, C, M[12], 11, 0xe6db99e5);
    C = hh(C, D, A, B, M[15], 16, 0x1fa27cf8); B = hh(B, C, D, A, M[2], 23, 0xc4ac5665);

    A = ii(A, B, C, D, M[0], 6, 0xf4292244); D = ii(D, A, B, C, M[7], 10, 0x432aff97);
    C = ii(C, D, A, B, M[14], 15, 0xab9423a7); B = ii(B, C, D, A, M[5], 21, 0xfc93a039);
    A = ii(A, B, C, D, M[12], 6, 0x655b59c3); D = ii(D, A, B, C, M[3], 10, 0x8f0ccc92);
    C = ii(C, D, A, B, M[10], 15, 0xffeff47d); B = ii(B, C, D, A, M[1], 21, 0x85845dd1);
    A = ii(A, B, C, D, M[8], 6, 0x6fa87e4f); D = ii(D, A, B, C, M[15], 10, 0xfe2ce6e0);
    C = ii(C, D, A, B, M[6], 15, 0xa3014314); B = ii(B, C, D, A, M[13], 21, 0x4e0811a1);
    A = ii(A, B, C, D, M[4], 6, 0xf7537e82); D = ii(D, A, B, C, M[11], 10, 0xbd3af235);
    C = ii(C, D, A, B, M[2], 15, 0x2ad7d2bb); B = ii(B, C, D, A, M[9], 21, 0xeb86d391);

    a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0;
  }

  const hex = '0123456789abcdef';
  const toHex = (v: number): string => {
    let out = '';
    for (let i = 0; i < 4; i++) out += hex[(v >>> (i * 8 + 4)) & 0x0f] + hex[(v >>> (i * 8)) & 0x0f];
    return out;
  };
  return toHex(a0) + toHex(b0) + toHex(c0) + toHex(d0);
}

async function enrichGravatar(email: string, accounts: DiscoveredAccount[]): Promise<string> {
  const hash = gravatarHash(email);
  for (const base of ['https://www.gravatar.com', 'https://en.gravatar.com']) {
    const data = await fetchJson(`${base}/${hash}.json`);
    if (!data) continue;
    const entry = (data as Record<string, unknown>).entry;
    const first = Array.isArray(entry) && entry.length ? (entry[0] as Record<string, unknown>) : null;
    if (!first) continue;
    const bio = String(first.aboutMe ?? '');
    const loc = String(first.currentLocation ?? '');
    const name = String(first.displayName ?? first.preferredUsername ?? '');
    const linked = Array.isArray(first.accounts) ? first.accounts : [];
    for (const a of linked) {
      const item = a as Record<string, unknown>;
      const domain = String(item.domain ?? '').replace(/^https?:\/\//, '').split('/')[0];
      const handle = String(item.username ?? '');
      const url = String(item.url ?? '');
      if (domain || url) accounts.push({ platform: domain || 'linked', handle, url });
    }
    return [name, bio, loc].filter(Boolean).join(' · ');
  }
  return '';
}

async function enrichGitHubByEmail(email: string, accounts: DiscoveredAccount[]): Promise<string> {
  const data = await fetchJson(`https://api.github.com/search/users?q=${encodeURIComponent(email)}+in:email`);
  if (!data || !Array.isArray((data as Record<string, unknown>).items)) return '';
  const items = (data as Record<string, unknown>).items as Array<Record<string, unknown>>;
  if (!items.length) return '';
  const login = String(items[0].login ?? '');
  if (!login) return '';
  return enrichGitHubUser(login, accounts);
}

async function enrichGitHubUser(login: string, accounts: DiscoveredAccount[]): Promise<string> {
  const data = await fetchJson(`https://api.github.com/users/${encodeURIComponent(login)}`);
  if (!data || Array.isArray(data)) return '';
  const u = data as Record<string, unknown>;
  accounts.push({
    platform: 'github',
    handle: String(u.login ?? login),
    url: String(u.html_url ?? `https://github.com/${login}`),
    displayName: String(u.name ?? ''),
    location: String(u.location ?? ''),
    bio: String(u.bio ?? ''),
  });
  return [String(u.name ?? ''), String(u.bio ?? ''), String(u.location ?? ''), String(u.company ?? '')].filter(Boolean).join(' · ');
}

async function enrichGitLab(username: string, accounts: DiscoveredAccount[]): Promise<string> {
  const data = await fetchJson(`https://gitlab.com/api/v4/users?username=${encodeURIComponent(username)}`);
  if (!data || !Array.isArray(data) || !data.length) return '';
  const u = data[0] as Record<string, unknown>;
  accounts.push({
    platform: 'gitlab',
    handle: String(u.username ?? username),
    url: String(u.web_url ?? `https://gitlab.com/${username}`),
    displayName: String(u.name ?? ''),
    location: String(u.location ?? ''),
    bio: String(u.bio ?? ''),
  });
  return [String(u.name ?? ''), String(u.bio ?? ''), String(u.location ?? ''), String(u.organization ?? '')].filter(Boolean).join(' · ');
}

function inferFlags(corpus: string, rules: Array<{ label: string; re: RegExp }>): string[] {
  return rules.filter((r) => r.re.test(corpus)).map((r) => r.label);
}

function inferEmployment(corpus: string): string {
  if (/\b(student|college|university|undergrad|graduate student|phd|school)\b/i.test(corpus)) return 'Student';
  if (/\b(self[- ]employed|freelance|freelancer|founder|entrepreneur|small business|startup|side hustle|gig work)\b/i.test(corpus)) return 'Self-employed';
  if (/\b(unemployed|laid off|job loss|between jobs|looking for work|fired|out of work)\b/i.test(corpus)) return 'Unemployed';
  if (/\b(retired|retirement|pension)\b/i.test(corpus)) return 'Retired';
  if (/\b(disabled|disability)\b/i.test(corpus)) return 'Disabled';
  if (/\b(homemaker|stay[- ]at[- ]home|sahm|sahd)\b/i.test(corpus)) return 'Homemaker';
  return '';
}

async function enrichIndividual(email: string, username: string): Promise<ResearchProfile & { interests: string[] }> {
  const accounts: DiscoveredAccount[] = [];
  const corpusParts: string[] = [];

  if (email) {
    corpusParts.push(await enrichGravatar(email, accounts));
    corpusParts.push(await enrichGitHubByEmail(email, accounts));
  }
  if (username) {
    corpusParts.push(await enrichGitHubUser(username, accounts));
    corpusParts.push(await enrichGitLab(username, accounts));
  }

  const corpus = corpusParts.filter(Boolean).join(' ');
  const loc = detectLocation(corpus, []);
  const identityFlags = inferFlags(corpus, INDIVIDUAL_FLAGS);
  const needs = inferFlags(corpus, NEED_KEYWORDS);
  const interests = Array.from(new Set(accounts.map((a) => a.platform))).slice(0, 12);

  // Prefer a real display name from any source; fall back to the username.
  const displayName = accounts.find((a) => a.displayName)?.displayName || username || email.split('@')[0] || '';

  return {
    applicantType: 'Individual / household',
    businessName: displayName,
    city: loc.city,
    state: loc.state,
    yearsOperating: '',
    employees: '',
    revenue: '',
    identities: identityFlags,
    mission: cleanMission(corpus) || `Public profile for ${displayName}`,
    fundingUse: '',
    identityFlags,
    needs,
    employmentStatus: inferEmployment(corpus),
    interests,
    accounts: accounts.slice(0, 30),
  };
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  const rl = rateLimit(request, { limit: 12, windowSeconds: 60, keyPrefix: 'research-profile' });
  if (!rl.ok) return rateLimitedResponse(rl);

  let body: ResearchInput;
  try { body = (await request.json()) as ResearchInput; } catch { return json({ error: 'invalid JSON body' }, 400); }

  // Turnstile bot check (skip verify only when secret unset — local/dev).
  const turnstileToken = String((body as { 'cf-turnstile-response'?: unknown })?.['cf-turnstile-response'] ?? '');
  if (!turnstileToken) return json({ error: 'security check required — please retry' }, 403);
  if (env.TURNSTILE_SECRET) {
    const vf = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: String(env.TURNSTILE_SECRET),
        response: turnstileToken,
        remoteip: request.headers.get('cf-connecting-ip') || '',
      }),
    });
    let vres: { success?: boolean; action?: string } | null = null;
    try { vres = (await vf.json()) as { success?: boolean; action?: string }; } catch { vres = null; }
    if (!vres || !vres.success || (vres.action && vres.action !== 'research')) {
      return json({ error: 'security check failed' }, 403);
    }
  }

  const email = String(body?.email ?? '').trim().toLowerCase();
  const username = String(body?.username ?? '').trim();
  const name = String(body?.name ?? '').trim();

  // Individual enrichment path.
  if (email || username) {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'enter a valid email address' }, 400);
    const profile = await enrichIndividual(email, username);
    if (!profile.businessName && !profile.accounts?.length) {
      return json({ profile: { ...profile, applicantType: 'Individual / household' }, sourceNote: 'no public profiles found — a few quick answers will finish the rest', missing: ['details'] });
    }
    return json({
      profile,
      sourceNote: profile.accounts?.length ? `public profiles (${profile.accounts.map((a) => a.platform).join(', ')})` : 'public profiles',
      missing: [],
    });
  }

  if (!name) return json({ error: 'organization name or an email/username is required' }, 400);

  // Organization path (unchanged).
  const website = normalizeWebsite(body?.website);
  const pastedText = String(body?.text ?? '').slice(0, 20000);

  const site = website ? await scrapeWebsite(website) : { html: '', text: '', title: '', description: '' };
  const jsonLd = site.html ? parseJsonLd(site.html) : [];

  const corpus = [site.title, site.description, site.text, pastedText].join('\n').slice(0, 60000);
  const irs = await lookupNonprofit(name);

  let foundedYear = extractYear(corpus);
  if (!foundedYear && irs?.ruling_date) foundedYear = parseInt(irs.ruling_date.slice(0, 4), 10) || 0;
  for (const node of jsonLd) {
    const fd = (node as Record<string, unknown>).foundingDate;
    if (!foundedYear && typeof fd === 'string') {
      const y = fd.match(/(19|20)\d{2}/);
      if (y) foundedYear = parseInt(y[0], 10);
    }
  }

  const loc = detectLocation(corpus, jsonLd);
  const city = loc.city || (irs?.city ?? '');
  const state = loc.state || (irs?.state ?? '');

  const identities = IDENTITY_RULES.filter((r) => r.re.test(corpus)).map((r) => r.label);

  const mission = cleanMission(site.description || site.text || pastedText);

  const profile: ResearchProfile = {
    applicantType: classifyApplicantType(corpus, irs?.ntee_code ?? null),
    businessName: name,
    city,
    state,
    yearsOperating: yearsBucket(foundedYear),
    employees: '',
    revenue: revenueBucket(irs?.total_revenue ?? -1),
    identities,
    mission,
    fundingUse: '',
  };

  const missing: string[] = [];
  if (!profile.applicantType) missing.push('applicantType');
  if (!city || !state) missing.push('location');
  if (!profile.yearsOperating) missing.push('yearsOperating');
  if (!profile.revenue) missing.push('revenue');
  if (!profile.mission) missing.push('mission');

  const sources: string[] = [];
  if (website) sources.push('their website');
  if (irs) sources.push('IRS nonprofit records');
  if (pastedText) sources.push('your pasted document');
  const sourceNote = sources.length ? sources.join(' + ') : 'name lookup';

  return json({ profile, sourceNote, missing });
}
