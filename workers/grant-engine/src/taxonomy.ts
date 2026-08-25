// Full grant taxonomy — every category, demographic, geography, and funder type
// James's coverage mandate: every grant, every demographic, every amount, gov and
// non-gov, foreign and domestic, religious, educational, vocational, sports/athletics,
// arts/sciences, hands-on building/home.

export type SourceType =
  | 'federal_gov' | 'state_gov' | 'local_gov'
  | 'foundation' | 'corporate' | 'private'
  | 'foreign_gov' | 'international_org';

export const SOURCE_TYPES: SourceType[] = [
  'federal_gov', 'state_gov', 'local_gov', 'foundation', 'corporate', 'private', 'foreign_gov', 'international_org',
];

// Primary category (stored in grant_opportunities.category)
export const CATEGORIES = [
  'small_business', 'nonprofit', 'community', 'education', 'vocational_training',
  'sports_athletics', 'arts_culture', 'science_research', 'housing', 'religious_faith',
  'health', 'environment', 'technology', 'agriculture', 'workforce',
  'youth', 'disability', 'veterans', 'seniors', 'emergency_relief', 'international',
] as const;

export type Category = (typeof CATEGORIES)[number];

// Demographic / service focus (stored in eligibility_rules.service_focus)
export const DEMOGRAPHICS = [
  'women', 'minority', 'black', 'latino', 'aapi', 'native', 'immigrant',
  'veteran', 'disability', 'lgbtq', 'rural', 'youth', 'faith', 'low_income',
] as const;

// Geography scope
export const GEOGRAPHIES = ['all_us', 'state', 'county', 'city', 'foreign', 'international'] as const;

// keyword → category inference (lowercased substring match)
export const CATEGORY_KEYWORDS: Array<[Category, string[]]> = [
  ['small_business', ['small business', 'entrepreneur', 'startup', 'for-profit', 'business owner']],
  ['nonprofit', ['nonprofit', '501(c)(3)', 'charity', 'ngo', 'not-for-profit']],
  ['education', ['education', 'school', 'scholarship', 'students', 'literacy', 'stem education', 'teacher']],
  ['vocational_training', ['vocational', 'trade school', 'apprenticeship', 'job training', 'workforce training', 'career']],
  ['sports_athletics', ['sports', 'athletic', 'athletes', 'recreation', 'physical activity', 'youth sports']],
  ['arts_culture', ['arts', 'artist', 'culture', 'music', 'theater', 'dance', 'museum', 'creative']],
  ['science_research', ['science', 'research', 'scientific', 'innovation', 'laboratory', 'stem research']],
  ['housing', ['housing', 'homeless', 'affordable housing', 'home repair', 'shelter', 'construction', 'building']],
  ['religious_faith', ['faith', 'religious', 'church', 'congregation', 'ministry', 'worship']],
  ['health', ['health', 'medical', 'mental health', 'wellness', 'clinical', 'hospital']],
  ['environment', ['environment', 'climate', 'conservation', 'sustainability', 'clean energy']],
  ['technology', ['technology', 'software', 'ai', 'artificial intelligence', 'digital', 'tech']],
  ['agriculture', ['agriculture', 'farming', 'farm', 'rural development', 'food systems']],
  ['workforce', ['workforce', 'employment', 'jobs', 'labor', 'upskilling']],
  ['youth', ['youth', 'children', 'teen', 'kids', 'after-school']],
  ['disability', ['disability', 'disabled', 'accessibility', 'special needs']],
  ['veterans', ['veteran', 'military', 'service member']],
  ['seniors', ['senior', 'elderly', 'aging', 'older adult']],
  ['emergency_relief', ['emergency', 'disaster', 'relief', 'crisis']],
  ['international', ['international', 'foreign', 'global', 'developing country', 'abroad']],
];

// Demographic keyword inference
export const DEMOGRAPHIC_KEYWORDS: Array<[string, string[]]> = [
  ['women', ['women', 'woman', 'female', 'girls']],
  ['minority', ['minority', 'bipoc', 'underrepresented']],
  ['black', ['black', 'african american', 'black-owned']],
  ['latino', ['latino', 'latina', 'hispanic', 'latinx']],
  ['aapi', ['aapi', 'asian', 'pacific islander', 'aanhpi', 'aapi']],
  ['native', ['native american', 'indigenous', 'tribal']],
  ['immigrant', ['immigrant', 'refugee', 'new american', 'first-generation']],
  ['veteran', ['veteran', 'military', 'service member']],
  ['disability', ['disability', 'disabled']],
  ['lgbtq', ['lgbtq', 'lgbt', 'queer', 'transgender']],
  ['rural', ['rural', 'remote community']],
  ['youth', ['youth', 'children', 'teen']],
  ['faith', ['faith', 'religious', 'congregation']],
  ['low_income', ['low-income', 'underserved', 'poverty', 'economically disadvantaged']],
];

// Red-flag / scam signals to reject an opportunity
export const SCAM_KEYWORDS = [
  'guaranteed grant', 'application fee', 'processing fee', 'grant package', 'money back guarantee',
  'pay to apply', 'winner notification', 'lottery grant', 'wire transfer fee',
];
