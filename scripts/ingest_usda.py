#!/usr/bin/env python3
"""Shinnslist — USDA / farm programs catalog (rolling, non-Grants.gov programs).

Adds the NRCS/FSA/AMS programs that individual farmers and small farms apply for
through the local USDA Service Center. These are NOT on Grants.gov (no API) — they
are rolling/continuous signups. Tagged with `grant_type` = cost_share | loan | grant
| reimbursement. Primary-source URLs, verified 2026-08-15.

Usage:
  python3 ingest_usda.py             # full run
  python3 ingest_usda.py --dry-run   # parse only, no writes
"""
import sys
import json
from datetime import date, datetime

from ingest_grantsgov import (
    load_env, fetch_existing_slugs, upsert, slugify,
)

# (name, funder, url, amount_label, grant_type, summary)
PROGRAMS = [
    ("EQIP — Environmental Quality Incentives Program", "USDA NRCS",
     "https://www.nrcs.usda.gov/programs-initiatives/environmental-quality-incentives-program",
     "cost-share up to 75–100% of practice cost", "cost_share",
     "Financial assistance for conservation practices on working farmland. Up to 100% for historically underserved producers (beginning, limited-resource, socially disadvantaged, veteran). Apply at your local USDA Service Center."),
    ("EQIP High Tunnel System Initiative (free high tunnel)", "USDA NRCS",
     "https://www.nrcs.usda.gov/programs-initiatives/eqip-high-tunnel-initiative",
     "pays most–all of high tunnel cost (often ~$3k–$15k)", "cost_share",
     "Cost-share for high tunnels (hoop houses) to extend the growing season. Individual small farms fully eligible; historically underserved producers can get up to 100% of implementation cost. Rolling — contact local NRCS."),
    ("CSP — Conservation Stewardship Program", "USDA NRCS",
     "https://www.nrcs.usda.gov/programs-initiatives/conservation-stewardship-program",
     "annual payments (5-year contracts)", "cost_share",
     "Annual payments for maintaining and expanding conservation practices on working land."),
    ("CRP — Conservation Reserve Program", "USDA FSA",
     "https://www.fsa.usda.gov/programs-and-services/conservation-programs/",
     "annual rental payment + cost-share", "cost_share",
     "Annual rental payments to take environmentally sensitive land out of agricultural production."),
    ("ACEP — Agricultural Conservation Easement Program", "USDA NRCS",
     "https://www.nrcs.usda.gov/programs-initiatives/agricultural-conservation-easement-program",
     "easement cost-share up to 50%", "cost_share",
     "Cost-share for conserving farmland and wetlands through agricultural land easements."),
    ("EQIP Organic Initiative", "USDA NRCS",
     "https://www.nrcs.usda.gov/programs-initiatives/eqip-organic-initiative",
     "cost-share", "cost_share",
     "Assists organic producers and farmers transitioning to organic with conservation practices."),
    ("On-Farm Energy Initiative", "USDA NRCS",
     "https://www.nrcs.usda.gov/programs-initiatives/on-farm-energy-initiative",
     "cost-share", "cost_share",
     "Cost-share for on-farm energy efficiency improvements."),
    ("OCCSP — Organic Certification Cost Share", "USDA FSA / AMS",
     "https://www.fsa.usda.gov/programs-and-services/occsp",
     "reimburses up to $750 per certification category", "reimbursement",
     "Reimburses individual certified organic producers for organic certification costs. Rolling through state agencies."),
    ("FSA Microloans (small / beginning farmers)", "USDA FSA",
     "https://www.fsa.usda.gov/programs-and-services/farm-loan-programs/microloans/",
     "loan up to $50,000", "loan",
     "Small loans for beginning, small, non-traditional, and specialty farmers with reduced paperwork."),
    ("FSA Farm Operating Loan", "USDA FSA",
     "https://www.fsa.usda.gov/programs-and-services/farm-loan-programs/farm-operating-loans/",
     "direct loan up to $400,000", "loan",
     "Direct operating loan for seed, livestock, equipment, and operating costs."),
    ("FSA Farm Ownership Loan", "USDA FSA",
     "https://www.fsa.usda.gov/programs-and-services/farm-loan-programs/farm-ownership-loans/",
     "direct loan up to $600,000", "loan",
     "Direct loan to buy or expand a farm or ranch."),
    ("FSA Farm Storage Facility Loan", "USDA FSA",
     "https://www.fsa.usda.gov/programs-and-services/farm-loan-programs/farm-storage-facility-loans/",
     "loan up to $500,000", "loan",
     "Loan to build or upgrade grain and commodity storage facilities."),
    ("FSA Youth Loans (4-H / FFA)", "USDA FSA",
     "https://www.fsa.usda.gov/programs-and-services/farm-loan-programs/youth-loans/",
     "loan up to $5,000", "loan",
     "Loans for youth ages 10–20 (4-H/FFA) to fund educational agricultural projects."),
    ("SARE Farmer/Rancher Grants", "USDA NIFA / SARE (regional)",
     "https://www.sare.org/grants/",
     "grant up to ~$30,000", "grant",
     "On-farm research and innovation grants for individual farmers and ranchers, awarded through regional SARE programs."),
]


def main():
    today = date.today()
    print(f"=== USDA / farm programs catalog — {today.isoformat()} ===")
    rows = []
    for name, funder, url, amount, gtype, summary in PROGRAMS:
        rows.append({
            "slug": "usda-" + slugify(name),
            "name": name,
            "funder": funder,
            "amount_label": amount,
            "amount_min_cents": None,
            "amount_max_cents": None,
            "source_kind": "official",
            "deadline": None,
            "deadline_label": "Rolling",
            "cycle_key": str(today.year),
            "status": "rolling",
            "category": "agriculture",
            "summary": summary,
            "eligibility_text": "",
            "eligibility_rules": {
                "source_type": "usda_program",
                "grant_type": gtype,
                "categories": ["agriculture"],
                "service_focus": ["rural", "agriculture"],
                "geography": "all_us",
                "entity_types": ["individual", "small_business"],
                "individual_eligible": True,
            },
            "effort": "moderate",
            "fee_cents": 0,
            "source_url": url,
            "application_url": url,
            "verified_at": datetime.utcnow().isoformat() + "Z",
        })
    print(f"programs: {len(rows)}")

    if "--dry-run" in sys.argv:
        print("[dry-run] sample:")
        print(json.dumps(rows[1], indent=2))
        return

    env = load_env()
    existing = fetch_existing_slugs(env)
    new_count = sum(1 for r in rows if r["slug"] not in existing)
    print(f"new: {new_count} / refreshed: {len(rows)}")
    n = upsert(env, rows)
    print(f"upserted: {n}")
    print("DONE")


if __name__ == "__main__":
    main()
