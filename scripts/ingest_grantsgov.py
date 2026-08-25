#!/usr/bin/env python3
"""Shinnslist grant engine — Grants.gov extract connector (primary source, no API key).

Downloads the daily GrantsDB XML extract (S3, public), streams-parses the full
database, keeps ACTIVE opportunities (open / upcoming / rolling), normalizes them
into the canonical grant_opportunities schema, dedupes, and upserts to Supabase.

Usage:
  python3 ingest_grantsgov.py             # full run (download + parse + upsert)
  python3 ingest_grantsgov.py --dry-run   # parse only, print counts, no writes
  python3 ingest_grantsgov.py --file PATH # parse a local zip/xml instead of downloading
"""
import os
import re
import sys
import json
import shutil
import zipfile
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import date, datetime

S3_BUCKET = "https://prod-grants-gov-chatbot.s3.amazonaws.com"
EXTRACT_PREFIX = "extracts/"
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_FILE = os.path.join(REPO_ROOT, ".env.local")

# ---- taxonomy (Python port of workers/grant-engine/src/taxonomy.ts) ----
CATEGORY_KEYWORDS = [
    ("small_business", ["small business", "entrepreneur", "startup", "for-profit", "business owner"]),
    ("nonprofit", ["nonprofit", "501(c)(3)", "charity", "ngo", "not-for-profit"]),
    ("education", ["education", "school", "scholarship", "students", "literacy", "stem education", "teacher"]),
    ("vocational_training", ["vocational", "trade school", "apprenticeship", "job training", "workforce training", "career"]),
    ("sports_athletics", ["sports", "athletic", "athletes", "recreation", "physical activity", "youth sports"]),
    ("arts_culture", ["arts", "artist", "culture", "music", "theater", "dance", "museum", "creative"]),
    ("science_research", ["science", "research", "scientific", "innovation", "laboratory", "stem research"]),
    ("housing", ["housing", "homeless", "affordable housing", "home repair", "shelter", "construction", "building"]),
    ("religious_faith", ["faith", "religious", "church", "congregation", "ministry", "worship"]),
    ("health", ["health", "medical", "mental health", "wellness", "clinical", "hospital"]),
    ("environment", ["environment", "climate", "conservation", "sustainability", "clean energy"]),
    ("technology", ["technology", "software", "ai", "artificial intelligence", "digital", "tech"]),
    ("agriculture", ["agriculture", "farming", "farm", "rural development", "food systems"]),
    ("workforce", ["workforce", "employment", "jobs", "labor", "upskilling"]),
    ("youth", ["youth", "children", "teen", "kids", "after-school"]),
    ("disability", ["disability", "disabled", "accessibility", "special needs"]),
    ("veterans", ["veteran", "military", "service member"]),
    ("seniors", ["senior", "elderly", "aging", "older adult"]),
    ("emergency_relief", ["emergency", "disaster", "relief", "crisis"]),
    ("international", ["international", "foreign", "global", "developing country", "abroad"]),
]
DEMOGRAPHIC_KEYWORDS = [
    ("women", ["women", "woman", "female", "girls"]),
    ("minority", ["minority", "bipoc", "underrepresented"]),
    ("black", ["black", "african american", "black-owned"]),
    ("latino", ["latino", "latina", "hispanic", "latinx"]),
    ("aapi", ["aapi", "asian", "pacific islander"]),
    ("native", ["native american", "indigenous", "tribal"]),
    ("immigrant", ["immigrant", "refugee", "new american", "first-generation"]),
    ("veteran", ["veteran", "military", "service member"]),
    ("disability", ["disability", "disabled"]),
    ("lgbtq", ["lgbtq", "lgbt", "queer", "transgender"]),
    ("rural", ["rural", "remote community"]),
    ("youth", ["youth", "children", "teen"]),
    ("faith", ["faith", "religious", "congregation"]),
    ("low_income", ["low-income", "underserved", "poverty", "economically disadvantaged"]),
]
APP_CODE_MAP = {
    "00": ["government"], "01": ["government"], "02": ["government"],
    "04": ["government"], "05": ["government"], "06": ["education"],
    "07": ["native"], "08": ["government"], "11": ["native"],
    "12": ["nonprofit"], "13": ["nonprofit"], "20": ["education"],
    "21": ["individual"], "22": ["for_profit"], "23": ["small_business"],
    "25": ["other"], "99": ["all"],
}


def local(tag: str) -> str:
    return tag.split("}")[-1]


def slugify(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:90]


def infer_category(text: str) -> str:
    t = text.lower()
    for cat, kws in CATEGORY_KEYWORDS:
        if any(k in t for k in kws):
            return cat
    return "community"


def infer_demos(text: str) -> list:
    t = text.lower()
    return [d for d, kws in DEMOGRAPHIC_KEYWORDS if any(k in t for k in kws)]


def parse_mmddyyyy(s: str):
    s = (s or "").strip()
    if not s or len(s) != 8:
        return None
    try:
        return datetime.strptime(s, "%m%d%Y").date()
    except ValueError:
        return None


def format_amount(floor, ceil):
    def f(n):
        return f"${int(n):,}"
    if floor and ceil and floor != ceil:
        return f"{f(floor)}–{f(ceil)}"
    if ceil:
        return f"up to {f(ceil)}"
    if floor:
        return f"from {f(floor)}"
    return ""


def parse_opportunities(xml_path):
    """Stream-parse the GrantsDB XML, yielding dicts of raw opportunity fields."""
    total = 0
    for _event, elem in ET.iterparse(xml_path, events=("end",)):
        if local(elem.tag) != "OpportunitySynopsisDetail_1_0":
            continue
        opp = {}
        cats = []
        for c in elem:
            name = local(c.tag)
            txt = (c.text or "").strip()
            if name == "CategoryOfFundingActivity":
                if txt:
                    cats.append(txt)
            else:
                opp[name] = txt
        opp["_categories"] = cats
        total += 1
        yield opp
        elem.clear()
    return


def normalize(opp, today: date):
    title = opp.get("OpportunityTitle", "").strip()
    number = opp.get("OpportunityNumber", "").strip()
    agency = opp.get("AgencyName", "").strip()
    if not title and not number:
        return None, "no-title"

    close = parse_mmddyyyy(opp.get("CloseDate"))
    post = parse_mmddyyyy(opp.get("PostDate"))
    archive = parse_mmddyyyy(opp.get("ArchiveDate"))

    if close and close < today:
        return None, "closed"
    if post and post > today:
        status = "upcoming"
    elif close:
        status = "open"
    elif archive and archive < today:
        return None, "archived"
    else:
        status = "rolling"

    body = " ".join([
        title,
        opp.get("CategoryExplanation", ""),
        opp.get("Description", ""),
        opp.get("AdditionalInformationOnEligibility", ""),
    ])
    category = infer_category(body)
    demos = infer_demos(body)
    ceiling = opp.get("AwardCeiling")
    floor = opp.get("AwardFloor")
    try:
        ceiling = float(ceiling) if ceiling not in (None, "", "0") else None
    except ValueError:
        ceiling = None
    try:
        floor = float(floor) if floor not in (None, "", "0") else None
    except ValueError:
        floor = None

    app_codes = [c.strip() for c in re.split(r"[,\s]+", opp.get("EligibleApplicants", "") or "") if c.strip()]
    entity_types = []
    for code in app_codes:
        entity_types.extend(APP_CODE_MAP.get(code, []))
    individual_eligible = any(c in ("21", "99") for c in app_codes)
    if individual_eligible and "individual" not in entity_types:
        entity_types.append("individual")

    source_url = f"https://www.grants.gov/search-grants?keyword={urllib.parse.quote(number)}"

    return {
        "slug": "federal-" + (slugify(number) or slugify(title) or f"id{opp.get('OpportunityID')}"),
        "name": title or number,
        "funder": agency or "U.S. Federal Government",
        "amount_label": format_amount(floor, ceiling),
        "amount_min_cents": int(floor * 100) if floor else None,
        "amount_max_cents": int(ceiling * 100) if ceiling else None,
        "source_kind": "official",
        "deadline": close.isoformat() if close else None,
        "deadline_label": close.strftime("%b %d, %Y") if close else "Rolling",
        "cycle_key": str(today.year),
        "status": status,
        "category": category,
        "summary": (opp.get("Description", "") or "")[:500],
        "eligibility_text": (opp.get("AdditionalInformationOnEligibility", "") or "")[:1000],
        "eligibility_rules": {
            "source_type": "federal_gov",
            "categories": [category],
            "service_focus": demos,
            "geography": "all_us",
            "entity_types": entity_types,
            "individual_eligible": individual_eligible,
            "eligible_applicants_codes": app_codes,
            "opportunity_number": number,
            "cfda": [c.strip() for c in opp.get("CFDANumbers", "").split(",") if c.strip()],
            "agency_code": opp.get("AgencyCode", ""),
            "funding_instrument": opp.get("FundingInstrumentType", ""),
            "funding_activity_codes": opp.get("_categories", []),
        },
        "effort": "moderate",
        "fee_cents": 0,
        "source_url": source_url,
        "application_url": source_url,
        "verified_at": datetime.utcnow().isoformat() + "Z",
    }, ""


# ---- Supabase ----
def load_env():
    env = {}
    with open(ENV_FILE) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    if "SUPABASE_URL" not in env and "NEXT_PUBLIC_SUPABASE_URL" in env:
        env["SUPABASE_URL"] = env["NEXT_PUBLIC_SUPABASE_URL"]
    return env


def supabase_fetch(env, path, method="GET", body=None, headers_extra=None):
    headers = {
        "apikey": env["SUPABASE_SERVICE_ROLE_KEY"],
        "Authorization": f"Bearer {env['SUPABASE_SERVICE_ROLE_KEY']}",
    }
    if headers_extra:
        headers.update(headers_extra)
    req = urllib.request.Request(
        f"{env['SUPABASE_URL']}/rest/v1/{path}",
        method=method,
        headers=headers,
        data=json.dumps(body).encode() if body is not None else None,
    )
    return urllib.request.urlopen(req, timeout=60)


def fetch_existing_slugs(env):
    try:
        slugs = set()
        offset = 0
        while True:
            with supabase_fetch(env, f"grant_opportunities?select=slug&order=slug&offset={offset}&limit=1000") as r:
                rows = json.loads(r.read())
            if not rows:
                break
            slugs.update(row["slug"] for row in rows)
            offset += len(rows)
            if len(rows) < 1000:
                break
        return slugs
    except Exception as e:
        print(f"  ! warning: could not fetch existing slugs ({e}); assuming none")
        return set()


def upsert(env, grants, chunk=500):
    upserted = 0
    for i in range(0, len(grants), chunk):
        batch = grants[i:i + chunk]
        supabase_fetch(
            env,
            "grant_opportunities?on_conflict=slug",
            method="POST",
            body=batch,
            headers_extra={"Content-Type": "application/json", "Prefer": "resolution=merge-duplicates,return=minimal"},
        )
        upserted += len(batch)
    return upserted


def list_latest_extract():
    url = f"{S3_BUCKET}/?list-type=2&prefix={EXTRACT_PREFIX}&max-keys=1000"
    with urllib.request.urlopen(url, timeout=30) as r:
        data = r.read().decode()
    keys = re.findall(r"<Key>(extracts/GrantsDBExtract\d+v2\.zip)</Key>", data)
    if not keys:
        raise RuntimeError("no extract files found in S3 listing")
    keys = sorted(set(keys))
    latest = keys[-1]
    return f"{S3_BUCKET}/{latest}", latest.split("/")[-1]


def main():
    dry_run = "--dry-run" in sys.argv
    file_arg = None
    if "--file" in sys.argv:
        file_arg = sys.argv[sys.argv.index("--file") + 1]

    today = date.today()
    print(f"=== Grants.gov extract ingest — {today.isoformat()} ===")

    if file_arg:
        zpath = file_arg
    else:
        url, fname = list_latest_extract()
        print(f"latest extract: {fname}")
        zpath = "/tmp/grantsdb_extract.zip"
        print("downloading…")
        urllib.request.urlretrieve(url, zpath)

    if zpath.endswith(".zip"):
        xml_path = "/tmp/grantsdb_extract.xml"
        print("unzipping…")
        with zipfile.ZipFile(zpath) as zf:
            name = zf.namelist()[0]
            with zf.open(name) as src, open(xml_path, "wb") as dst:
                shutil.copyfileobj(src, dst)
    else:
        xml_path = zpath

    print("parsing XML (streaming)…")
    total = 0
    active = []
    skipped = {"closed": 0, "no-title": 0}
    for opp in parse_opportunities(xml_path):
        total += 1
        rec, why = normalize(opp, today)
        if rec is None:
            skipped[why] = skipped.get(why, 0) + 1
            continue
        active.append(rec)

    from collections import Counter
    statuses = Counter(g["status"] for g in active)
    cats = Counter(g["category"] for g in active)
    print(f"total opportunities in extract: {total}")
    print(f"ACTIVE (open/upcoming/rolling): {len(active)}  {dict(statuses)}")
    print(f"skipped: {skipped}")
    print(f"top categories: {cats.most_common(12)}")

    if dry_run:
        print("[dry-run] no writes. sample:")
        for g in active[:2]:
            print(json.dumps(g, indent=2)[:600])
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
