// AUTO-GENERATED registry of RE data avenues — drives /re/[slug] SEO pages + ListBuilder.
// status: 'live' = purchasable/previewable today; 'ingesting' = dataset in pipeline, page captures interest.

export interface Avenue {
  slug: string;
  title: string;
  h1: string;
  description: string;
  status: 'live' | 'ingesting';
  intro: string;
  whyNobodySells: string;
  stats: { label: string; value: string }[];
  sources: { label: string; url: string }[];
  coverage: string;
}

export const avenues: Avenue[] = [
  {
    slug: 'tax-delinquent',
    title: 'Tax-Delinquent Property Lists — Denver County, Scored | Shinnslist',
    h1: 'Denver tax-delinquent properties — the official pre-lien-sale roll, scored',
    description: 'All 8,373 Denver properties on the official delinquent-tax list, scored by distress depth and equity, joined to assessor owner + mailing data. $29 one-time. Preview free.',
    status: 'live',
    intro: "Every year, county treasurers publish the full list of properties with unpaid taxes before the tax-lien sale. It's public record. Title companies and lead vendors resell it for $99–$749/month. We sell the same rows once, for $29, with the join logic attached.",
    whyNobodySells: "The raw list is free — but it arrives as an XLSX keyed to internal parcel IDs that don't match anything else. We normalize every parcel ID, join it to assessor owner/mailing/characteristics tables, score each row, and republish within days of the county's update.",
    stats: [
      { label: 'rows', value: '8,373' },
      { label: 'assessor-joined', value: '7,113' },
      { label: 'multi-year delinquent', value: '9' },
      { label: 'price', value: '$29 once' },
    ],
    sources: [
      { label: 'Denver Treasurer — Real Estate Delinquent Taxes & Tax Lien Sale', url: 'https://www.denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Department-of-Finance/Our-Divisions/Treasury/Property-Taxes/Real-Estate-Delinquent-Taxes-and-Tax-Lien-Sale' },
      { label: 'Denver Open Data — Assessor residential characteristics', url: 'https://opendata-geospatialdenver.hub.arcgis.com/datasets/geospatialDenver::real-property-residential-characteristics/explore' },
    ],
    coverage: 'Denver County (Jefferson publishes Sept; Boulder Oct — both watched automatically)',
  },
  {
    slug: 'water-rights',
    title: 'Colorado Water Rights & Well Permits by Parcel | Shinnslist',
    h1: 'Colorado well permits and water-rights flags, joined to parcels',
    description: '76,639 Colorado Division of Water Resources well permits across Denver, Jefferson and Boulder counties — active wells, aquifer types, parcel matches. Premium column on any mountain-parcel list.',
    status: 'live',
    intro: "Colorado runs on prior appropriation: a property's water right can be worth more than its views, and 'exempt' household-use wells carry no transferable water value. The state's DWR registry is public and searchable — nobody joins it to parcels at scale.",
    whyNobodySells: "The DWR API is free but paginated, unauthenticated, and keyed by permit receipt — not parcel number. We pull every permit in the corridor, match physical addresses to assessor site addresses, and flag each parcel's well status as a premium column.",
    stats: [
      { label: 'well permits ingested', value: '76,639' },
      { label: 'active-status', value: '44,555' },
      { label: 'parcels flagged', value: '3,899' },
      { label: 'counties', value: 'Denver · Jefferson · Boulder' },
    ],
    sources: [
      { label: 'CO Division of Water Resources — Well Permits REST API', url: 'https://dwr.state.co.us/Rest/GET/api/v2/wellpermits/wellpermit' },
    ],
    coverage: 'Zone A corridor (Denver, Jefferson, Boulder) — Larimer next',
  },
  {
    slug: 'flood-buyout',
    title: 'FEMA Flood Buyout Properties — Substantially Damaged, Motivated Sellers | Shinnslist',
    h1: 'FEMA flood-buyout and substantially-damaged property flags',
    description: 'OpenFEMA mitigation project-site records joined to corridor geography: 149 Front Range sites including 63 substantially-damaged structures. Buyout-program owners are documented motivated sellers.',
    status: 'ingesting',
    intro: "When FEMA buys out flood-damaged homes or declares a structure substantially damaged, the owner enters a documented motivated-seller situation — acquisition grants, repetitive-loss designations, insurance pressure. This dataset is public. Nobody aggregates it for buyers.",
    whyNobodySells: "FEMA's HMA project-site inventory lists every acquisition and damage determination with location fields, but it's buried in a grant-administration API with no parcel mapping. We pull all Colorado records, filter to corridor towns, and geocode-match to parcels.",
    stats: [
      { label: 'corridor records', value: '149' },
      { label: 'substantially damaged', value: '63' },
      { label: 'Lyons (SD capital)', value: '45 records / 37 SD' },
      { label: 'fire + flood hazards covered', value: 'yes' },
    ],
    sources: [
      { label: 'OpenFEMA — HmaSubapplicationsProjectSiteInventories V1', url: 'https://www.fema.gov/api/open/v1/HmaSubapplicationsProjectSiteInventories' },
    ],
    coverage: 'Lyons · Longmont · Boulder · Jamestown · Estes Park · Nederland · Arvada',
  },
  {
    slug: 'burn-scar',
    title: 'Wildfire Burn-Scar Parcels — Fire Motivated Sellers | Shinnslist',
    h1: 'Burn-scar parcel flags from USFS fire perimeters',
    description: 'MTBS burned-area boundaries intersected with corridor parcels: Marshall, Fourmile Canyon, Alexander Mountain, Bobcat and more. Post-fire owners are proven motivated sellers.',
    status: 'ingesting',
    intro: "After a wildfire, parcels inside the perimeter carry insurance pressure, mitigation requirements, and — often — owners who want out. USGS/USFS publish precise burn perimeters (MTBS) for every significant fire back to 1984.",
    whyNobodySells: "Fire perimeter polygons are public GIS layers, but no lead vendor intersects them against assessor parcels. We do exactly that — every corridor parcel gets a burn-scar flag, fire name, and year.",
    stats: [
      { label: 'corridor fires mapped', value: '10' },
      { label: 'largest', value: 'Bobcat 2000 — 10,437 ac' },
      { label: 'most recent', value: 'Alexander Mountain 2024' },
      { label: 'perimeter source', value: 'USFS MTBS 1984–2024' },
    ],
    sources: [
      { label: 'USFS Enterprise — EDW MTBS Burned Area Boundaries', url: 'https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_MTBS_01/MapServer' },
    ],
    coverage: 'Full corridor — every parcel inside a mapped fire perimeter',
  },
  {
    slug: 'str-eligible',
    title: 'STR-Eligible Parcels — Short-Term Rental License Registries | Shinnslist',
    h1: 'Short-term-rental eligibility, license registries, caps and waitlists',
    description: 'Per-parcel STR eligibility for the mountain corridor: Boulder County license registry (parcel-keyed), Estes Park town limits, Larimer 208-cap waitlist rules. The biggest hidden-value lever in the corridor.',
    status: 'ingesting',
    intro: "In this corridor STR eligibility swings property value more than any other single factor. A buyer who assumes 'the neighbor has an Airbnb so I can too' can eat a five-figure loss. Eligibility is set parcel-by-parcel: town limits, zoning districts, license caps, and waitlists.",
    whyNobodySells: "Counties publish their actual STR license registries as open GIS layers (Boulder does), and cap/waitlist rules live in county code pages. No aggregator normalizes them per parcel. We join licenses to parcels and encode each jurisdiction's rulebook.",
    stats: [
      { label: 'Boulder licenses (registry)', value: '374' },
      { label: 'active licensed', value: '181' },
      { label: 'Larimer EV cap', value: '208 licenses' },
      { label: 'Estes Park town parcels', value: '5,482' },
    ],
    sources: [
      { label: 'Larimer County — Lodging facilities in residential dwellings (STR rules)', url: 'https://www.larimer.gov/planning/short-term-rentals' },
      { label: 'Town of Estes Park — Vacation Home Licenses', url: 'https://estespark.colorado.gov/vacationhomelicensing' },
      { label: 'Boulder County GIS — OP_STR_Point license layer', url: 'https://maps.bouldercounty.org/arcgis/rest/services/PLANNING/OP_STR_Point/MapServer' },
    ],
    coverage: 'Estes Park · Estes Valley unincorporated (Larimer) · Boulder County unincorporated · Lyons',
  },
  {
    slug: 'unpermitted-structures',
    title: 'Unpermitted Structures — Permit Cross-Reference Lists | Shinnslist',
    h1: 'Unpermitted-structure detection: assessor footprints vs permit dockets',
    description: 'Structures that exist on assessor rolls with no matching permit in county Accela dockets — legalize them cheap, add value instantly. 272K Boulder docket records already ingested.',
    status: 'ingesting',
    intro: "A barn, ADU, or deck without a permit record is either a liability or a discount — and legalizing one often costs far less than the value it unlocks. Counties publish complete permit dockets publicly; the cross-reference is the product.",
    whyNobodySells: "Permit systems (Accela) expose public search portals one parcel at a time. Bulk export doesn't exist. We ingest the entire docket history via GIS mirrors and diff it against assessor improvement data.",
    stats: [
      { label: 'permit dockets ingested (Boulder)', value: '272,399' },
      { label: 'residential remodels', value: '28,938' },
      { label: 'new residences', value: '21,192' },
      { label: 'OWTS septic records', value: '44,964' },
    ],
    sources: [
      { label: 'Boulder County GIS — OP_Accela_Point docket layer', url: 'https://maps.bouldercounty.org/arcgis/rest/services/PLANNING/OP_Accela_Point/MapServer' },
      { label: 'Boulder County GIS — OWTS septic points', url: 'https://maps.bouldercounty.org/arcgis/rest/services/PLANNING/OP_OWTS_Point/MapServer' },
    ],
    coverage: 'Boulder County first; Jefferson/Denver permit portals queued',
  },
  {
    slug: 'code-violations',
    title: 'Code-Violation Distress Lists — Owner Signal | Shinnslist',
    h1: 'Code-violation velocity as an owner-distress signal',
    description: 'Municipal code-enforcement cases joined to parcels — violation counts, repeat offenders, portfolio-level patterns. Chicago-proven methodology, corridor cities queued.',
    status: 'ingesting',
    intro: "A property amassing code violations is telling you something about its owner: disinterest, incapacity, or financial distress. Violation *velocity* across an owner's whole portfolio is the strongest version of the signal.",
    whyNobodySells: "Cities publish enforcement case data on Socrata portals. The join across jurisdictions — and the portfolio grouping by owner name — is unsold manual work. Our engine proved it on Chicago data; corridor cities are queued.",
    stats: [
      { label: 'methodology proof market', value: 'Chicago (7.5M-row pipeline)' },
      { label: 'corridor cities queued', value: 'Arvada · Lakewood · Longmont · Westminster' },
    ],
    sources: [
      { label: 'Method doc — geo/code_violations adapter (repo)', url: 'https://github.com/shinnjr/shinnslist-realestate' },
    ],
    coverage: 'Corridor municipalities — adapters exist, city onboarding queued',
  },
  {
    slug: 'best-value-score',
    title: 'Best-Value Score — Flip vs Hold vs Market Expectation | Shinnslist',
    h1: 'One number: best value = max(flip, hold) vs what the seller expects',
    description: 'Our ARV engine prices every parcel three ways — wholesale flip, buy-and-hold income, market expectation — and ranks by edge. Backtested: 5.9% median error on real Denver sales.',
    status: 'ingesting',
    intro: "Lists tell you who's distressed. A valuation tells you what to pay. Ours computes wholesale-flip value, buy-and-hold income value, and the market expectation for every parcel, then ranks by the gap between the best use and the price.",
    whyNobodySells: "AVMs like Zillow's are tuned for consumer display and refuse low-comps geographies. Our weighted-comp engine is published, backtested on real recorded sales, and re-tuned per market — with the error stats shown, not hidden.",
    stats: [
      { label: 'Denver backtest median error', value: '5.9%' },
      { label: 'inside ±10% band', value: '76.0%' },
      { label: 'real sales tested', value: '22,466' },
      { label: 'comp selection', value: 'distance × recency × similarity weighted' },
    ],
    sources: [
      { label: 'Methodology page — full formula + backtest', url: '/re/methodology' },
      { label: 'Denver sales & transfers layer (source)', url: 'https://opendata-geospatialdenver.hub.arcgis.com/datasets/geospatialDenver::real-property-sales-and-transfers/explore' },
    ],
    coverage: 'Denver live; corridor re-tune in progress; VA markets next',
  },
];

export function getAvenue(slug: string): Avenue | undefined {
  return avenues.find((a) => a.slug === slug);
}
