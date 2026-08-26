// Shinnslist RE — real-estate data vertical (live public-data lists)
// All figures sourced from official county/state endpoints; refreshed by geo/ ingest crons.
// Top-10 preview rows pulled verbatim from geo/out/denver_tax_delinquent_preview10.csv (2026-08-25 run).

export type RePreviewRow = {
  score: number;
  owner: string;
  parcel: string;
  addr: string;
  hood: string;          // neighborhood (assessor NBHD_1_CN where available)
  delinquentYear: number;
  yearsDelinquent: number;
  taxOwed: number;
  totalOwed: number;     // tax + interest + fees
  assessed: number;      // assessor TOTAL_VALUE
  equityRatio: number;   // (value - owed) / value
  equityPct: number;     // rounded for display
  entityOwner: boolean;
  entity: boolean;       // alias for hub table
  neighborhood: string;  // alias for hub table
};

export const denverTaxDelinquentPreview: RePreviewRow[] = [
  { score: 538.7, owner: 'GDPT Nguyen Thieu Buddhist Youth Association', parcel: '05291-16-014-000', addr: '2567 W Iliff Ave', hood: 'Evans Park Estates', neighborhood: 'Evans Park Estates', delinquentYear: 2019, yearsDelinquent: 6, taxOwed: 8422, totalOwed: 13654, assessed: 133630, equityRatio: 0.898, equityPct: 90, entityOwner: true, entity: true },
  { score: 199.1, owner: 'Graves, Clark Raymond Jr', parcel: '02171-00-228-000', addr: '2811 W 53rd Ave Unit 101', hood: 'Zuni Park', neighborhood: 'Zuni Park', delinquentYear: 2023, yearsDelinquent: 2, taxOwed: 1023, totalOwed: 1217, assessed: 271300, equityRatio: 0.996, equityPct: 100, entityOwner: false, entity: false },
  { score: 198.9, owner: 'Rivera, Hugo Maturin', parcel: '00184-08-013-000', addr: '14570 E 53rd Ave', hood: 'Montbello', neighborhood: 'Montbello', delinquentYear: 2023, yearsDelinquent: 2, taxOwed: 2274, totalOwed: 2694, assessed: 477800, equityRatio: 0.994, equityPct: 99, entityOwner: false, entity: false },
  { score: 198.7, owner: '4676 Leaf LLC', parcel: '02221-12-002-000', addr: '4676 N Leaf Ct', hood: 'Globesville', neighborhood: 'Globesville', delinquentYear: 2023, yearsDelinquent: 2, taxOwed: 1791, totalOwed: 2451, assessed: 369700, equityRatio: 0.993, equityPct: 99, entityOwner: true, entity: true },
  { score: 198.7, owner: 'Fanaro, Chris', parcel: '02222-04-016-000', addr: '4421 N Cahita Ct', hood: 'Globesville', neighborhood: 'Globesville', delinquentYear: 2023, yearsDelinquent: 2, taxOwed: 1808, totalOwed: 2437, assessed: 384300, equityRatio: 0.994, equityPct: 99, entityOwner: false, entity: false },
  { score: 198.7, owner: 'Scully, Laura Epstein', parcel: '02331-09-267-267', addr: '1625 Larimer St Apt 2007', hood: 'LoDo', neighborhood: 'LoDo', delinquentYear: 2023, yearsDelinquent: 2, taxOwed: 4793, totalOwed: 5665, assessed: 846900, equityRatio: 0.993, equityPct: 99, entityOwner: false, entity: false },
  { score: 196.2, owner: 'Villa Tod LLC', parcel: '05044-12-043-000', addr: '926 W 10th Ave', hood: 'Lincoln Park', neighborhood: 'Lincoln Park', delinquentYear: 2023, yearsDelinquent: 2, taxOwed: 12705, totalOwed: 13350, assessed: 695410, equityRatio: 0.981, equityPct: 98, entityOwner: true, entity: true },
  { score: 191.8, owner: 'Journey Language Center LLC', parcel: '02354-12-017-000', addr: '1735 N Lafayette St', hood: 'Park Avenue', neighborhood: 'Park Avenue', delinquentYear: 2023, yearsDelinquent: 2, taxOwed: 1819, totalOwed: 1920, assessed: 46960, equityRatio: 0.959, equityPct: 96, entityOwner: true, entity: true },
  { score: 181.7, owner: 'Beldame Apartments Ltd', parcel: '02349-04-008-000', addr: '1904 N Logan St', hood: 'North Capitol Hill', neighborhood: 'North Capitol Hill', delinquentYear: 2023, yearsDelinquent: 2, taxOwed: 34239, totalOwed: 40412, assessed: 441870, equityRatio: 0.909, equityPct: 91, entityOwner: true, entity: true },
  { score: 100.0, owner: '10Ten LLC', parcel: '02183-00-015-000', addr: '4673 W 50th Pl', hood: 'Regis', neighborhood: 'Regis', delinquentYear: 2024, yearsDelinquent: 1, taxOwed: 0, totalOwed: 255, assessed: 1292000, equityRatio: 1.0, equityPct: 100, entityOwner: true, entity: true },
];

export interface ReSource {
  label: string;
  url: string;
  rows?: number;
  updated?: string;
}

export interface ReSku {
  slug: string;
  name: string;
  listVintage: string;
  total: number;
  joined: number;
  multiYearDelinquent: number;
  priceUsd: number;
  priceCents: number;
  rows: number;
  updated: string;
  sources: ReSource[];
  columns: string[];
}

// The full SKU (live stats from the 2026-08-25 ingest run — see repo STATUS.md).
export const denverTaxDelinquent: ReSku = {
  slug: 'tax-delinquent-denver',
  name: 'Denver Tax-Delinquent Lead List (scored)',
  listVintage: '2025 tax-lien-sale',
  total: 8373,
  joined: 7113,
  multiYearDelinquent: 9,          // 2019 + 2023 cohorts
  priceUsd: 29,
  priceCents: 2900,
  rows: 8373,
  updated: '2026-08-25',
  sources: [
    { label: 'Denver Treasurer — delinquent real-estate tax list (official XLSX, published pre-sale, free)', url: 'https://www.denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Department-of-Finance/Our-Divisions/Treasury/Property-Taxes/Real-Estate-Delinquent-Taxes-and-Tax-Lien-Sale', rows: 8373, updated: '2025-08-28' },
    { label: 'Denver Assessor — residential characteristics open data (212,664 parcels)', url: 'https://services1.arcgis.com/zdB7qR0BtYrg0Xpl/arcgis/rest/services/ODC_real_property_residential_characteristics/FeatureServer/59', rows: 212664 },
    { label: 'Colorado DWR — well-permit registry (13,121 Denver wells; premium water flag)', url: 'https://dwr.state.co.us/Rest/GET/api/v2/wellpermits/wellpermit', rows: 13121 },
  ],
  columns: [
    'score', 'owner name', 'parcel id', 'property address', 'neighborhood',
    'delinquent year + depth', 'tax owed / interest / fees / total owed',
    'assessed value + equity ratio', 'owner type (person vs entity)',
    'tax-sale indicator + partial-payment status', 'owner mailing address (assessor-joined)',
    'beds / baths / year built / land sqft', 'legal description',
  ],
} as const;

export const reSkus = {
  'tax-delinquent-denver': denverTaxDelinquent,
} as const;

export type ReSkuSlug = keyof typeof reSkus;

// Published proof stats (comping backtest, repo comping/):
export const compingStats = {
  medianErrorPct: 7.1,
  bandHitPct: 71.5,
  backtestSales: 57985,
  sampleSize: 57985,
  backtestMarket: 'New York City (geography-agnostic model; CO/VA re-tune in progress)',
};

export const waterStats = {
  wellsZoneA: 76639,
  activeWells: 44555,
  counties: ['Denver', 'Jefferson', 'Boulder'],
  parcelsFlagged: 3899,
};

export const zoneAStats = {
  parcels: 571667,
  byCounty: { denver: 212664, jeffco: 229271, boulder: 129732 },
};

// THE DATA WALL — every ingested dataset, live counts from the 2026-08-25 build.
export const dataWall = [
  { name: 'Parcel spines (ownership + mailing)', rows: '571,667', counties: 'Denver · Jefferson · Boulder', source: 'County Assessor open GIS', fresh: 'Weekly cron' },
  { name: 'Corridor scored parcels', rows: '227,834', counties: 'Arvada → Longmont → Lyons → Allenspark → Estes', source: 'Joined spine layers', fresh: 'Auto-rescored' },
  { name: 'Tax-delinquent roll (scored)', rows: '8,373', counties: 'Denver', source: 'Treasurer pre-lien-sale XLSX', fresh: 'Daily cron' },
  { name: 'Well permits (water rights)', rows: '76,639', counties: 'All Zone A', source: 'CO DWR registry', fresh: 'Weekly cron' },
  { name: 'Septic (OWTS) permits', rows: '44,964', counties: 'Boulder', source: 'Boulder County GIS', fresh: 'Static + quarterly' },
  { name: 'Building permit dockets', rows: '272,399', counties: 'Boulder', source: 'Accela open portal', fresh: 'Static' },
  { name: 'STR licenses', rows: '374', counties: 'Boulder', source: 'County license registry', fresh: 'Static' },
  { name: 'FEMA flood buyouts / damaged', rows: '149 corridor', counties: 'Corridor', source: 'OpenFEMA V1 API', fresh: 'Quarterly' },
  { name: 'Wildfire burn scars', rows: '10 fires', counties: 'Corridor', source: 'USFS MTBS perimeters', fresh: 'Annual' },
  { name: 'Severed mineral rights', rows: '904', counties: 'Larimer', source: 'Larimer GIS annotations', fresh: 'Static' },
  { name: 'Sale tenure (years held)', rows: '355K+', counties: 'Jeffco + Boulder', source: 'Assessor sales files', fresh: 'Weekly cron' },
  { name: '2026 assessed values', rows: '127,080', counties: 'Boulder', source: 'Assessor Values.csv', fresh: 'Nightly upstream' },
];
