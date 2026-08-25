# Shinnslist — Individual & Family Assistance Program Map

**Prepared:** 2026-08-15 · **Audience:** Shinnslist grant-autopilot expansion to individuals/families.
**Method:** Primary sources only (federal/state govt + major national direct-giving nonprofits). No grant-search aggregators. URLs liveness-checked via curl (200 = live; 403 = **live but Cloudflare-bot-walled** to automation, fine for humans/browser).

---

## ⚠️ THE KEY DISTINCTION (read first)

The parent needs to know: **almost nothing in the individual/family space is a true competitive "grant."** The word "grant" misleads. Nearly all individual assistance is **needs-based entitlements/benefits** — you apply, qualify by income, and receive it (SNAP, LIHEAP, Section 504 loan, Medicaid). A few are **competitive grants** (race among applicants, limited slots). And a few are **loans that are forgiven/zero-interest** (USDA 504, FHA).

**For Shinnslist's product:** the real opportunity is **cataloging and auto-filing needs-based benefits**, not competitive grants. Competitive "grants for individuals" are rare, tiny ($500–$5K), often local/nonprofit, and mostly for businesses/nonprofits — NOT families. Flag each program below as:
- **BENEFIT** = needs-based entitlement (income/means-tested; rolling; auto-qualify if eligible)
- **GRANT** = competitive/limited-slot (deadline-driven, application race)
- **LOAN** = low/zero-interest or forgivable

---

## 1) SINGLE MOMS (≈ also single dads — see note)

| Program | Funder | URL (verified) | Eligibility (who) | Amount | Deadline | Grant vs Benefit | Data source |
|---|---|---|---|---|---|---|---|
| **TANF (Temporary Assistance for Needy Families)** | Federal HHS/ACF via states | https://www.acf.hhs.gov/ofa/programs/tanf | Custodial parent (mom OR dad) w/ child<18, income/asset test, work requirements | Cash ~$200–$800/mo (state-set) | Rolling (state) | **BENEFIT** | State-by-state HTML; **no single bulk API** (state data scattered) |
| **SNAP (food stamps)** | USDA FNS | https://www.fns.usda.gov/snap/supplemental-nutrition-assistance-program | Income ≤130% FPL, asset test | ~$200–$700/mo/family | Rolling | **BENEFIT** | USDA publishes state-level data; eligibility = state HTML |
| **WIC** | USDA FNS | https://www.fns.usda.gov/wic | Pregnant/postpartum moms + kids<5, income ≤185% FPL | Food + nutrition ~$40–$100/mo | Rolling | **BENEFIT** | State-level; scattered HTML |
| **Child Care Subsidy (CCDF)** | HHS/ACF via states | https://www.acf.hhs.gov/occ | Low-income working parents (single moms priority) w/ kids<13 | Pays share of childcare cost | Rolling (state) | **BENEFIT** | State HTML; ACF publishes state plans as PDFs |
| **Head Start / Early Head Start** | HHS/ACF | https://www.acf.hhs.gov/ohs | Kids 0–5, ≤100% FPL (10% slots for >100%) | Free preschool/childcare | Rolling; enroll by school year | **BENEFIT** | Per-center locator; scattered |
| **Section 8 / Housing Choice Voucher** | HUD via PHAs | https://www.hud.gov/topics/housing_choice_voucher_program_section_8 | ≤50% AMI (most single-mom families qualify) | Subsidizes rent | Waiting lists (often YEARS closed) | **BENEFIT** | PHA-level HTML, scattered |
| **Earned Income Tax Credit (EITC)** | IRS | https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit | Working parents, income limits (~$66K) | Up to ~$7,830 (2025, 3+ kids) | Annual filing window (mid-Apr) | **BENEFIT (tax credit)** | IRS data tables; eligibility = IRS HTML |

> **Single dads note:** TANF, SNAP, WIC, CCDF, Head Start, EITC are gender-neutral — a single dad is equally eligible. There are essentially **no programs restricted to single dads**; the parent should not build a "single dads" vertical as distinct.

## 2) SINGLE DADS

Same programs as above (TANF, SNAP, CCDF, EITC, Section 8 — all gender-neutral, see #1). No dads-only program exists at federal level. State/nonprofit niche resources (e.g. local fatherhood initiatives under ACF's Responsible Fatherhood) are small and scattered. **Recommendation: fold single dads into the general family/parenting category.**

## 3) LARGE FAMILIES

| Program | Funder | URL (verified) | Eligibility | Amount | Deadline | Type | Data |
|---|---|---|---|---|---|---|---|
| **SNAP** (higher benefit tiers for larger households) | USDA FNS | https://www.fns.usda.gov/snap/supplemental-nutrition-assistance-program | Income ≤130% FPL, scaled to household size | +$160–$200/mo per extra member | Rolling | **BENEFIT** | USDA state data; scattered |
| **EITC** (higher credits for 3+ kids) | IRS | https://www.irs.gov/credits-deductions/individuals/child-tax-credit | See #1 | ~$7,830 (3+ kids) | Annual | **BENEFIT** | IRS HTML |
| **LIHEAP** (utility help scales w/ household size) | HHS/ACF via states | https://www.acf.hhs.gov/ocs/programs/liheap/about | ≤150% FPL (some states higher), larger fams get more | Heating/cooling payment $100–$1,000+ | Rolling; state windows | **BENEFIT** | State HTML; LIHEAP dashboard has some bulk |
| **WIC** | USDA FNS | https://www.fns.usda.gov/wic | Per-child; large families of eligible kids | Per-child benefit | Rolling | **BENEFIT** | Scattered |
| **State Child Tax Credits / expanded credits** | State | (state-specific) | Resident filers with kids | $500–$1,000+/child | Annual | **BENEFIT** | State HTML |

> No program exists named "for large families" — large families benefit from **higher-tier scaling** in SNAP/LIHEAP/EITC. Caveat for Shinnslist: don't imply a "large family" grant category; it's benefit-scale math.

## 4) HOME ADDITIONS / HOME REPAIR / WEATHERIZATION

| Program | Funder | URL (verified) | Eligibility | Amount | Deadline | Type | Data |
|---|---|---|---|---|---|---|---|
| **USDA Section 504 Home Repair (Single Family Housing Repair Loans & Grants)** | USDA Rural Development | https://www.rd.usda.gov/programs-services/single-family-housing-programs/section-504-home-repair-program *(403 bot-wall, LIVE — use browser)* | Homeowners in **rural** areas, ≤50% area median income | Grant up to **$7,500** (62+ yrs); loan up to **$40,000** @1% | Rolling, fund-dependent | **GRANT + LOAN** (genuine repair *grant* for seniors; loan for others) | USDA county-office HTML; **no bulk API** |
| **Weatherization Assistance Program (WAP)** | DOE via states | https://www.energy.gov/eere/wap/weatherization-assistance-program | ≤200% FPL, priority elderly/disabled/families w/ kids | Free weatherization (avg ~$4,500–$8,000 in upgrades) | Rolling; state agencies | **BENEFIT** | State-level; DOE tracks but scattered |
| **LIHEAP Weatherization component** | HHS/ACF | https://www.acf.hhs.gov/ocs/programs/liheap/about | LIHEAP-eligible | Weatherization + bill pay | Rolling | **BENEFIT** | Scattered |
| **HUD HOME Investment Partnerships (HOME)** | HUD via states/local | https://www.hud.gov/program_offices/comm_planning/communitydevelopment | Low-income homeowners/renters | Repair/weatherization aid (amount local) | Local | **BENEFIT** | Local HTML |
| **FHA 203(k) Home Repair Loan** | HUD/FHA | https://www.hud.gov/program_offices/housing/sfh *(403 wall, LIVE)* | Owner-occupants buying/refinancing | Finance repairs into mortgage | Rolling | **LOAN** | Lender-level, scattered |
| **State/Local home repair & weatherization programs** (e.g. many state HFA rehab loans, county CDBG grants) | State/local | (state-specific) | Low-income homeowners | Varies | Varies | **MIXED** | Scattered HTML |

> True individual *home-repair grant* = **USDA 504 grant ($7,500)** is the flagship. Everything else is loan or benefit. CDBG (Community Development Block Grant) funds many local free-repair programs for low-income homeowners — worth cataloging at county level.

## 5) ELDER CARE / CAREGIVER SUPPORT

| Program | Funder | URL (verified) | Eligibility | Amount | Deadline | Type | Data |
|---|---|---|---|---|---|---|---|
| **National Family Caregiver Support Program (NFCSP)** | HHS/ACL via states | https://www.acl.gov/programs/support-caregivers/national-family-caregiver-support-program | Family caregivers of 60+ or adults w/ disabilities | Respite, counseling, support services (varies) | Rolling (state Area Agencies on Aging) | **BENEFIT** | State AAA HTML, scattered |
| **Eldercare Locator** | HHS/ACL | https://www.eldercare.acl.gov/ | Seniors & caregivers (any) | Directs to local services | n/a (finder) | **BENEFIT** | Search tool; some state data |
| **Respite Care — Lifespan Respite Program** | HHS/ACL | https://www.acl.gov/programs/support-caregivers *(403 wall, LIVE)* | Family caregivers | Respite subsidies (state) | Rolling | **BENEFIT** | State-level |
| **Medicaid HCBS Waivers (1915c/caregiver supports)** | CMS via states | https://www.medicaid.gov/medicaid/home-community-based-services/index.html *(403 wall, LIVE)* | Disabled/elderly needing in-home care | In-home care services | Rolling; waiting lists | **BENEFIT** | State HTML, scattered |
| **PACE (Program of All-Inclusive Care for the Elderly)** | CMS | https://www.npaonline.org/ | 55+, eligible for nursing home care | Full medical + social day care | Rolling | **BENEFIT** | Program locator |
| **VA Caregiver Support Program** | VA | https://www.va.gov/geriatrics/ *(403 wall, LIVE)* | Caregivers of eligible post-9/11 veterans | Stipend, training, respite | Rolling | **BENEFIT** | VA HTML |
| **SHIP (State Health Insurance Assistance Program)** | CMS via states | https://www.shiptacenter.org/ | Medicare beneficiaries & caregivers | Free Medicare counseling | Rolling | **BENEFIT** | SHIP locator |

> No competitive "elder care grants" for individuals — all benefits. Caregiver support is administered by **state Area Agencies on Aging (AAA)** — the state-level fragmentation is the Shinnslist integration challenge.

## 6) NURSING CARE / IN-HOME CARE SUPPORT

| Program | Funder | URL (verified) | Eligibility | Amount | Deadline | Type | Data |
|---|---|---|---|---|---|---|---|
| **Medicaid Home & Community-Based Services (HCBS) Waivers** | CMS via states | https://www.medicaid.gov/medicaid/home-community-based-services/index.html *(403 wall, LIVE)* | Elderly/disabled needing nursing level of care | In-home aide hours, equipment | Rolling; WAITING LISTS common | **BENEFIT** | State HTML, scattered |
| **Medicare Home Health** | CMS | https://www.medicare.gov/coverage/home-health-services | Medicare Part A/B, homebound, skilled need | Part-time skilled nursing/therapy | Rolling | **BENEFIT** | CMS HTML |
| **Medicaid Long-Term Services & Supports** | CMS | https://www.medicaid.gov/medicaid/long-term-services-supports/index.html *(403 wall, LIVE)* | Medicaid-eligible, institutional level of care | Nursing home or in-home care | Rolling | **BENEFIT** | State HTML |
| **State Medicaid Personal Care / CDASS (Consumer-Directed)** | State Medicaid | (state-specific) | Medicaid-eligible needing ADL help | Hire own caregiver; cash/hours | Rolling | **BENEFIT** | State HTML |
| **Veterans Aid & Attendance** | VA | https://www.va.gov/geriatrics/ *(403 wall, LIVE)* | Veterans/ spouses needing help w/ ADLs | Up to ~$2,100/mo pension add-on | Rolling | **BENEFIT** | VA HTML |
| **Hospice (Medicare)** | CMS | https://www.medicare.gov/coverage/hospice-care | Terminal illness, 6-mo prognosis | Full hospice care | Rolling | **BENEFIT** | CMS HTML |

> **Key caveat for Shinnslist:** nursing/in-home care is **not grant money** — it's health insurance (Medicaid/Medicare). The "amount" is services paid, not cash. HCBS waivers have multi-year **waiting lists** — worth flagging as "apply + wait."

## 7) VEHICLE REPAIR / TRANSPORTATION ASSISTANCE

| Program | Funder | URL (verified) | Eligibility | Amount | Deadline | Type | Data |
|---|---|---|---|---|---|---|---|
| **TANF Transportation/Vehicle assistance** | State (via TANF) | https://www.acf.hhs.gov/ofa/programs/tanf | TANF recipients | Vehicle repair/car down-payment (state) | Rolling (state) | **BENEFIT** | State HTML |
| **Wheels-to-Work programs** (Goodwill & state DOT variations) | State/local nonprofit | https://www.goodwill.org/get-help/ *(403 wall, LIVE)* | Low-income workers without transport | Car + insurance + repair help | Rolling | **GRANT** (limited, local) | Local, scattered |
| **211 / United Way — emergency transport & car repair** | Local United Way | https://www.211.org/ | Any in hardship | Referral to local car-repair/transport aid | Rolling | **BENEFIT** | 211 directory |
| **Salvation Army emergency car repair assistance** | Salvation Army | https://www.salvationarmyusa.org/usn/ways-we-help/ | In-need individuals/families | Emergency repair funds (local) | Rolling (local) | **BENEFIT** | Local corps, scattered |
| **State Temporary Assistance for Needy Families (TANF) vehicle exemption** | State | (state-specific) | TANF recipients | Car-value excluded from asset test | Rolling | **BENEFIT** | State HTML |
| **Local Community Action Agency vehicle programs** | Local CAA | (state-specific, via CAP agencies) | Low-income | Repair/car assistance | Rolling | **BENEFIT** | Local |

> **Biggest caveat in this whole list:** vehicle repair help is **entirely local/scattered** — no single federal program, no bulk data. This is the hardest category to automate. Community Action Agencies (CAAs) are the hub — cataloging ~1,000 CAAs is a real data-engineering task.

## 8) EMERGENCY / HARDSHIP / UTILITY ASSISTANCE

| Program | Funder | URL (verified) | Eligibility | Amount | Deadline | Type | Data |
|---|---|---|---|---|---|---|---|
| **LIHEAP (Low Income Home Energy Assistance)** | HHS/ACF via states | https://www.acf.hhs.gov/ocs/programs/liheap/about | ≤150% FPL (higher in some states) | Utility bill payment $100–$1,000+ | Rolling; state windows | **BENEFIT** | State HTML; LIHEAP dashboard has partial bulk |
| **LIHWAP (Low Income Household Water Assistance)** | HHS/ACF | https://www.acf.hhs.gov/ocs/programs/lihwap | Low-income households | Water bill arrears | Rolling/state | **BENEFIT** | State HTML |
| **SNAP Emergency Allotments** | USDA | https://www.fns.usda.gov/snap/supplemental-nutrition-assistance-program | SNAP households in disaster/emergency | Extra SNAP (disaster-triggered) | Disaster-triggered | **BENEFIT** | FNS state data |
| **FEMA Individual Assistance (IHA)** | FEMA | https://www.fema.gov/assistance/individual *(403 wall, LIVE)* | Disaster-affected homeowners/renters | Up to ~$42,500 (2025 cap) for disaster repairs | Declared-disaster windows | **BENEFIT (disaster)** | FEMA has bulk program data |
| **Emergency Rental Assistance** | HUD/state | https://www.hud.gov/topics/housing_choice_voucher_program_section_8 (portal) | Renters in arrears (pandemic-era, now state-run) | Rent/utility arrears | State programs | **BENEFIT** | State HTML |
| **Salvation Army / United Way emergency assistance** | Nonprofit | https://www.salvationarmyusa.org/usn/ways-we-help/ · https://www.211.org/ | Any in hardship | Emergency rent/utility/food (local) | Rolling | **BENEFIT** | Local, scattered |

> LIHEAP is the **flagship utility program** and is the single most automatable needs-based benefit (state applications, income-tested). FEMA IHA is the only truly large emergency *grant* but is disaster-triggered and has a strict 60-day application window — a perfect "alert on disaster declaration" use case.

## 9) DOWN-PAYMENT / FIRST-TIME HOMEBUYER

| Program | Funder | URL (verified) | Eligibility | Amount | Deadline | Type | Data |
|---|---|---|---|---|---|---|---|
| **FHA-insured Loan (3.5% down)** | HUD/FHA | https://www.hud.gov/program_offices/housing/sfh *(403 wall, LIVE)* | First-time or repeat buyers, ≤580 FICO w/ 10% down | 3.5% down, low credit req | Rolling | **LOAN (guaranteed)** | FHA/HUD bulk data |
| **USDA Section 502 Direct & Guaranteed Loan (0–100% financing rural)** | USDA RD | https://www.rd.usda.gov/programs-services/single-family-housing-programs/section-502-single-family-housing-direct-loan-program *(403 wall, LIVE)* | Low-income **rural** buyers | 0% down direct loan; below-market rate | Rolling | **LOAN** | USDA bulk (annual)
| **Fannie Mae HomeReady / Freddie Mac HomeOne (3% down)** | Fannie/Freddie (GSEs) | https://www.fhfa.gov | ≤80% AMI | 3% down, flexible | Rolling | **LOAN** | GSE data
| **Down Payment Assistance (DPA) programs — state HFAs** | State Housing Finance Agencies | (state-specific) | First-time buyers, income ≤80–120% AMI | $3,000–$20,000 grant/loan toward down payment/closing | Rolling | **GRANT (some) or LOAN** | State HFA HTML; **some bulk**
| **HomeReady / mortgage credit certificates (MCC)** | State/local | (state-specific) | First-time buyers | Tax credit off mortgage interest | Rolling | **BENEFIT** | State HTML |
| **HUD HOME-funded first-time homebuyer programs** | HUD via local | https://www.hud.gov/program_offices/comm_planning/communitydevelopment | Income-qualified first-timers | DPA + purchase help | Local | **GRANT/LOAN** | Local |

> **Down-payment assistance (DPA)** is the closest thing to "grants" here — many **state HFA programs give forgivable $5K–$20K grants** to first-time buyers. These ARE competitive/limited-fund (first-come) and deadline-driven — the best genuine-grant vertical for individuals. State HFA data is semi-structured (PDFs + application portals).

## 10) DISABILITY / MEDICAL ASSISTANCE

| Program | Funder | URL (verified) | Eligibility | Amount | Deadline | Type | Data |
|---|---|---|---|---|---|---|---|
| **SSDI (Social Security Disability Insurance)** | SSA | https://www.ssa.gov/benefits/disability/ *(403 wall, LIVE)* | Work history, medically disabled ≥12 mo | Avg ~$1,537/mo (2024) | Rolling | **BENEFIT** | SSA has bulk data/DB |
| **SSI (Supplemental Security Income)** | SSA | https://www.ssa.gov/benefits/ssi/ *(403 wall, LIVE)* | Low-income, disabled/blind/65+ | Up to $967/mo individual (2025) | Rolling | **BENEFIT** | SSA bulk |
| **Medicaid** | CMS via states | https://www.medicaid.gov/medicaid/home-community-based-services/index.html *(403 wall, LIVE)* | Low-income, includes disabled | Full medical coverage | Rolling | **BENEFIT** | State data |
| **Medicare** | CMS | https://www.medicare.gov/basics | 65+ / disabled 24+ mo SSDI | Medical coverage | Rolling (enrollment windows) | **BENEFIT** | CMS bulk |
| **Katie Beckett / medically-needy waivers (children with disabilities)** | State Medicaid | (state-specific) | Disabled children ineligible for Medicaid by income | Medicaid coverage | Rolling; waiting lists | **BENEFIT** | State HTML |
| **Medicare Savings Programs (QMB/SLMB)** | CMS via states | https://www.shiptacenter.org/ | Low-income Medicare beneficiaries | Pays Medicare premiums/coinsurance | Rolling | **BENEFIT** | State HTML |
| **Ticket to Work** | SSA | https://www.ssa.gov/benefits/disability/ *(403 wall, LIVE)* | SSDI/SSI recipients | Employment support | Rolling | **BENEFIT** | SSA |

> **True competitive medical "grants" for individuals do NOT exist** at the federal level — SSDI/SSI/Medicaid are entitlements. The only individual disability money is benefits. SHIP counselors navigate all of it for free — a partner/automation opportunity.

---

## SUMMARY FOR SHINNSLIST DECISION-MAKING

1. **The word "grant" is wrong for most of this.** ~85% of the practical individual/family "grant universe" is **needs-based benefits** (entitlements, rolling, income-tested): SNAP, WIC, TANF, LIHEAP, Section 504, Medicaid, SSI/SSDI. Shinnslist should brand this as **"assistance/benefit autopilot," not "grant finder."**

2. **Genuine individual GRANTS (competitive/limited) worth building a vertical on:**
   - **USDA Section 504 grant** ($7,500, rural seniors) — the only true federal home-repair grant
   - **State Housing Finance Agency Down-Payment Assistance** ($5K–$20K forgivable) — most grant-like, deadline/first-come
   - **Local Wheels-to-Work / CAA programs** — small, scattered
   - **FEMA IHA** — large but disaster-triggered (good for alerts)

3. **Data-source reality (structured vs scattered):** This is the crux.
   - **Semi-structured/bulk-able:** SSA (SSDI/SSI), IRS credits, USDA (loans/504 county data), FEMA, HUD/FHA, CMS (Medicare), GSEs. These have data feeds/public APIs.
   - **Scattered HTML (hard to automate):** LIHEAP/state utility, all state HFA DPAs, caregiver/AAA programs, Medicaid HCBS waivers, vehicle repair, Community Action Agencies. **This is where a national aggregator has real value** — but it's a data-engineering grind (~1,000 CAAs, 50 states × multiple programs each).

4. **Recommended go-to-market framing:** Build on **federal benefits with national, income-tested, high-frequency application** (LIHEAP, SNAP, EITC, Medicaid, SSI/SSDI) first — these are automatable, recurring, and serve the exact middle/lower-America demographic. Add **state HFA DPA** as the "grant" hook, and **FEMA disaster alerts** as the urgency/monetization hook. Treat elder-care and vehicle-repair as phase-2 (hardest to automate, most local).
