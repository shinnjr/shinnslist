# Scholarship & Fellowship Data Feed — Feasibility & Primary-Source Research

**Task:** Can Shinnslist build a scholarship/fellowship feed at scale from PRIMARY or OPEN sources, without crawling competitor aggregators (Fastweb, Scholarships.com, Niche, College Board BigFuture)?

**Bottom line (honest verdict):** **There is NO clean, open, bulk, or API dataset of discrete scholarship *listings* anywhere in the US.** Federal and state data describe *aggregate outcomes* (how many awards were made, how many dollars, by college) — not the individual opportunities (name, eligibility, amount, deadline, link) a feed needs. Private scholarship listings are fragmented across ~10,000+ foundations, each publishing on its own website. The big aggregators do not hold primary data — they *license* the same commercial dataset from a handful of data wholesalers (primarily **NRCCUA / Carnegie's Educational Funding Company** and **Moolah**, plus foundation self-reports). **This is a data-licensing market, not a data-publishing market.** Verdict: a primary-source feed is **feasible but must be assembled**, not downloaded.

---

## 1. Is there a public/bulk/API scholarship dataset?

**No.** Verified findings:

- **data.gov** (federal open-data portal): A search for `scholarship` returns **34 datasets**. Every one of them is a *state-level aggregate program-statistics* set (e.g. "Scholarship Recipients and Dollars by College Code" from NY, "Roberta Willis Scholarship Aid by Town" from CT, "College Bound Scholarship Sign-Up Rates" from WA). These describe **money already awarded**, with CSV/JSON/XML bulk download — but **zero discrete listings**. Useful for market sizing; useless for a feed of opportunities.
- **data.gov CKAN API** (`/api/3/action/package_search`) is dead (returns `Not Found`); the current search surface is the HTML catalog at `catalog.data.gov`.
- **grants.gov** (the federal discretionary-grant portal): Its API v2 requires an **API key** (anonymous requests return 403) and covers **federal discretionary grants** (research, community, etc.), not private scholarships. `USASpending.gov`'s API works anonymously and mirrors awarded federal assistance — again **awards, not opportunities**.
- **NCES** and **Federal Student Aid** publish aggregate aid statistics, not listings.

**Conclusion:** There is no federal, state, or NGO open feed of scholarship *opportunities*. Any such dataset you find will be aggregate statistics.

---

## 2. Authoritative primary sources for scholarship *listings*

Listings live in a distributed, un-aggregated set of primary owners:

1. **Individual foundations / scholarship sponsors** — the true primary source. Thousands publish their own page (e.g. Coca-Cola Scholars Foundation, UNCF, Society of Women Engineers). No common schema, no central index.
2. **State higher-ed / financial-aid agencies** — each runs its own state grant/scholarship program (NY HESC, CA CSAC, WA WSAC, TX). They publish program *descriptions + outcomes*, occasionally a searchable list of state-administered scholarships.
3. **Universities** — publish their own institutional scholarship directories (institutional aid is huge but requires admission).
4. **Commercial data wholesalers** — NRCCUA/Educational Funding Company (feeds Fastweb, Scholarships.com, BigFuture, Niche), Moolah, ScholarshipAmerica. **These are what competitors actually resell.** They license, not publish openly.
5. **Federal Student Aid** — describes federal programs (Pell, SEOG, TEACH, military) and runs the searchable but thin "scholarship search" — the authoritative source *only for federal programs*.

---

## 3. How many scholarships exist in the US? (citable numbers)

Verified citable figures (primary/secondary aggregation):

- **1.8 million scholarships from private sources are awarded annually** (EducationData.org, "Scholarship Statistics," updated 2026-07).
- **$8.2 billion** in private-source scholarship money awarded annually (EducationData).
- **Over $100 billion in total grant + scholarship money annually** including government sources (EducationData).
- **Only ~11% of college students receive a scholarship** (EducationData).
- Average private scholarship award ≈ **$2,000–$4,100** (EducationData: avg award at public 2-year = $4,100; private undergrad avg ~$2k).
- Authoritative aggregate aid dollar figures: **College Board "Trends in Student Aid"** (annual, full PDF + Excel download, ~$240B total aid; federal aid is the majority). NCES Digest of Education Statistics is the federal corroboration.

**Number of discrete listings:** The commercial wholesalers and aggregators claim on the order of **1.5–3.7 million scholarships** in their databases, but these figures are **marketing claims, not citable statistics**, and heavily double-count near-identical/spam listings. The honest, defensible statement is: *hundreds of thousands of discrete, real, current scholarship listings exist, distributed across ~10,000+ primary sponsors, with no central registry.* (Shinnslist's "hundreds of thousands of listings" framing is consistent with reality.)

---

## 4. Fellowships: primary/structured sources

Fellowships are a *smaller, higher-value, better-curated* niche than scholarships:

- **ProFellow** — the leading US fellowship directory (~1,000+ profiled fellowships). Structure: clean per-listing schema (name, organization, amount, deadline, citizenship, field, level). **Public robots.txt allows crawling** (only `/profile/` and `/members/` disallowed) — but it's a competitor-adjacent directory, so treat as a **licensing/partnership** target, not a scrape source.
- **Fellowship directories at foundations** (Ford Foundation, AAUW, Fulbright/IIE, NSF GRFP, DAAD, Rhodes/Marshall/Gates-Cambridge) — each publishes its own structured application page.
- **NSF GRFP** and federal fellowship programs — listed on grants.gov/USASpending (federal, awards data).
- **No open bulk dataset of fellowships exists** either. ProFellow is the de-facto catalog and licenses its data.

---

## 5. Recommended primary sources (verified) — 10 sources

| # | Source | URL | What it offers | Access |
|---|--------|-----|----------------|--------|
| 1 | **data.gov catalog — "scholarship"** | https://catalog.data.gov/dataset?q=scholarship | 34 state-level aggregate scholarship datasets (recipients & dollars by college) — CSV/JSON/XML | Bulk download (free, open) |
| 2 | **College Board "Trends in Student Aid"** | https://research.collegeboard.org/trends/student-aid | Authoritative annual total-aid dollar figures + Excel data | PDF + XLSX download (free) |
| 3 | **NCES Digest of Education Statistics** | https://nces.ed.gov/programs/digest/ | Federal corroboration of aid totals, recipients | HTML/Excel, free |
| 4 | **Federal Student Aid (studentaid.gov)** | https://studentaid.gov | Federal program descriptions + aggregate aid data; scholarship-search tool | HTML + data-center stats |
| 5 | **grants.gov** | https://www.grants.gov | Federal discretionary grant/fellowship **opportunities** (structured) | API (needs key) + HTML search |
| 6 | **USASpending.gov API** | https://api.usaspending.gov | All federal grant/fellowship **awards** (type 02) | Public API (verified working, no key) |
| 7 | **State aid agencies** (e.g. NY HESC) | https://www.hesc.ny.gov | State scholarship program listings + outcome data | HTML, some CSV |
| 8 | **EducationData.org scholarship statistics** | https://educationdata.org/scholarship-statistics | Market-sizing numbers (1.8M/yr, $8.2B private, $100B total) | HTML (secondary aggregator, well-cited) |
| 9 | **Foundation sponsor directories** (e.g. UNCF, SWE, Coca-Cola Scholars) | uncf.org, swe.org/scholarships, coca-colascholarsfoundation.org | Individual primary scholarship listings | HTML (per-foundation) |
| 10 | **ProFellow** | https://www.profellow.com/fellowships/ | Best-curated fellowship catalog (~1,000+ listings) | HTML; robots allows — pursue **license/partnership** |

---

## 6. Feasibility verdict + recommended lawful approach

**Verdict:** Building a *fully primary, zero-license* scholarship feed covering hundreds of thousands of listings is **not achievable from any open source** — no such source exists. What IS achievable:

**Recommended next-best lawful approach (tiered):**

1. **License the commercial dataset** — This is the only realistic way to get a large, clean, current scholarship feed. The market leaders license from **NRCCUA / Educational Funding Company** and **Moolah** (and ProFellow for fellowships). This is what every competitor does. Cost is the main consideration; it also gives you clean structured fields (amount, deadline, eligibility) out of the box.
2. **Hybrid: license core + curate the long tail.** Use a licensed baseline (thousands of high-quality listings) and *add* a manual/curated layer of the highest-value niche scholarships (state programs, professional/affinity scholarships, foundations you onboard directly as sponsors). This gives differentiation Shinnslist can own.
3. **Primary-source aggregation as a value-add, not the backbone.** Aggressively collect from the true primaries that ARE structured and open: federal (grants.gov + USASpending, free), state agency program pages, and direct foundation sign-ups. This yields maybe thousands of verified listings — legally clean, but not "hundreds of thousands."
4. **Solicit sponsors directly.** Foundations benefit from a quality pipeline (better applications, less fraud). Onboarding sponsors to publish/feed their scholarships to Shinnslist is a legal, scalable, and defensible moat no crawler can replicate.

**Do NOT crawl:** Fastweb, Scholarships.com, Niche, College Board BigFuture are all Cloudflare/WAF-protected (verified: Scholarships.com serves a Cloudflare "Just a moment…" challenge to bots) and their listings are licensed, not owned — scraping them is both technically hostile and legally risky.

**Bottom line for planning:** Treat the scholarship feed as a **procurement + partnership problem** (license baseline from NRCCUA/Moolah + ProFellow for fellowships, plus direct sponsor onboarding + free federal/state primaries), **not** a data-engineering/scraping problem. Budget for a licensing line item.
