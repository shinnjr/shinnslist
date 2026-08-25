# RESEARCH — Underserved grant-seeking verticals (the "long tail" map)

**The gap:** Instrumentl owns ~5,500 *institutional* nonprofits at $299–499/mo. Everyone else —
farms, homeowners, homebuyers, small business owners, veterans, individuals, childcare, fire
depts, artists — has real money available to them and **no tool serving them**. That's the map.

Grants/assistance are PUBLIC data (Grants.gov, state registries, IRS 990-PF, USDA/DOE/HUD/SBA/
FEMA/VA program sites). The moat is coverage + freshness + workflow — automation problems, which
is Shinnslist's exact skill (already refreshes 203 class actions daily via cron).

---

## The map — 28 verticals, ~22 confirmed

### TIER 1 — huge money, wildly underserved, perfect "find + file" fit

| # | Vertical (who) | Confirmed programs | Scale | Why underserved |
|---|---|---|---|---|
| 1 | **Homebuyers** | Down-payment assistance (every state), HUD HOME, FHA, USDA Single-Family | $10B+/yr across states | Most buyers never learn DPA exists; no "find what you qualify for" tool |
| 2 | **Homeowners** | IRA Home Energy Rebates (DOE $8.8B), Weatherization (WAP), solar, state rebates | $ billions, just rolled out | Zero consumer-facing "match me to my rebates" tool at scale |
| 3 | **Farms / ranchers** | USDA EQIP + CSP cost-share, FSA loans, REAP energy, RMA | $ billions/yr | Farms are analog; no autopilot for cost-share applications |
| 4 | **Rural small business** | USDA Rural Development (RBEG, Rural Microentrepreneur, REAP) | $100s millions | USDA RD grants go unclaimed; no SaaS targets rural biz |

### TIER 2 — real money, fragmented, strong fit

| # | Vertical | Confirmed programs | Notes |
|---|---|---|---|
| 5 | Women-owned biz | WOSB set-asides, Amber Grant ($10k/mo), Cartier ($100k), IFundWomen, state | Susan's anchor case |
| 6 | Minority-owned biz | MBDA, 8(a) BD, NMSDC, state MBE grants | |
| 7 | Veteran-owned biz | SDVOSB set-asides, Boots to Business, StreetShares, state | |
| 8 | Veterans (indiv) | VA benefits, emergency grants, home mod, VetBiz | |
| 9 | Childcare providers | CCDBG, state stabilization grants, T.E.A.C.H. | Post-COVID stabilization money, underserved |
| 10 | Fire depts / EMS | FEMA AFG + SAFER ($ hundreds millions/yr) | Small volunteer depts have no grant writers |
| 11 | Low-income / seniors (energy) | LIHEAP, Weatherization, state utility aid | benefits.gov, existing Shinnslist benefit coverage |
| 12 | Micro / sole-prop | SBA microloans, state micro-grants, Comcast RISE | |

### TIER 3 — real but narrower / event-driven / competitive

| # | Vertical | Confirmed programs | Notes |
|---|---|---|---|
| 13 | Artists / creatives | NEA, state arts councils, private fellowships | fragmented, low $ |
| 14 | Historic homeowners | State preservation grants, federal Historic Tax Credit | |
| 15 | Disaster victims | FEMA Individual Assistance | event-driven spikes |
| 16 | Returning citizens | Reentry grants, Second Chance Act | |
| 17 | Native tribes | BIA, HUD IHBG, tribal-specific | sovereign go-to-market |
| 18 | Teachers | DonorsChoose, classroom grants, Title | DonorsChoose already owns this |
| 19 | Food / value-added ag | USDA Value-Added Producer Grant, meat processing | |
| 20 | Churches / faith orgs | FEMA + private foundations | |
| 21 | Rural broadband | USDA ReConnect (co-ops/telcos) | enterprise-ish |
| 22 | Nonprofit startups | New 501c3s vs established | adjacent to incumbent turf |

### TIER 4 — incumbent turf or licensing-blocked (skip)

| Vertical | Why skip |
|---|---|
| Researchers | NIH/NSF — Instrumentl/Candid own it |
| Students / scholarships | no open feed, licensing (per prior research) |
| Established nonprofits | Instrumentl's 5,500 |

---

## The moat — off-market foundations (cuts across ALL verticals)

Every US private foundation files a public **990-PF** listing who it funded and how much.
~100k+ private grantmaking foundations; the long tail (family funds, local, corporate giving)
have **no website, no RFP, no aggregator listing**. That's the proprietary list nobody has
compiled into a searchable "apply here" index — and it funds *all* the demos above, not just
nonprofits.

Build: **IRS Business Master File + 990-PF corpus → off-market foundation index** (name,
funder, grant range, geography, cause, contact) + enrichment (cold email / dial list). This
is the sleep-money moat; the public aggregators only have the ~10% of foundations that bother
to publish RFPs.

---

## Recommendation

1. **Don't build 28 verticals.** Pick the 3 Tier-1 verticals where "find + file" is cleanest and
   money is biggest: **homebuyers (DPA), homeowners (IRA energy rebates), farms (USDA cost-share)**.
   Each is a "money already allocated to you, you just don't know it" — the same register as
   class actions/unclaimed, but with $10B-scale programs.
2. **The off-market foundation index is the cross-cutting moat** — build it once, it powers every
   vertical and is genuinely proprietary (nobody aggregates 990-PF into an "apply here" list).
3. **Each vertical is the same loop** (discover → match → draft → preview → approve → file), so
   the Shinnslist autopilot generalizes; it's a data-source swap per vertical, not a rebuild.

VERIFIED (live fetch, this session): USDA EQIP, DOE Home Energy Rebates Program, Grants.gov.
UNVERIFIED-approximate: dollar figures are public-program knowledge, flag for re-confirmation
before any launch claim.
