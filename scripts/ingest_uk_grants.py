#!/usr/bin/env python3
"""Shinnslist grant engine — UK Find-a-Grant connector (foreign gov, primary source, no key).

Fetches the GOV.UK Find-a-Grant search pages (server-rendered __NEXT_DATA__ JSON),
normalizes active UK government grants, and upserts to Supabase.

Usage:
  python3 ingest_uk_grants.py             # full run
  python3 ingest_uk_grants.py --dry-run   # parse only, print counts, no writes
"""
import re
import sys
import json
import urllib.request
from datetime import date, datetime
from collections import Counter

from ingest_grantsgov import (
    load_env, fetch_existing_slugs, upsert,
    slugify, infer_category, infer_demos,
)

BASE = "https://www.find-government-grants.service.gov.uk"

ENTITY_MAP = {
    "Personal / Individual": ["individual"],
    "Public Sector": ["government"],
    "Non-profit": ["nonprofit"],
    "Private Sector": ["small_business"],
}


def fetch_page(page: int):
    url = f"{BASE}/grants?page={page}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        html = r.read().decode()
    m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.S)
    if not m:
        return []
    d = json.loads(m.group(1))
    return d.get("props", {}).get("pageProps", {}).get("searchResult", [])


def gbp(mn, mx):
    def f(n):
        return f"\u00a3{int(n):,}"
    if mn and mx and mn != mx:
        return f"{f(mn)}\u2013{f(mx)}"
    if mx:
        return f"up to {f(mx)}"
    if mn:
        return f"from {f(mn)}"
    return ""


def normalize(g, today: date):
    name = (g.get("grantName") or "").strip()
    if not name:
        return None
    close = (g.get("grantApplicationCloseDate") or "").strip()
    deadline = close[:10] if close else None
    if deadline:
        try:
            if datetime.strptime(deadline, "%Y-%m-%d").date() < today:
                return None  # closed
        except ValueError:
            deadline = None
    status = "open" if deadline else "rolling"
    body = f"{name} {g.get('grantShortDescription', '')}"
    category = infer_category(body)
    demos = infer_demos(body)
    entity_types = []
    for a in (g.get("grantApplicantType") or []):
        entity_types.extend(ENTITY_MAP.get(a, []))
    label = g.get("label", "")
    url = f"{BASE}/grants/{label}" if label else BASE

    return {
        "slug": "uk-" + (g.get("id") or slugify(name)),
        "name": name,
        "funder": g.get("grantFunder") or "UK Government",
        "amount_label": gbp(g.get("grantMinimumAward"), g.get("grantMaximumAward")),
        "amount_min_cents": None,
        "amount_max_cents": None,
        "source_kind": "official",
        "deadline": deadline,
        "deadline_label": datetime.strptime(deadline, "%Y-%m-%d").strftime("%b %d, %Y") if deadline else "Rolling",
        "cycle_key": str(today.year),
        "status": status,
        "category": category,
        "summary": (g.get("grantShortDescription") or "")[:500],
        "eligibility_text": "",
        "eligibility_rules": {
            "source_type": "foreign_gov",
            "categories": [category],
            "service_focus": demos,
            "geography": "foreign",
            "entity_types": entity_types,
            "countries": ["United Kingdom"],
            "locations": g.get("grantLocation") or [],
            "currency": "GBP",
            "applicant_types": g.get("grantApplicantType") or [],
        },
        "effort": "moderate",
        "fee_cents": 0,
        "source_url": url,
        "application_url": url,
        "verified_at": datetime.utcnow().isoformat() + "Z",
    }


def main():
    today = date.today()
    print(f"=== UK Find-a-Grant ingest \u2014 {today.isoformat()} ===")
    all_grants = []
    seen = set()
    page = 0
    for p in range(1, 30):
        batch = fetch_page(p)
        if not batch:
            break
        page = p
        for g in batch:
            if g.get("id") not in seen:
                seen.add(g["id"])
                all_grants.append(g)
    print(f"fetched {len(all_grants)} grants across {page} pages")

    active = []
    closed = 0
    for g in all_grants:
        rec = normalize(g, today)
        if rec is None:
            closed += 1
            continue
        active.append(rec)
    print(f"ACTIVE: {len(active)}  {dict(Counter(r['status'] for r in active))}  (closed skipped: {closed})")
    print(f"top categories: {Counter(r['category'] for r in active).most_common(8)}")

    if "--dry-run" in sys.argv:
        print("[dry-run] sample:")
        print(json.dumps(active[0], indent=2)[:600])
        return

    env = load_env()
    existing = fetch_existing_slugs(env)
    new_count = sum(1 for r in active if r["slug"] not in existing)
    print(f"new: {new_count} / refreshed: {len(active)}")
    n = upsert(env, active)
    print(f"upserted: {n}")
    print("DONE")


if __name__ == "__main__":
    main()
