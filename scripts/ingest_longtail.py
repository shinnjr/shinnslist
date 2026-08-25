#!/usr/bin/env python3
"""Shinnslist — long-tail discovery ingest.

Parses the pipe-delimited program lists that research subagents write into
docs/research/longtail-*.txt and upserts them into grant_opportunities.

Line format (subagents emit this): NAME | FUNDER | URL | ELIGIBILITY | AMOUNT |
DEADLINE_OR_ROLLING | SOURCE_TYPE | [extra fields → joined into notes]

Dedup key = source_url (the table's real unique identity for a program).
"""
import sys, os, re, json, datetime, urllib.request, urllib.parse, hashlib

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ingest_grantsgov import load_env, slugify, supabase_fetch

RESEARCH_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "docs", "research")

# filename keyword -> category
CATEGORY_HINTS = {
    "mom": "community",
    "dad": "community",
    "parent": "community",
    "car": "community",
    "transport": "community",
    "home": "housing",
    "repair": "housing",
    "elder": "seniors",
    "nursing": "seniors",
    "care": "seniors",
    "veteran": "veterans",
    "disab": "disability",
    "student": "education",
    "scholar": "education",
    "health": "health",
    "emergency": "emergency_relief",
    "utility": "housing",
    "food": "community",
    "child": "community",
    "artist": "arts_culture",
    "farm": "agriculture",
}


def norm_url(url: str) -> str:
    u = url.strip().lower()
    if u.startswith("https://www."): u = "https://" + u[len("https://www."):]
    elif u.startswith("http://www."): u = "http://" + u[len("http://www."):]
    return u.rstrip("/")


def parse_line(line: str, hint: str):
    parts = [p.strip() for p in line.split("|")]
    if len(parts) < 6:
        return None
    name, funder, url = parts[0], parts[1], parts[2]
    eligibility = parts[3]
    amount = parts[4]
    deadline = parts[5]
    source_type = parts[6] if len(parts) > 6 else ""
    notes = " ".join(p for p in parts[7:] if p.strip()) if len(parts) > 7 else ""

    if not name or not url or not url.lower().startswith("http"):
        return None

    slug = "longtail-" + slugify(f"{funder} {name}")[:70].rstrip("-") + "-" + hashlib.md5(url.encode()).hexdigest()[:6]

    # deadline/rolling detection
    dlow = deadline.lower()
    rolling = any(k in dlow for k in ("rolling", "ongoing", "varies", "continuous", "open", "none", "n/a", "as funds", "first come", "deadline"))
    parsed_deadline = None
    deadline_label = deadline or "Rolling"
    status = "rolling"
    if not rolling:
        m = re.search(r"(20\d{2}-\d{2}-\d{2}|\d{1,2}/\d{1,2}/20\d{2})", deadline)
        if m:
            status = "open"
            deadline_label = deadline
            try:
                for fmt in ("%Y-%m-%d", "%m/%d/%Y"):
                    try:
                        parsed_deadline = datetime.datetime.strptime(m.group(1), fmt).isoformat()
                        break
                    except ValueError:
                        continue
            except Exception:
                parsed_deadline = None

    category = hint
    for kw, cat in CATEGORY_HINTS.items():
        if kw in (name + " " + funder + " " + notes).lower():
            category = cat

    gtype = "grant"
    for kw, gt in (("scholarship", "scholarship"), ("loan", "loan"), ("voucher", "voucher"),
                   ("donated", "assistance"), ("repair", "assistance"), ("reimburse", "reimbursement")):
        if kw in (amount + " " + notes + " " + name).lower():
            gtype = gt

    rec = {
        "slug": slug,
        "name": name,
        "funder": funder,
        "amount_label": amount,
        "deadline": parsed_deadline,
        "deadline_label": deadline_label,
        "cycle_key": str(datetime.datetime.utcnow().year),
        "status": status,
        "category": category,
        "summary": notes or eligibility,
        "eligibility_text": eligibility,
        "eligibility_rules": {
            "source_type": "longtail",
            "longtail_source": source_type or "unknown",
            "entity_types": ["individual"],
            "individual_eligible": True,
            "grant_type": gtype,
            "demographic": hint,
        },
        "effort": "light",
        "fee_cents": 0,
        "source_url": url,
        "application_url": url,
        "source_kind": "longtail",
        "verified_at": datetime.datetime.utcnow().isoformat(),
    }
    return rec


def upsert_longtail(env, rows):
    """POST with on_conflict=source_url (URL is the program's identity).

    Preserves two things merge-duplicates would otherwise clobber:
      1. status='closed' — manual soft-hides (junk/duplicate rows) stay hidden.
      2. eligibility_rules enrichment (states, geography, service_focus, etc.)
         — enrich-data runs write these; the longtail rec only knows source_type.
    """
    if not rows:
        return 0
    existing = {}
    try:
        offset = 0
        while True:
            with supabase_fetch(env, f"grant_opportunities?select=source_url,status,eligibility_rules&limit=1000&offset={offset}") as resp:
                got = json.loads(resp.read())
            if not isinstance(got, list) or not got:
                break
            for row in got:
                existing[norm_url(row.get("source_url") or "")] = {
                    "status": row.get("status"),
                    "rules": row.get("eligibility_rules") if isinstance(row.get("eligibility_rules"), dict) else None,
                }
            offset += len(got)
            if len(got) < 1000:
                break
    except Exception as e:
        print(f"warn: existing lookup failed ({e}); proceeding without preserve")
    for r in rows:
        ex = existing.get(norm_url(r["source_url"]))
        if not ex:
            continue
        if ex.get("status") == "closed":
            r["status"] = "closed"
        # Merge enriched fields into the fresh longtail rules (fresh keys win, but
        # any key the rec doesn't set — states, geography, service_focus, fee_cents —
        # survives, so enrichment is never wiped by a re-ingest).
        if isinstance(ex.get("rules"), dict):
            fresh = r.get("eligibility_rules") if isinstance(r.get("eligibility_rules"), dict) else {}
            r["eligibility_rules"] = {**ex["rules"], **fresh}
    supabase_fetch(
        env,
        "grant_opportunities?on_conflict=source_url",
        method="POST",
        body=rows,
        headers_extra={"Content-Type": "application/json", "Prefer": "resolution=merge-duplicates,return=minimal"},
    )
    return len(rows)


def main():
    env = load_env()
    if not os.path.isdir(RESEARCH_DIR):
        print(f"no research dir: {RESEARCH_DIR}")
        return
    files = sorted(f for f in os.listdir(RESEARCH_DIR) if f.startswith("longtail-") and f.endswith(".txt"))
    if not files:
        print("no longtail files yet")
        return

    rows, seen_urls = [], set()
    for f in files:
        # hint from filename
        hint = "community"
        for kw, cat in CATEGORY_HINTS.items():
            if kw in f.lower():
                hint = cat
        path = os.path.join(RESEARCH_DIR, f)
        with open(path) as fh:
            for line in fh:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                rec = parse_line(line, hint)
                if not rec:
                    continue
                if norm_url(rec["source_url"]) in seen_urls:
                    continue
                seen_urls.add(norm_url(rec["source_url"]))
                rows.append(rec)

    print(f"parsed {len(rows)} programs from {len(files)} files")
    n = upsert_longtail(env, rows)
    print(f"upserted: {n}")
    print("DONE")


if __name__ == "__main__":
    main()
