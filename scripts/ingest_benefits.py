#!/usr/bin/env python3
"""Shinnslist — individual & family assistance catalog (curated, primary-source).

Adds the verified federal programs that serve middle/lower-America individuals and
households. Each is tagged with `grant_type` (grant | benefit | loan | cost_share)
so the product can distinguish competitive grants from needs-based entitlements.

Sources: USDA, HHS/ACF, HUD, IRS, SSA, CMS, FEMA, DOE (primary government pages,
URLs liveness-verified 2026-08-15).

Usage:
  python3 ingest_benefits.py             # full run
  python3 ingest_benefits.py --dry-run   # parse only, no writes
"""
import sys
import json
from datetime import date, datetime

from ingest_grantsgov import (
    load_env, fetch_existing_slugs, upsert, slugify,
)

# Each: (name, funder, url, category, amount_label, grant_type, summary)
PROGRAMS = [
    # --- Food & family (single moms/dads, large families) ---
    ("SNAP — Supplemental Nutrition Assistance Program (food stamps)", "USDA Food & Nutrition Service",
     "https://www.fns.usda.gov/snap/supplemental-nutrition-assistance-program", "community",
     "up to ~$700/mo per household", "benefit", "Monthly food-purchase assistance for low-income individuals and families. Amount scales with household size. Income-tested (≤130% FPL)."),
    ("WIC — Women, Infants & Children", "USDA Food & Nutrition Service",
     "https://www.fns.usda.gov/wic", "community",
     "food + nutrition (~$40–$100/mo)", "benefit", "Nutrition assistance for pregnant/postpartum women and children under 5. Income-tested (≤185% FPL)."),
    ("TANF — Temporary Assistance for Needy Families", "HHS / ACF (state-administered)",
     "https://www.acf.hhs.gov/ofa/programs/tanf", "community",
     "cash ~$200–$800/mo (state-set)", "benefit", "Cash assistance for custodial parents (moms or dads) with children under 18. Income/asset tested, work requirements. State-administered."),
    ("Child Care Subsidy (CCDF)", "HHS / ACF",
     "https://www.acf.hhs.gov/occ", "community",
     "pays share of child care cost", "benefit", "Helps low-income working parents pay for child care. Single parents prioritized. State-administered."),
    ("Head Start / Early Head Start", "HHS / ACF",
     "https://www.acf.hhs.gov/ohs", "community",
     "free preschool / child care", "benefit", "Free early-childhood education and care for children 0–5 in low-income families (≤100% FPL)."),
    ("Earned Income Tax Credit (EITC)", "IRS",
     "https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit", "community",
     "up to ~$7,830/yr (3+ kids)", "benefit", "Refundable tax credit for low-to-moderate-income working families. Higher for more children. Filed with taxes."),
    ("Child Tax Credit", "IRS",
     "https://www.irs.gov/credits-deductions/individuals/child-tax-credit", "community",
     "up to ~$2,000/child", "benefit", "Per-child tax credit for families. Partially refundable."),

    # --- Housing, home repair, utilities ---
    ("USDA Section 504 Home Repair Program", "USDA Rural Development",
     "https://www.rd.usda.gov/programs-services/single-family-housing-programs/section-504-home-repair-program", "housing",
     "grant up to $7,500 (62+); loan up to $40,000 @1%", "grant",
     "Very-low-income rural homeowners: a repair GRANT up to $7,500 if age 62+, or a 1%-interest loan up to $40,000 otherwise. Removes health/safety hazards."),
    ("Weatherization Assistance Program (WAP)", "DOE (state-administered)",
     "https://www.energy.gov/eere/wap/weatherization-assistance-program", "housing",
     "free upgrades (avg $4,500–$8,000)", "benefit",
     "Free energy-efficiency upgrades (insulation, sealing, heating) for low-income households. Priority to elderly, disabled, families with children."),
    ("LIHEAP — Low Income Home Energy Assistance", "HHS / ACF (state-administered)",
     "https://www.acf.hhs.gov/ocs/programs/liheap/about", "housing",
     "$100–$1,000+ toward heating/cooling", "benefit",
     "Helps pay heating/cooling bills and weatherization. Income-tested (≤150% FPL, varies by state)."),
    ("LIHWAP — Low Income Household Water Assistance", "HHS / ACF",
     "https://www.acf.hhs.gov/ocs/programs/lihwap", "housing",
     "water bill arrears", "benefit",
     "Helps low-income households pay water/wastewater bills."),
    ("Section 8 / Housing Choice Voucher", "HUD (local housing authorities)",
     "https://www.hud.gov/topics/housing_choice_voucher_program_section_8", "housing",
     "subsidizes rent", "benefit",
     "Rent subsidy for very-low-income families, elderly, disabled (≤50% area median income). Waiting lists often long."),
    ("Down Payment Assistance (state HFA programs)", "State Housing Finance Agencies",
     "https://www.hud.gov/topics/homeownership", "housing",
     "$3,000–$20,000 forgivable", "grant",
     "Forgivable grants/loans toward down payment + closing costs for first-time homebuyers. State-by-state. The most grant-like individual housing aid."),

    # --- Health, disability, elder care ---
    ("Medicaid", "CMS (state-administered)",
     "https://www.medicaid.gov/", "health",
     "full medical coverage", "benefit",
     "Free/low-cost health coverage for low-income individuals and families. Income-tested, state-administered."),
    ("Medicare", "CMS",
     "https://www.medicare.gov/basics", "health",
     "health coverage", "benefit",
     "Federal health insurance for 65+ or disabled (24+ months SSDI). Enrollment windows apply."),
    ("SSI — Supplemental Security Income", "Social Security Administration",
     "https://www.ssa.gov/benefits/ssi/", "disability",
     "up to $967/mo individual (2025)", "benefit",
     "Monthly cash for low-income people who are 65+, blind, or disabled."),
    ("SSDI — Social Security Disability Insurance", "Social Security Administration",
     "https://www.ssa.gov/benefits/disability/", "disability",
     "avg ~$1,537/mo", "benefit",
     "Monthly cash for workers with a qualifying disability. Requires work history."),
    ("Medicare Savings Programs (QMB/SLMB)", "CMS (state-administered)",
     "https://www.shiptacenter.org/", "health",
     "pays Medicare premiums", "benefit",
     "Pays Medicare premiums/coinsurance for low-income beneficiaries."),
    ("National Family Caregiver Support Program (NFCSP)", "HHS / ACL (state-administered)",
     "https://www.acl.gov/programs/support-caregivers/national-family-caregiver-support-program", "seniors",
     "respite + support services", "benefit",
     "Respite, counseling, and support for family caregivers of adults 60+ or adults with disabilities. Via Area Agencies on Aging."),
    ("Medicaid HCBS Waivers (in-home care)", "CMS (state-administered)",
     "https://www.medicaid.gov/medicaid/home-community-based-services/index.html", "seniors",
     "in-home aide hours / services", "benefit",
     "In-home care for elderly/disabled who need nursing-level care. Waiting lists common."),
    ("Veterans Aid & Attendance pension", "VA",
     "https://www.va.gov/pension/aid-attendance-housebound/", "seniors",
     "up to ~$2,100/mo", "benefit",
     "Pension add-on for wartime veterans/spouses needing help with daily living."),
    ("VA Caregiver Support Program", "VA",
     "https://www.caregiver.va.gov/", "seniors",
     "stipend + training + respite", "benefit",
     "Support and monthly stipend for caregivers of eligible post-9/11 veterans."),

    # --- Emergency / transportation ---
    ("FEMA Individual Assistance", "FEMA",
     "https://www.fema.gov/assistance/individual", "emergency_relief",
     "up to ~$42,500 (disaster repair)", "grant",
     "Disaster relief grants for homeowners/renters in presidentially-declared disaster areas. 60-day application window after declaration."),
    ("Emergency Rental Assistance", "HUD / Treasury (state-local)",
     "https://home.treasury.gov/policy-issues/coronavirus/assistance-for-state-local-and-tribal-governments/emergency-rental-assistance-program", "housing",
     "rent/utility arrears", "benefit",
     "Helps renters pay back-rent and utilities to avoid eviction. State/local programs."),
]


def main():
    today = date.today()
    print(f"=== Individual & family assistance catalog — {today.isoformat()} ===")
    rows = []
    for name, funder, url, category, amount, gtype, summary in PROGRAMS:
        rows.append({
            "slug": "assist-" + slugify(name),
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
            "category": category,
            "summary": summary,
            "eligibility_text": "",
            "eligibility_rules": {
                "source_type": "federal_benefit",
                "grant_type": gtype,
                "categories": [category],
                "service_focus": ["low_income"],
                "geography": "all_us",
                "entity_types": ["individual"],
                "individual_eligible": True,
                "means_tested": gtype == "benefit",
            },
            "effort": "light",
            "fee_cents": 0,
            "source_url": url,
            "application_url": url,
            "verified_at": datetime.utcnow().isoformat() + "Z",
        })
    print(f"programs: {len(rows)}")

    if "--dry-run" in sys.argv:
        print("[dry-run] sample:")
        print(json.dumps(rows[0], indent=2))
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
