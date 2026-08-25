export type ApplicantType = 'small_business' | 'nonprofit' | 'individual' | 'community_project';

export interface GrantProfileInput {
  applicant_type: ApplicantType;
  legal_name: string;
  public_name?: string;
  city: string;
  state: string;
  years_operating?: string;
  employee_range?: string;
  revenue_range?: string;
  ownership_identities?: string[];
  mission?: string;
  funding_use?: string;
  reusable_facts?: Record<string, unknown>;
}

const APPLICANT_TYPES = new Set<ApplicantType>(['small_business', 'nonprofit', 'individual', 'community_project']);
const MAX_TEXT = 8_000;

function cleanText(value: unknown, max = 500): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

export function validateGrantProfile(raw: unknown): { ok: true; value: GrantProfileInput } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, error: 'body must be an object' };
  const body = raw as Record<string, unknown>;
  const applicantType = cleanText(body.applicant_type, 40) as ApplicantType;
  if (!APPLICANT_TYPES.has(applicantType)) return { ok: false, error: 'invalid applicant_type' };

  const legalName = cleanText(body.legal_name, 180);
  const city = cleanText(body.city, 120);
  const state = cleanText(body.state, 80);
  if (!legalName || !city || !state) return { ok: false, error: 'legal_name, city, and state are required' };

  const identities = Array.isArray(body.ownership_identities)
    ? body.ownership_identities.filter((item): item is string => typeof item === 'string').map((item) => item.trim().slice(0, 80)).filter(Boolean).slice(0, 20)
    : [];
  const facts = body.reusable_facts && typeof body.reusable_facts === 'object' && !Array.isArray(body.reusable_facts)
    ? body.reusable_facts as Record<string, unknown>
    : {};

  return {
    ok: true,
    value: {
      applicant_type: applicantType,
      legal_name: legalName,
      public_name: cleanText(body.public_name, 180) || undefined,
      city,
      state,
      years_operating: cleanText(body.years_operating, 80) || undefined,
      employee_range: cleanText(body.employee_range, 80) || undefined,
      revenue_range: cleanText(body.revenue_range, 80) || undefined,
      ownership_identities: identities,
      mission: cleanText(body.mission, MAX_TEXT),
      funding_use: cleanText(body.funding_use, MAX_TEXT),
      reusable_facts: facts,
    },
  };
}

export interface MatchResult {
  score: number;
  status: 'eligible' | 'ineligible' | 'needs_review';
  reasons: string[];
  blockers: string[];
}

function toNum(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function ageFromDob(dob: unknown): number | null {
  if (typeof dob !== 'string' || !dob) return null;
  const parsed = new Date(dob);
  if (Number.isNaN(parsed.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - parsed.getFullYear();
  const monthDiff = now.getMonth() - parsed.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < parsed.getDate())) age -= 1;
  return age >= 0 && age < 120 ? age : null;
}

function collectDemos(facts: Record<string, unknown>): string[] {
  const demos = new Set<string>();
  const add = (v: unknown) => { if (typeof v === 'string' && v) demos.add(v.toLowerCase().trim()); };
  const addArr = (v: unknown) => { if (Array.isArray(v)) v.forEach(add); };
  const gender = String(facts.gender || '').toLowerCase();
  if (gender === 'female' || gender === 'woman') { demos.add('female'); demos.add('woman'); }
  if (gender === 'male' || gender === 'man') { demos.add('male'); demos.add('man'); }
  addArr(facts.race_ethnicity);
  addArr(facts.identity_flags);
  if (facts.veteran === true || String(facts.veteran) === 'true') demos.add('veteran');
  if (facts.disability === true || String(facts.disability) === 'true') { demos.add('disabled'); demos.add('disability'); }
  if (facts.immigration_status) {
    const imm = String(facts.immigration_status).toLowerCase();
    demos.add(imm);
    if (['immigrant', 'permanent_resident', 'daca', 'refugee', 'asylee', 'asylum'].includes(imm)) demos.add('immigrant');
  }
  addArr(facts.needs);
  return [...demos];
}

// Win-probability tier - rank by likelihood of actually receiving the money, not just
// eligibility fit. Entitlements & need-based assistance pay out if eligible; competitive
// grants/fellowships are lotteries.
function winOdds(rules: Record<string, unknown>, category: string): { delta: number; label: string } {
  const source = String(rules.source_type || '').toLowerCase();
  if (source === 'federal_benefit') return { delta: 16, label: 'Benefit - receive if you qualify' };
  if (source === 'usda_program') return { delta: 4, label: 'USDA program - farm / cost-share support' };
  const cat = category.toLowerCase();
  const assistance = new Set(['housing', 'emergency_relief', 'health', 'transportation', 'vocational_training', 'seniors', 'disability', 'veterans', 'workforce']);
  const competitive = new Set(['science_research', 'small_business', 'arts_culture', 'technology', 'environment', 'sports_athletics', 'entrepreneur']);
  if (assistance.has(cat)) return { delta: 10, label: 'Need-based assistance - high likelihood' };
  if (competitive.has(cat)) return { delta: -4, label: 'Competitive - fit does not guarantee an award' };
  return { delta: 0, label: '' };
}

export function scoreGrant(profile: Record<string, unknown>, grant: Record<string, unknown>): MatchResult {
  const rules = (grant.eligibility_rules || {}) as Record<string, unknown>;
  const reasons: string[] = [];
  const blockers: string[] = [];
  let score = 45;

  const states = Array.isArray(rules.states) ? rules.states.map(String) : [];
  const geography = String(rules.geography || '');
  const profileState = String(profile.state || '').toLowerCase();
  if (states.includes('all_us') || geography === 'all_us') {
    score += 12;
    reasons.push('Open across the U.S.');
  } else if (states.length && states.some((state) => state.toLowerCase() === profileState)) {
    score += 18;
    reasons.push(`Location matches ${profile.state}`);
  } else if (states.length) {
    blockers.push(`Applicant location is outside ${states.join(', ')}`);
  }

  // No location data at all → unverifiable listing (directory-style entries), downrank
  // so they don't crowd out located programs.
  if (!states.length && geography !== 'all_us' && geography !== 'foreign') {
    score -= 8;
  }

  // Win-probability: entitlements & need-based assistance pay out if eligible;
  // competitive grants are lotteries. Rank by winnability, not just fit.
  const odds = winOdds(rules, String(grant.category || ''));
  if (odds.delta) score += odds.delta;
  if (odds.label) reasons.push(odds.label);

  const entityTypes = Array.isArray(rules.entity_types) ? rules.entity_types.map(String) : [];
  const applicantType = String(profile.applicant_type || '');
  const acceptsAll = entityTypes.includes('all');

  // Foreign / non-U.S. programs are never relevant to a U.S.-based applicant.
  const countries = Array.isArray(rules.countries) ? rules.countries.map(String) : [];
  const sourceType = String(rules.source_type || '');
  const isForeign =
    geography === 'foreign' ||
    sourceType === 'foreign_gov' ||
    (countries.length > 0 && !countries.some((c) => /united states|usa|u\.s\.|america/i.test(c)));
  if (isForeign) {
    blockers.push('Program is not available in the United States');
  }

  // An explicit individual-eligibility flag overrides a generic entity list.
  if (applicantType === 'individual' && rules.individual_eligible === false) {
    blockers.push('Not open to individuals (organization/institution only)');
  }

  if (entityTypes.length && !acceptsAll && !entityTypes.includes(applicantType)) {
    blockers.push(`Requires: ${entityTypes.join(' or ').replaceAll('_', ' ')}`);
  } else if (acceptsAll) {
    score += 22;
    reasons.push('Open to all applicant types');
  } else if (entityTypes.includes(applicantType)) {
    score += 22;
    reasons.push('Applicant entity type is accepted');
  } else if (applicantType === 'individual' && rules.individual_eligible === true) {
    score += 22;
    reasons.push('Open to individuals');
  }

  const maxEmployees = typeof rules.max_employees === 'number' ? rules.max_employees : null;
  if (maxEmployees !== null) {
    const employeeRange = String(profile.employee_range || '');
    if (employeeRange === '101+') blockers.push(`Requires fewer than ${maxEmployees + 1} employees`);
    else if (employeeRange) { score += 8; reasons.push('Organization size is within the limit'); }
  }

  const identities = Array.isArray(profile.ownership_identities) ? profile.ownership_identities : [];
  if (identities.length) { score += 5; reasons.push('Ownership eligibility is documented'); }
  if (profile.mission) score += 5;
  if (profile.funding_use) score += 5;

  const requirements = Array.isArray(rules.requirements) ? rules.requirements.map(String) : [];
  const facts = (profile.reusable_facts || {}) as Record<string, unknown>;
  for (const requirement of requirements) {
    if (!facts[requirement]) blockers.push(`Needs confirmation: ${requirement.replaceAll('_', ' ')}`);
  }

  // Individual eligibility — age (hard rule)
  const age = ageFromDob(facts.dob);
  const minAge = toNum(rules.min_age);
  const maxAge = toNum(rules.max_age);
  if (age !== null && (minAge !== null || maxAge !== null)) {
    if (minAge !== null && age < minAge) blockers.push(`Requires age ${minAge} or older`);
    else if (maxAge !== null && age > maxAge) blockers.push(`Requires age ${maxAge} or younger`);
    else { score += 10; reasons.push('Age requirement met'); }
  }

  // Individual eligibility — required demographics (hard rule)
  const requiredDemos = Array.isArray(rules.demographics) ? rules.demographics.map(String) : [];
  if (requiredDemos.length) {
    const have = collectDemos(facts);
    const missing = requiredDemos.filter((d) => {
      const dl = d.toLowerCase();
      return !have.some((h) => h === dl || h.includes(dl) || dl.includes(h));
    });
    if (missing.length) blockers.push(`Requires: ${requiredDemos.join(', ')}`);
    else { score += 12; reasons.push(`Demographic match: ${requiredDemos.join(', ')}`); }
  }

  // Relevance boost — applicant need vs grant focus (exact word-token match, no fuzzy substring)
  const needs = Array.isArray(facts.needs) ? facts.needs.map(String) : [];
  if (needs.length) {
    const focusTokens = new Set<string>();
    const addTokens = (raw: unknown) => {
      String(raw || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').forEach((t) => { if (t.length >= 3) focusTokens.add(t); });
    };
    if (Array.isArray(rules.service_focus)) rules.service_focus.forEach(addTokens);
    addTokens(grant.category);
    const matched = needs.find((need) => {
      const toks = String(need).toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').filter((t) => t.length >= 3);
      return toks.some((t) => focusTokens.has(t));
    });
    if (matched) { score += 15; reasons.push(`Matches your need: ${String(matched).replaceAll('_', ' ')}`); }
  }

  const hardBlockers = blockers.filter((item) => !item.startsWith('Needs confirmation:'));
  if (hardBlockers.length) score -= 40 * hardBlockers.length;
  score = Math.max(0, Math.min(98, score));
  const status = hardBlockers.length ? 'ineligible' : blockers.length ? 'needs_review' : 'eligible';
  return { score, status, reasons: reasons.slice(0, 6), blockers: blockers.slice(0, 6) };
}

export function draftFromProfile(profile: Record<string, unknown>, grant: Record<string, unknown>) {
  const publicName = String(profile.public_name || profile.legal_name || '');
  const city = String(profile.city || '');
  const state = String(profile.state || '');
  const mission = String(profile.mission || '');
  const fundingUse = String(profile.funding_use || '');
  const facts = (profile.reusable_facts || {}) as Record<string, unknown>;
  const isIndividual = String(profile.applicant_type || '') === 'individual';
  const missing: string[] = [];
  if (!mission && !isIndividual) missing.push('mission');
  if (!fundingUse && !isIndividual) missing.push('funding_use');
  if (isIndividual && !facts.dob) missing.push('date_of_birth');

  const answers: Record<string, string> = {
    applicant_name: publicName,
    applicant_summary: mission,
    use_of_funds: fundingUse,
    eligibility_summary: `${publicName} is based in ${city}, ${state} and is applying as a ${String(profile.applicant_type || '').replaceAll('_', ' ')}.`,
    funder_alignment: mission ? `${publicName}'s work will be tailored to ${String(grant.funder || 'the funder')}'s published priorities during final review.` : '',
  };

  if (isIndividual) {
    answers.date_of_birth = String(facts.dob || '');
    answers.household_size = String(facts.household_size || '');
    answers.income_range = String(facts.income_range || '');
    answers.employment_status = String(facts.employment_status || '').replaceAll('_', ' ');
    answers.education_status = String(facts.education_status || '').replaceAll('_', ' ');
    answers.gender = String(facts.gender || '');
    answers.race_ethnicity = Array.isArray(facts.race_ethnicity) ? facts.race_ethnicity.join(', ') : '';
    answers.veteran = facts.veteran ? 'Yes' : 'No';
    answers.disability = facts.disability ? 'Yes' : 'No';
    answers.immigration_status = String(facts.immigration_status || '').replaceAll('_', ' ');
    answers.needs = Array.isArray(facts.needs) ? facts.needs.join(', ').replaceAll('_', ' ') : '';
  }

  return { answers, missing };
}
