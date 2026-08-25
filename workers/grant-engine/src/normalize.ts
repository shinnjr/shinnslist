import { CATEGORY_KEYWORDS, DEMOGRAPHIC_KEYWORDS, SCAM_KEYWORDS } from './taxonomy';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

export function inferCategory(text: string): string {
  const t = text.toLowerCase();
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((k) => t.includes(k))) return category;
  }
  return 'community';
}

export function inferDemographics(text: string): string[] {
  const t = text.toLowerCase();
  const found: string[] = [];
  for (const [demo, keywords] of DEMOGRAPHIC_KEYWORDS) {
    if (keywords.some((k) => t.includes(k))) found.push(demo);
  }
  return found;
}

export function hasScamSignal(text: string): boolean {
  const t = text.toLowerCase();
  return SCAM_KEYWORDS.some((k) => t.includes(k));
}

export function formatAmount(floor: number | null, ceiling: number | null): string {
  if (!floor && !ceiling) return '';
  const fmt = (n: number) => '$' + n.toLocaleString('en-US');
  if (floor && ceiling && floor !== ceiling) return `${fmt(floor)}–${fmt(ceiling)}`;
  if (ceiling) return `up to ${fmt(ceiling)}`;
  if (floor) return `from ${fmt(floor)}`;
  return '';
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
