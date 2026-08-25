# USDA & Agriculture Grant / Cost-Share / Loan Programs — Individual & Small-Farm Applicable

**For:** Shinnslist grant-autopilot (shinnslist.com). Primary-source data only (USDA sites, state ag depts).
**Verified:** August 2026. URLs checked against live pages; blocked sites (NRCS/RD/usda.gov are bot-walled against curl) confirmed via live browser render or Wayback CDX status 200.

> **Bottom line for autopilot:** There is **no single USDA bulk/JSON/API feed for farm grants.** The landscape splits into two halves:
> - **Competitive grants** (VAPG, REAP, RBDG, RMAP, LFPP, SCBGP, BFRDP, SBIR) → posted on **Grants.gov**, which **has a real REST API/JSON feed** (already in Shinnslist). This is the only scalable structured source.
> - **Rolling, local-office, non-competitive programs** (EQIP, CSP, CRP, ACEP, RCPP, high tunnels, FSA loans) → **HTML pages only, no API/bulk**. Applications run continuously through the local USDA Service Center, with state-specific ranking cutoff dates. These need HTML scraping + deadline monitoring, not an API.

---

## PRIMARY DATA SOURCES (the "best single sources" at scale)

| Source | URL | Format | Notes |
|---|---|---|---|
| **farmers.gov — Loans / Conservation / program deadlines** | https://www.farmers.gov/loans · https://www.farmers.gov/conservation · https://www.farmers.gov/working-with-us/program-deadlines | HTML (no public API) | Best single front door for **individual farmers**. Aggregates FSA loans + NRCS conservation. |
| **farmers.gov beginning-farmer funding hub** | https://www.farmers.gov/your-business/beginning-farmers/funding | HTML | Curated funding list for new farmers. |
| **NRCS Programs & Initiatives index** | https://www.nrcs.usda.gov/programs-initiatives | HTML (bot-walled, no API) | Master list of all NRCS conservation programs/initiatives. |
| **USDA Rural Development full program catalog** | https://www.rd.usda.gov/programs-services/all-programs | HTML (bot-walled, no API) | All RD grants + loans incl. VAPG, REAP, RBDG, RMAP. |
| **USDA Grants & Loans hub** | https://www.usda.gov/topics/farming/grants-and-loans | HTML | USDA-wide overview. |
| **Grants.gov (API/JSON)** | https://www.grants.gov (search: https://www.grants.gov/search-grants) + API | **JSON/REST API available** | The ONLY bulk/structured source. Covers all competitive USDA NOFOs (VAPG, REAP, RBDG, RMAP, LFPP, SCBGP, BFRDP, SBIR, AFRI). |
| **State departments of agriculture** | per-state (e.g. CA https://www.cdfa.ca.gov/grants) | HTML | SCBGP sub-grants + state-specific cost-share. No unified aggregator/API; per-state scraping required. |

---

## CONSERVATION (NRCS — cost-share / financial assistance, all rolling)

All NRCS programs: applicant = **any landowner/farmer/rancher/forest landowner** (individual or small farm), apply at the **local USDA Service Center**; continuous/rolling signup with state-specific ranking cutoff dates (e.g., Iowa set an Oct 10 cutoff in 2025). **No API — HTML only.**

### 1. EQIP — Environmental Quality Incentives Program ⭐ flagship
- **Funder:** NRCS | **URL:** https://www.nrcs.usda.gov/programs-initiatives/environmental-quality-incentives-program
- **Who:** Individual farmers, ranchers, forest landowners (private working lands).
- **Type/amount:** Financial assistance / **cost-share** per conservation practice; payment rates up to 75% typical, up to **100% for historically underserved** (beginning, limited-resource, socially disadvantaged, veteran) producers.
- **Deadline:** Rolling/continuous, state cutoff dates.
- **Data:** HTML only.

### 2. ⭐ EQIP HIGH TUNNEL SYSTEM INITIATIVE (the "free high-tunnel" program James saw)
- **Funder:** NRCS, delivered **through EQIP** | **URL:** https://www.nrcs.usda.gov/programs-initiatives/eqip-high-tunnel-initiative
- **Who:** Any farmer/rancher with an operation (owned or leased) — **individual small farms fully eligible**. High tunnels ("hoop houses") extend the growing season, improve soil/plant quality, reduce pesticide/energy inputs.
- **Type/amount:** **Cost-share / financial assistance** to pay for the tunnel (structure + supporting practices: micro-irrigation, mulching, drainage). Historically underserved producers can get **up to 100% of implementation cost**; standard producers receive a per-practice payment rate. A tunnel typically runs several thousand to ~$15k; NRCS payment covers a significant share.
- **Deadline:** Rolling — contact local NRCS/SD to apply under EQIP; state ranking cutoffs apply.
- **Data:** HTML only.

### 3. CSP — Conservation Stewardship Program
- **Funder:** NRCS | **URL:** https://www.nrcs.usda.gov/programs-initiatives/conservation-stewardship-program
- **Who:** Individual farmers/ranchers maintaining existing conservation efforts.
- **Type/amount:** Annual payments (5-year contracts) for implementing/expanding conservation practices.
- **Deadline:** Rolling signup, state cutoffs. | **Data:** HTML only.

### 4. CRP — Conservation Reserve Program
- **Funder:** FSA (with NRCS technical help) | **URL:** https://www.nrcs.usda.gov/programs-initiatives/conservation-reserve-program (also FSA: https://www.fsa.usda.gov/programs-and-services/conservation-programs/)
- **Who:** Landowners/farmers taking environmentally sensitive land out of production.
- **Type/amount:** Annual **rental payment** + practice cost-share.
- **Deadline:** Rolling/general signups. | **Data:** HTML only.

### 5. ACEP — Agricultural Conservation Easement Program
- **Funder:** NRCS | **URL:** https://www.nrcs.usda.gov/programs-initiatives/agricultural-conservation-easement-program
- **Who:** Landowners (farm/ranchland or wetland easements).
- **Type/amount:** Easement cost-share (up to 50% of easement value for agricultural land; wetlands cost-share on top of appraised value).
- **Deadline:** Rolling, state cutoffs. | **Data:** HTML only.

### 6. RCPP — Regional Conservation Partnership Program
- **Funder:** NRCS | **URL:** https://www.nrcs.usda.gov/programs-initiatives/regional-conservation-partnership-program
- **Who:** Partner-led (but farmers enroll in contracts to receive assistance).
- **Type/amount:** Financial assistance through partner projects.
- **Deadline:** Periodic partner NOFOs (Grants.gov) + rolling producer signup. | **Data:** NOFO on Grants.gov; program HTML only.

### 7. CIG — Conservation Innovation Grants
- **Funder:** NRCS | **URL:** https://www.nrcs.usda.gov/programs-initiatives/conservation-innovation-grants
- **Who:** Primarily orgs/companies (competitive); less individual-friendly.
- **Type/amount:** Grant. | **Deadline:** Annual NOFO on Grants.gov.

### 8. EQIP Organic Initiative / On-Farm Energy Initiative (add-ons)
- **URLs:** https://www.nrcs.usda.gov/programs-initiatives/eqip-organic-initiative · https://www.nrcs.usda.gov/programs-initiatives/on-farm-energy-initiative
- **Who:** Farmers in organic transition / wanting energy efficiency. Cost-share via EQIP. HTML only.

---

## FARM LOANS (FSA — individual applicants, rolling, HTML only)

All: individual farmer/rancher/forest landowner (or small family entity) applies at local FSA office; **rolling/continuous**; HTML only.

### 9. FSA Farm Ownership Loan
- **URL:** https://www.farmers.gov/loans (hub) — loan detail: https://www.fsa.usda.gov/programs-and-services/farm-loan-programs/
- **Who:** Individuals/entities buying or expanding a farm.
- **Type/amount:** **Loan**, direct up to **$600,000** (plus guaranteed option). | **Deadline:** Rolling.

### 10. FSA Farm Operating Loan
- **URL:** https://www.farmers.gov/loans
- **Who:** Individual producers financing seed/livestock/equipment/operating.
- **Type/amount:** **Loan**, direct up to **$400,000**. | **Deadline:** Rolling.

### 11. FSA Microloans ⭐ (best for small/beginning)
- **URL:** https://www.farmers.gov/loans
- **Who:** **Small, beginning, non-traditional, specialty** farmers — reduced paperwork.
- **Type/amount:** **Loan** (operating or ownership), up to ~**$50,000** (Microloan for Farm Ownership up to $50k too). | **Deadline:** Rolling.

### 12. FSA Farm Storage Facility Loan
- **URL:** https://www.farmers.gov/loans
- **Who:** Producers building/upgrading grain/commodity/fruit/vegetable storage.
- **Type/amount:** **Loan** up to **$500,000** (facilities) / **$100,000** (storage & handling trucks). | **Deadline:** Rolling.

### 13. FSA Youth Loans
- **URL:** https://www.farmers.gov/loans
- **Who:** Youth 10–20 (4-H/FFA) for educational ag projects. **Loan** up to **$5,000**. Rolling.

---

## RURAL DEVELOPMENT — COMPETITIVE GRANTS (posted on Grants.gov = **has API/JSON**)

### 14. VAPG — Value-Added Producer Grant ⭐
- **Funder:** USDA Rural Development | **URL:** https://www.rd.usda.gov/programs-services/value-added-producer-grants
- **Who:** **Independent agricultural producers (individual farmers), farmer cooperatives, ag business owners** creating/selling value-added products (processing, marketing, branding).
- **Type/amount:** **Grant**, up to **$75,000 planning** / up to **$250,000 working capital (implementation)**; requires cost-share match.
- **Deadline:** Annual/periodic NOFO (typically posted on Grants.gov, submissions via RD). | **Data:** Grants.gov API/JSON + RD HTML.

### 15. REAP — Rural Energy for America Program
- **Funder:** USDA Rural Development | **URL:** https://www.rd.usda.gov/programs-services/rural-energy-america-program-energy-audit-renewable-energy-development-assistance
- **Who:** **Agricultural producers + rural small businesses** (incl. small farms) for renewable energy/energy efficiency.
- **Type/amount:** **Grant** (up to 50% cost-share) + **loan guarantee**. | **Deadline:** Rolling application windows + periodic NOFOs on Grants.gov. | **Data:** Grants.gov API/JSON + RD HTML.

### 16. RBDG — Rural Business Development Grant
- **Funder:** USDA Rural Development | **URL:** https://www.rd.usda.gov/programs-services/rural-business-development-grants
- **Who:** Small businesses (incl. small farms/agribusiness) in rural areas; orgs; local governments.
- **Type/amount:** **Grant**, individual grants up to **$250,000**. | **Deadline:** Annual, state offices + Grants.gov NOFO. | **Data:** Grants.gov API/JSON + RD HTML.

### 17. RMAP — Rural Microentrepreneur Assistance Program
- **Funder:** USDA Rural Development | **URL:** https://www.rd.usda.gov/programs-services/rural-microentrepreneur-assistance-program
- **Who:** Microenterprises in rural areas (very small farms/businesses) via intermediary lenders.
- **Type/amount:** **Loans up to $50,000** + technical assistance grants. | **Deadline:** Rolling via intermediaries. | **Data:** Grants.gov API + RD HTML.

### 18. B&I — Business & Industry Loan Guarantee
- **Funder:** USDA Rural Development | **URL:** https://www.rd.usda.gov/programs-services/business-industry-loan-guarantees
- **Who:** Rural businesses incl. farm-related enterprises. | **Type/amount:** **Loan guarantee**. | **Deadline:** Rolling. | **Data:** HTML.

### 19. Rural Cooperative Development Grant
- **URL:** https://www.rd.usda.gov/programs-services/rural-cooperative-development-grant-program — cooperative orgs, less individual.

---

## AMS — SPECIALTY CROP / LOCAL FOOD / ORGANIC (competitive; SCBGP state-gated)

### 20. SCBGP — Specialty Crop Block Grant Program
- **Funder:** AMS | **URL:** https://www.ams.usda.gov/services/grants/scbgp
- **Who:** **State departments of agriculture apply**; funds then flow to specialty-crop projects, farms, and nonprofits. Not direct-to-individual.
- **Type/amount:** Grant (federal → state → project). | **Deadline:** Annual (Grants.gov NOFO). | **Data:** Grants.gov API + AMS HTML.

### 21. LFPP — Local Food Promotion Program (incl. Farmers Market Promotion funding)
- **Funder:** AMS | **URL:** https://www.ams.usda.gov/services/grants/lfpp
- **Who:** Local food enterprises, farmers markets, producer networks, co-ops (**orgs**, not individuals).
- **Type/amount:** Grant (planning up to $100k; implementation up to $500k). | **Deadline:** Annual NOFO on Grants.gov. | **Data:** Grants.gov API + AMS HTML.

### 22. OCCSP — Organic Certification Cost Share Program ⭐
- **Funder:** AMS (disbursed via state agencies) | **URL:** https://www.ams.usda.gov/services/grants/occsp
- **Who:** **Individual certified organic producers** — reimbursement of certification costs.
- **Type/amount:** **Reimbursement up to $750 per certification category** (recently $1,000 in some cycles). | **Deadline:** Rolling reimbursements through state agencies. | **Data:** AMS HTML only (state agencies administer).

---

## NIFA — COMPETITIVE (institution/org-gated; on Grants.gov = **API/JSON**)

### 23. BFRDP — Beginning Farmer and Rancher Development Program
- **Funder:** NIFA | **URL:** https://www.nifa.usda.gov/grants/funding-opportunities/beginning-farmer-rancher-development-program
- **Who:** **Land-grant universities and community-based/nonprofit organizations** — NOT direct to individual farmers (individuals benefit as program participants). | **Type/amount:** Grant (education/outreach projects). | **Deadline:** Annual NOFO on Grants.gov. | **Data:** Grants.gov API + NIFA HTML.

### 24. SBIR — Small Business Innovation Research (ag focus)
- **Funder:** NIFA | **URL (hub):** https://www.nifa.usda.gov/grants/funding-opportunities (search "SBIR")
- **Who:** **For-profit small businesses <500 employees** — a small farm structured as a business can qualify. | **Type/amount:** Grant, Phase I up to ~$180k. | **Deadline:** Annual NOFO on Grants.gov. | **Data:** Grants.gov API + NIFA HTML.

### 25. SARE — Sustainable Agriculture Research & Education
- **Funder:** NIFA via regional SARE programs | **URL:** https://www.sare.org (regional grant programs, some producer-eligible e.g. Farmer/Rancher grants)
- **Who:** Varies by region; some **producer/individual grants** available (e.g., SARE Farmer-Rancher grants up to ~$30k). | **Type/amount:** Grant. | **Deadline:** Regional, periodic. | **Data:** HTML only (regional SARE sites).

---

## STATE DEPARTMENTS OF AGRICULTURE (HTML only, per-state scraping needed)

- Every state ag dept runs its own grants/cost-share: SCBGP sub-grants, specialty-crop cost-share, small-farm infrastructure, urban-ag, beginning-farmer, and state conservation (many match NRCS EQIP).
- No federal/unified API exists. A practical pattern: maintain a map of the 50 state ag-dept grants pages (e.g., CA https://www.cdfa.ca.gov/grants, NY https://agriculture.ny.gov, TX https://www.texasagriculture.gov, IL https://agr.illinois.gov) and scrape each for "grants / funding / cost-share" listings + PDFs.
- **NASDA** (National Association of State Departments of Agriculture) is the umbrella org — useful for a directory, not a data feed: https://www.nasda.org

---

## Key implementation notes for Shinnslist

1. **Grants.gov API is the only structured/JSON source** → already ingested. It fully covers the competitive individual-accessible grants: **VAPG, REAP, RBDG, RMAP, LFPP, SCBGP, BFRDP, SBIR**. Filter by USDA assistance listings (10.xxx: e.g., 10.352 VAPG, 10.868 REAP, 10.351 RBDG, 10.870 RMAP, 10.312 LFPP, 10.170 SCBGP, 10.311 BFRDP, 10.212 SBIR).
2. **The rolling NRCS/FSA programs (EQIP, CSP, CRP, ACEP, RCPP, high tunnel, farm loans) have NO API and are NOT on Grants.gov.** They are the ones with the highest individual-farm value (esp. **EQIP High Tunnel** = up to 100% funded tunnels) but require **HTML scraping of NRCS/FSA program pages + monitoring state office cutoff dates** (farmers.gov/working-with-us/program-deadlines is the best deadline hub).
3. **Bot-walls:** NRCS (nrcs.usda.gov), RD (rd.usda.gov), and usda.gov block curl (000/403) — use a real browser/renderer for scraping them.
4. **Don't scrape aggregators** (GrantWatch, Instrumentl) — per task constraint, stick to the primary sources above.
5. For the autopilot pipeline, prioritize: **Grants.gov API (competitive)** + **farmers.gov program-deadlines scrape** + **NRCS/RD program-page scrape** + **state ag-dept scrape map**.
