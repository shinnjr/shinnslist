# Shinnslist — Vertical Research & Deal Scoring Sources

## Trading Cards
| Source | Type | Pricing | Notes |
|--------|------|---------|-------|
| JustTCG | REST API | Free tier, paid plans | Pokemon, MTG, Yu-Gi-Oh pricing. Self-serve key. Best for market prices. |
| PriceCharting | REST API | Paid subscription | Sold-comps including PSA/BGS/CGC graded. Started in video games, expanded to cards. |
| CardSight | REST API | Free tier, commercial OK | Raw market data from eBay, Fanatics, COMC. Commercial use permitted. Pokemon + One Piece live. |
| CardHedge | REST API | From $49/mo | 3.7M+ cards, 40M+ weekly sales tracked. Production-ready. |
| pokemon-api.com | REST API | Free 100 req/day, paid plans | TCGPlayer, Cardmarket (EUR), eBay graded prices. PSA/CGC/BGS population data. |
| TCGPlayer | REST API | Closed to new devs | Acquired by eBay 2022. Existing partners only. |
| Communities | r/PokeInvesting, r/baseballcards, r/PokemonTCG, Whatnot | | Massive, concentrated, addicted buyers. |

**Deal Score:** Card ID + set + grade + condition → sold comp median → % below market

---

## Sneakers
| Source | Type | Pricing | Notes |
|--------|------|---------|-------|
| StockX | REST API | Developer portal | Public REST API. Catalog, pricing, listings. JSON responses. |
| GOAT | Access via KicksDB | Aggregator API | KicksDB/kicks.dev unifies StockX + GOAT + Flight Club. |
| sneaks-api | GitHub open source | Free | Compiles StockX, GOAT, Stadium Goods prices into single API. |
| Plott Data | REST API | Paid | Sneaker marketplace intelligence + dashboard. |
| Communities | r/sneakermarket, StockX, GOAT, eBay, Grailed | | |

**Deal Score:** Model + size + condition (DS/used) + last sale avg → % below market

---

## Watches
| Source | Type | Pricing | Notes |
|--------|------|---------|-------|
| WatchCharts | REST API | From $600/mo | Level 1: market price, dealer price, median ask. Level 2: 5yr history, retail, appraisal. 500K+ collectors. |
| Chrono24 ChronoPulse | Free index | Free | Based on actual transaction data. 140 models, 14 brands, 30K sales/month, 20 years data. |
| EveryWatch | Web + API | $49/mo or $444/yr | AI-powered. 1M+ watches. Aggregates hundreds of marketplaces + auction houses. |
| chrono24 Python | GitHub open source | Free | Python wrapper for Chrono24 listings scraping. |
| Communities | r/Watchexchange (300K), Watchuseek, Chrono24, Bob's Watches | | |

**Deal Score:** Brand + reference number + condition → WatchCharts market price → % below market

---

## Legos
| Source | Type | Pricing | Notes |
|--------|------|---------|-------|
| BrickLink API | REST API (v2/v3) | Free for registered users | Price Guide endpoint returns "Last 6 Months Sold" statistics. |
| Bricqer | Pricing automation | Paid | Formula-based pricing with BrickLink integration. |
| Communities | r/legomarket, Bricklink, eBay | | |

**Deal Score:** Set number + condition (sealed/used/complete) → BrickLink 6mo sold avg → % below market

---

## Handbags
| Source | Type | Pricing | Notes |
|--------|------|---------|-------|
| Fashionphile | Web scraping | N/A | No public API. 22K+ listings. Average $2,576. |
| Rebag | Web + Clair AI | N/A | No public API. 21K+ listings. Clair for instant pricing. |
| eBay sold | eBay API | Free tier | Completed listings, authenticity guarantee on luxury bags. |
| Vestiaire Collective | Web scraping | N/A | Peer-to-peer luxury, growing fast. |
| The RealReal | Web scraping | N/A | Consignment model, largest luxury reseller. |
| Communities | r/handbagexchange, Poshmark, PurseForum | | |

**Deal Score:** Brand + model + condition + material → Fashionphile/Rebag comps + eBay sold → % below market

⚠️ Authentication risk: Fakes are everywhere. Shinnslist doesn't authenticate — flippers are experts who do their own verification.

---

## Electronics / GPUs / Phones
| Source | Type | Pricing | Notes |
|--------|------|---------|-------|
| Swappa | Web scraping | N/A | Clean pricing data. Phone/GPU/laptop categories. |
| eBay sold | eBay API | Free tier | Broadest sold data. |
| r/hardwareswap | Reddit API | Free | 400K members. Confirmed trades. |
| Completed listings | Web scraping | N/A | FB Marketplace, OfferUp |

**Deal Score:** Model/SKU + condition → Swappa sold avg + eBay sold avg → % below market

---

## Cars
| Source | Type | Pricing | Notes |
|--------|------|---------|-------|
| KBB Developer Portal | REST API | Complex B2B licensing | InfoDriver Web Service 4.0, Advertising Data API. Trade-in, private party, retail values. |
| Vehicle Databases API | REST API | Transparent pricing | KBB alternative. Market value at state/city level. Easy integration. |
| Carfax API | B2B | Enterprise | Vehicle history reports. |
| Craigslist/FB/OfferUp | Web scraping | N/A | Listing discovery. |
| Communities | FB car groups, r/whatcarshouldibuy, Bring a Trailer, Cars & Bids | | |

**Deal Score:** VIN or year/make/model + mileage + condition → KBB/NADA value → % below market

⚠️ KBB licensing is complex for startups. Vehicle Databases API is the pragmatic alternative.

---

## Real Estate / Rentals / Raw Land
| Source | Type | Pricing | Notes |
|--------|------|---------|-------|
| Zillow API | REST API | Free (non-comm), $500/mo+ basic | Zestimates, market data, rentals. Restricted commercial use. |
| Zillow public data | CSV downloads | Free | ZHVI, market forecasts, rental indexes. |
| MLS feeds | IDX/RETS | Broker licensing required | Requires broker sponsorship. |
| Walk Score API | REST API | Free tier, paid | Walkability, transit, bike scores. |
| GreatSchools API | REST API | Free/paid | School ratings. |
| ATTOM / Black Knight | B2B | Enterprise | Property data, tax assessments, flood zones. |
| Communities | r/realestateinvesting, BiggerPockets, local investor groups | | |

**Deal Score for Rentals:** Price per sqft vs neighborhood avg, days on market, price drops, concessions (first month free)
**Deal Score for Sales:** Price per sqft vs comps, tax assessment gap, days on market, price cuts, foreclosure status
**Deal Score for Land:** Price per acre vs county comps, zoning, utilities access, topography

---

## Free Stuff
| Source | Type | Notes |
|--------|------|-------|
| Facebook Marketplace | Playwright scraping | Free category. Largest source. |
| Craigslist | HTML scraping | Free section. Easiest to scrape. |
| OfferUp | Playwright scraping | Free items filter. |
| Nextdoor | Playwright scraping | For Sale Free section. |
| TrashNothing | HTML scraping | Dedicated free-stuff site. |
| Buy Nothing groups | Facebook Graph API | Local giving groups. |

**Deal Score:** MSRP lookup → free/$0 vs retail value → deal score = 100 (it's free)

---

## Overall Architecture
All verticals share: scraping → normalization → deal scoring → alert pipeline → billing
Each vertical adds: source URLs, parsing logic, pricing API, normalization rules
New vertical = ~200-400 lines of config + parser code on shared infra
