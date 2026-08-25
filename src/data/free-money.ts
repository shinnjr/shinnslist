// Free Money Finder — data layer
// Honest-by-construction: every amount is sourced (Doctor of Credit, Aug 2026) and every
// link points at the official holder of the money. No fabricated dollar figures.

export type BankBonus = {
  name: string;
  bonus: string;
  requirement: string;
  category: 'fintech' | 'bank' | 'credit-union';
  noDirectDeposit?: boolean;
  colorado?: boolean;
  verifiedAt: string;
  url: string;
};

// Bank / fintech signup bonuses. Requirements paraphrased from Doctor of Credit's
// August 2026 "Best Bank Account Bonuses" list. Terms change frequently — always
// verify on the official site before opening. Bonuses are 1099-taxable income.
export const bankBonuses: BankBonus[] = [
  {
    name: 'Percapita',
    bonus: '$300',
    requirement: 'Open an account, no direct deposit required — pays $25/month',
    category: 'fintech',
    noDirectDeposit: true,
    verifiedAt: 'Aug 2026',
    url: 'https://www.percapita.com',
  },
  {
    name: 'ENT Credit Union',
    bonus: '$200',
    requirement: 'Open an account — no direct deposit required (Colorado)',
    category: 'credit-union',
    noDirectDeposit: true,
    colorado: true,
    verifiedAt: 'Aug 2026',
    url: 'https://www.ent.com',
  },
  {
    name: 'Sunflower Bank',
    bonus: '$200',
    requirement: 'Open an account — no direct deposit required (Colorado, in-branch)',
    category: 'bank',
    noDirectDeposit: true,
    colorado: true,
    verifiedAt: 'Aug 2026',
    url: 'https://www.sunflowerbank.com',
  },
  {
    name: 'Chime',
    bonus: '$425',
    requirement: 'Qualifying $200 direct deposit (portal bonus may stack)',
    category: 'fintech',
    verifiedAt: 'Aug 2026',
    url: 'https://www.chime.com',
  },
  {
    name: 'Chase Total Checking',
    bonus: '$300',
    requirement: 'Direct deposit required — no minimum amount',
    category: 'bank',
    verifiedAt: 'Aug 2026',
    url: 'https://www.chase.com',
  },
  {
    name: 'SoFi Checking & Savings',
    bonus: '$675',
    requirement: 'Qualifying direct deposits',
    category: 'fintech',
    verifiedAt: 'Aug 2026',
    url: 'https://www.sofi.com',
  },
  {
    name: 'Wells Fargo',
    bonus: '$400',
    requirement: '$1,000 in qualifying direct deposits',
    category: 'bank',
    verifiedAt: 'Aug 2026',
    url: 'https://www.wellsfargo.com',
  },
  {
    name: 'U.S. Bank',
    bonus: '$450',
    requirement: 'Qualifying direct deposits',
    category: 'bank',
    verifiedAt: 'Aug 2026',
    url: 'https://www.usbank.com',
  },
  {
    name: 'BMO',
    bonus: '$400',
    requirement: 'Qualifying direct deposits',
    category: 'bank',
    verifiedAt: 'Aug 2026',
    url: 'https://www.bmo.com',
  },
  {
    name: 'Citi',
    bonus: '$325',
    requirement: 'Qualifying direct deposits',
    category: 'bank',
    verifiedAt: 'Aug 2026',
    url: 'https://www.citi.com',
  },
  {
    name: 'PNC',
    bonus: '$200–$400',
    requirement: 'Qualifying direct deposits',
    category: 'bank',
    verifiedAt: 'Aug 2026',
    url: 'https://www.pnc.com',
  },
  {
    name: 'Axos Bank',
    bonus: '$150–$200',
    requirement: 'Qualifying deposits / balance',
    category: 'fintech',
    verifiedAt: 'Aug 2026',
    url: 'https://www.axos.com',
  },
];

export type UnclaimedPortal = {
  name: string;
  detail: string;
  url: string;
};

// Authoritative, free unclaimed-property search portals.
// State treasurers hold the money; these are the official doors to it.
export const unclaimedPortals: UnclaimedPortal[] = [
  {
    name: 'MissingMoney.com',
    detail: 'The national multi-state search run with state administrators — covers most states in one search, free.',
    url: 'https://www.missingmoney.com',
  },
  {
    name: 'NAUPA — Unclaimed.org',
    detail: 'The National Association of Unclaimed Property Administrators. Its interactive map routes you to every state\u2019s official program.',
    url: 'https://unclaimed.org',
  },
  {
    name: 'Your state treasurer',
    detail: 'Each state runs its own program. Find the official link for your state via Unclaimed.org — never pay a third-party finder.',
    url: 'https://unclaimed.org/search-beyond-your-state/',
  },
];

export type ClassActionSource = {
  name: string;
  detail: string;
  url: string;
};

// Where to find open class-action settlements and file a claim free.
export const classActionSources: ClassActionSource[] = [
  {
    name: 'Top Class Actions',
    detail: 'The largest settlement aggregator — lists open settlements and how to file a claim. Filing is free.',
    url: 'https://www.topclassactions.com',
  },
  {
    name: 'ClassAction.org',
    detail: 'Lists open settlements and routes eligible claimants to attorneys. Filing a settlement claim stays free.',
    url: 'https://www.classaction.org',
  },
  {
    name: 'Settlement administrator notices',
    detail: 'If you received a mailed or emailed notice, it names the administrator and the official claim site. File there directly — free.',
    url: 'https://www.consumerfinance.gov',
  },
];

// The single "search your name for free money" CTA used by the calculator.
export const freeMoneySearchCta = {
  title: 'Search your name for unclaimed money',
  body: 'Start with MissingMoney.com or Unclaimed.org \u2014 both free, both official. If anything comes back, claim it directly from the state.',
  url: 'https://www.missingmoney.com',
};

export type BrokerageOffer = {
  name: string;
  bonus: string;
  requirement: string;
  verifiedAt: string;
  url: string;
};

// Brokerage "free stock" and deposit bonuses. The accessible affiliate lane for this
// vertical (via Impact / MaxBounty). Amounts are "up to" tiers that change with the
// promotion — verify on the official site before depositing.
export const brokerageOffers: BrokerageOffer[] = [
  { name: 'Webull', bonus: 'Up to $2,400 in free stock', requirement: 'Deposit tiers — larger deposits unlock more shares', verifiedAt: 'Aug 2026', url: 'https://www.webull.com' },
  { name: 'Moomoo', bonus: 'Up to $4,000 in free stock', requirement: 'Deposit tiers unlock fractional shares', verifiedAt: 'Aug 2026', url: 'https://www.moomoo.com' },
  { name: 'Robinhood', bonus: 'Free fractional stock', requirement: 'Open an account and link a bank', verifiedAt: 'Aug 2026', url: 'https://www.robinhood.com' },
  { name: 'Fidelity', bonus: '$100–$150', requirement: 'Deposit $50+ within 15 days of opening (referral promo)', verifiedAt: 'Aug 2026', url: 'https://www.fidelity.com' },
  { name: 'SoFi Invest', bonus: 'Up to $1,000 in free stock', requirement: 'Deposit tiers', verifiedAt: 'Aug 2026', url: 'https://www.sofi.com/invest' },
  { name: 'Public', bonus: 'Up to $300 in free stock', requirement: 'Deposit tiers', verifiedAt: 'Aug 2026', url: 'https://public.com' },
];

export type CreditOffer = {
  name: string;
  bonus: string;
  requirement: string;
  verifiedAt: string;
  url: string;
};

// Credit-building and free-credit tools. These earn affiliate/lead fees (fintech side)
// and are the honest adjacent lane to "free money" — build credit while you save.
export const creditOffers: CreditOffer[] = [
  { name: 'Chime Credit Builder', bonus: 'No fee, no credit check', requirement: 'Secured card that builds credit on everyday spending', verifiedAt: 'Aug 2026', url: 'https://www.chime.com/credit-builder' },
  { name: 'Self', bonus: 'Build credit while you save', requirement: 'Credit-builder loan; payments reported to all three bureaus', verifiedAt: 'Aug 2026', url: 'https://www.self.inc' },
  { name: 'Credit Karma', bonus: 'Free scores + matched offers', requirement: 'Free monitoring; matched to cards and loans you already qualify for', verifiedAt: 'Aug 2026', url: 'https://www.creditkarma.com' },
];
