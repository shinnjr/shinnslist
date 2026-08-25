export type GrantStatus = 'open' | 'rolling' | 'upcoming' | 'paused';
export type FitLevel = 'strong' | 'possible' | 'blocked';

export interface GrantOpportunity {
  id: string;
  name: string;
  funder: string;
  amount: string;
  deadline: string;
  deadlineLabel: string;
  status: GrantStatus;
  category: string;
  eligibility: string;
  sourceUrl: string;
  verifiedAt: string;
  fee: string;
  fit: FitLevel;
  matchScore: number;
  effort: 'Light' | 'Moderate' | 'Heavy';
  reasons: string[];
  blocker?: string;
  summary: string;
}

export const GRANTS: GrantOpportunity[] = [
  {
    id: 'tdf-aapi-circle-2026',
    name: 'Colorado AAPI Circle Fund',
    funder: 'The Denver Foundation',
    amount: '$1,000–$4,000',
    deadline: '2026-08-17',
    deadlineLabel: 'Aug 17, 2026',
    status: 'open',
    category: 'Community',
    eligibility: 'Colorado nonprofits or fiscally sponsored projects serving AANHPI communities.',
    sourceUrl: 'https://denverfoundation.org/funding-opportunity/asian-american-and-pacific-islander-circle-fund/',
    verifiedAt: '2026-08-10',
    fee: '$0',
    fit: 'possible',
    matchScore: 78,
    effort: 'Moderate',
    reasons: ['Colorado-based', 'AAPI community focus', 'High historical funding rate'],
    blocker: 'Requires a nonprofit or fiscal sponsor serving AANHPI communities.',
    summary: 'Small, community-led grants for Colorado organizations serving Asian, Asian-American, Native Hawaiian, and Pacific Islander communities.',
  },
  {
    id: 'tdf-strengthening-neighborhoods-2026',
    name: 'Strengthening Neighborhoods',
    funder: 'The Denver Foundation',
    amount: '$500–$5,000',
    deadline: '2026-10-19',
    deadlineLabel: 'Oct 19, 2026',
    status: 'open',
    category: 'Community',
    eligibility: 'Metro Denver neighborhood groups, resident associations, and nonprofits.',
    sourceUrl: 'https://denverfoundation.org/funding-opportunity/strengthening-neighborhoods/',
    verifiedAt: '2026-08-10',
    fee: '$0',
    fit: 'strong',
    matchScore: 91,
    effort: 'Light',
    reasons: ['Metro Denver', 'Grassroots applicants accepted', 'Housing and economic opportunity are eligible'],
    summary: 'Grassroots funding for resident-led projects in housing, human services, and economic opportunity across Metro Denver.',
  },
  {
    id: 'tdf-capacity-building-2026',
    name: 'Capacity Building Fund',
    funder: 'The Denver Foundation',
    amount: '$500–$6,000',
    deadline: '2026-11-02',
    deadlineLabel: 'Nov 2, 2026',
    status: 'open',
    category: 'Nonprofit',
    eligibility: 'Metro Denver nonprofits with 501(c)(3) status or a fiscal sponsor.',
    sourceUrl: 'https://denverfoundation.org/funding-opportunities/',
    verifiedAt: '2026-08-10',
    fee: '$0',
    fit: 'possible',
    matchScore: 73,
    effort: 'Light',
    reasons: ['Metro Denver', 'Systems and operational support', 'Small-dollar ask encouraged'],
    blocker: 'Requires nonprofit status or a fiscal sponsor.',
    summary: 'Funding for staff skills, board development, systems, and grant-readiness at Metro Denver nonprofits.',
  },
  {
    id: 'tdf-civic-fabric-2026',
    name: 'Civic Fabric Fund',
    funder: 'The Denver Foundation',
    amount: '$15,000–$30,000',
    deadline: '2026-09-15',
    deadlineLabel: 'Sep 15, 2026',
    status: 'open',
    category: 'Advocacy',
    eligibility: 'Colorado nonprofits working on state or local policy, advocacy, research, or coalition building.',
    sourceUrl: 'https://denverfoundation.org/funding-opportunity/civic-fabric-fund-state-local-policy/',
    verifiedAt: '2026-08-10',
    fee: '$0',
    fit: 'possible',
    matchScore: 67,
    effort: 'Heavy',
    reasons: ['Colorado-based', 'Housing policy can qualify', 'Coalition work supported'],
    blocker: 'Needs a nonprofit policy or advocacy program.',
    summary: 'Larger awards for Colorado organizations improving state and local policy through advocacy, research, and community engagement.',
  },
  {
    id: 'rcf-newcomers-2026',
    name: 'Newcomers Fund',
    funder: 'Rose Community Foundation',
    amount: 'Amount varies',
    deadline: 'rolling',
    deadlineLabel: 'Rolling inquiries',
    status: 'rolling',
    category: 'Immigrant services',
    eligibility: 'Greater Denver nonprofits serving immigrants, including housing and basic needs.',
    sourceUrl: 'https://rcfdenver.org/nonprofit-opportunities/funding-opportunities/',
    verifiedAt: '2026-08-10',
    fee: '$0',
    fit: 'possible',
    matchScore: 82,
    effort: 'Moderate',
    reasons: ['Greater Denver', 'Immigrant services', 'Housing explicitly supported'],
    blocker: 'Requires a nonprofit applicant.',
    summary: 'Funding for nonprofits meeting immigrants’ housing, health, mental-health, and basic-needs priorities in Greater Denver.',
  },
  {
    id: 'lenovo-evolve-small-2026',
    name: 'Evolve Small AI Grant',
    funder: 'Lenovo',
    amount: '$25,000 + technology',
    deadline: 'rolling',
    deadlineLabel: 'Rolling 2026 cycle',
    status: 'rolling',
    category: 'Small business',
    eligibility: 'U.S. small businesses with fewer than 100 employees; Microsoft 365 account required.',
    sourceUrl: 'https://www.lenovo.com/us/en/evolvesmall',
    verifiedAt: '2026-08-10',
    fee: '$0',
    fit: 'strong',
    matchScore: 88,
    effort: 'Moderate',
    reasons: ['U.S. small business', 'Under 100 employees', 'AI and technology use case'],
    summary: 'A cash award plus technology package for small businesses using AI to grow or improve operations.',
  },
  {
    id: 'breva-thrive-q4-2026',
    name: 'Thrive Grant',
    funder: 'Breva',
    amount: '$5,000',
    deadline: '2026-10-31',
    deadlineLabel: 'Oct 1–31, 2026',
    status: 'upcoming',
    category: 'Small business',
    eligibility: 'Small businesses with community impact; high-need or LMI areas preferred.',
    sourceUrl: 'https://breva.ai/thrive-grant',
    verifiedAt: '2026-08-10',
    fee: '$0',
    fit: 'strong',
    matchScore: 86,
    effort: 'Light',
    reasons: ['Small business', 'Community impact', 'Quarterly application window'],
    summary: 'Quarterly unrestricted grant for small businesses creating measurable community impact.',
  },
  {
    id: 'freed-fellowship-monthly-2026',
    name: 'Freed Fellowship Grant',
    funder: 'Freed Fellowship',
    amount: '$500 monthly',
    deadline: 'rolling',
    deadlineLabel: 'Monthly',
    status: 'rolling',
    category: 'Entrepreneur',
    eligibility: 'Under-resourced entrepreneurs; open to all genders.',
    sourceUrl: 'https://freedfellowship.com/grant',
    verifiedAt: '2026-08-10',
    fee: '$0',
    fit: 'strong',
    matchScore: 84,
    effort: 'Light',
    reasons: ['Simple application', 'Monthly opportunity', 'Early-stage founders accepted'],
    summary: 'A recurring microgrant and fellowship for under-resourced entrepreneurs building early-stage businesses.',
  },
];

export function getGrant(id: string | null): GrantOpportunity | undefined {
  return GRANTS.find((grant) => grant.id === id);
}

export const DEMO_PROFILE_NOTE = 'Match estimates use an illustrative Colorado small-business profile until you complete onboarding.';
