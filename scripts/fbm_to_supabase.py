#!/usr/bin/env python3
"""
FBM Pipeline → Supabase Insertion Bridge
Reads denver_free_payloads.json from fbm_scraper.py and inserts into
Supabase listings table via the REST API.

Usage: python3 fbm_to_supabase.py [--dry-run] [--input denver_free_payloads.json]

Requires: SUPABASE_URL and SUPABASE_SERVICE_KEY env vars (or set below)
Status: READY — Supabase keys needed from James

James Shinn — Freebie App — Built by Hermes 2026-08-07
"""

import json
import os
import sys
import argparse
import hashlib
from datetime import datetime, timezone
from typing import Optional

try:
    import requests
except ImportError:
    print("ERROR: requests library required. Run: pip install requests", file=sys.stderr)
    sys.exit(1)

# === CONFIGURATION ===
# James must set these env vars or replace with actual values
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

# Denver coordinates
DENVER_LAT = 39.7392
DENVER_LNG = -104.9903


def generate_source_id(title: str, source: str, location: str) -> str:
    """Generate a unique source ID for deduplication."""
    raw = f"{source}:{title}:{location}".lower().strip()
    return hashlib.md5(raw.encode()).hexdigest()[:12]


def score_deal(title: str, description: str = "", price: float = 0) -> int:
    """Score a deal 0-100 based on value signals."""
    title_lower = title.lower()
    desc_lower = description.lower()
    text = title_lower + " " + desc_lower

    score = 0

    # Value brand signals
    value_brands = [
        'apple', 'iphone', 'macbook', 'ipad', 'dyson', 'lego', 'lego',
        'trek', 'specialized', 'cannondale', 'kitchenaid', 'nintendo',
        'playstation', 'xbox', 'herman miller', 'yeti', 'patagonia',
        'arc\'teryx', 'dji', 'sony', 'bose', 'samsung', 'lg',
        'snap-on', 'milwaukee', 'dewalt', 'makita', 'weber',
        'peloton', 'vitamix', 'all-clad', 'le creuset',
    ]
    for brand in value_brands:
        if brand in text:
            score += 10

    # Condition signals
    if any(w in text for w in ['new', 'sealed', 'never used', 'unopened', 'bnib']):
        score += 15
    elif any(w in text for w in ['excellent', 'like new', 'mint']):
        score += 10
    elif any(w in text for w in ['good', 'gently used', 'barely used']):
        score += 5
    elif any(w in text for w in ['broken', 'parts', 'not working', 'for parts']):
        score -= 10

    # Free is great
    if price == 0:
        score += 20

    # Cap at 100
    return min(100, max(0, score))


def insert_to_supabase(listing: dict, dry_run: bool = False) -> Optional[dict]:
    """Insert a single listing into Supabase."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("  SKIP: Supabase keys not configured", file=sys.stderr)
        return None

    if dry_run:
        print(f"  [DRY RUN] Would insert: {listing['title'][:60]}", file=sys.stderr)
        return {"status": "dry_run"}

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    endpoint = f"{SUPABASE_URL}/rest/v1/listings"

    try:
        resp = requests.post(endpoint, json=listing, headers=headers, timeout=10)
        if resp.status_code == 201 or resp.status_code == 200:
            return {"status": "inserted"}
        elif resp.status_code == 409:
            return {"status": "duplicate"}
        else:
            print(f"  ERROR {resp.status_code}: {resp.text[:200]}", file=sys.stderr)
            return {"status": "error", "code": resp.status_code, "body": resp.text[:200]}
    except requests.RequestException as e:
        print(f"  ERROR: {e}", file=sys.stderr)
        return {"status": "error", "error": str(e)}


def main():
    parser = argparse.ArgumentParser(description="FBM → Supabase Insertion Bridge")
    parser.add_argument("--input", type=str, 
                        default="/Users/jamesshinn/projects/freebie/scripts/denver_free_payloads.json",
                        help="Input JSON file from fbm_scraper.py")
    parser.add_argument("--dry-run", action="store_true", help="Don't actually insert")
    
    args = parser.parse_args()

    # Load payloads
    try:
        with open(args.input) as f:
            payloads = json.load(f)
    except FileNotFoundError:
        print(f"ERROR: Input file not found: {args.input}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"ERROR: Invalid JSON: {e}", file=sys.stderr)
        sys.exit(1)

    if not isinstance(payloads, list):
        payloads = [payloads]

    print(f"Processing {len(payloads)} listings...", file=sys.stderr)

    results = {"inserted": 0, "duplicate": 0, "error": 0, "dry_run": 0}

    for item in payloads:
        title = item.get("title", "Unknown")
        price = float(item.get("price", 0)) if item.get("price") else 0
        location = item.get("location", "Denver, CO")
        source_url = item.get("url", "")

        # Build Supabase-compatible listing
        listing = {
            "source": "facebook_marketplace",
            "source_id": generate_source_id(title, "facebook_marketplace", location),
            "source_url": source_url,
            "title": title,
            "description": item.get("description", ""),
            "photos": item.get("photos", []) if isinstance(item.get("photos"), list) else [],
            "price": price,
            "estimated_value": item.get("estimated_value"),
            "category": "free-stuff",
            "condition": item.get("condition", "unknown"),
            "flags": item.get("flags", []),
            "lat": DENVER_LAT,
            "lng": DENVER_LNG,
            "city": "Denver",
            "state": "CO",
            "posted_at": item.get("posted_at", datetime.now(timezone.utc).isoformat()),
            "deal_score": score_deal(title, item.get("description", ""), price),
            "scraped_at": datetime.now(timezone.utc).isoformat(),
        }

        status = "unknown"
        if args.dry_run:
            status = "dry_run"
            results["dry_run"] += 1
        else:
            result = insert_to_supabase(listing)
            if result:
                status = result.get("status", "unknown")
                if status == "inserted":
                    results["inserted"] += 1
                elif status == "duplicate":
                    results["duplicate"] += 1
                else:
                    results["error"] += 1
            else:
                results["error"] += 1

        print(f"  [{status:10s}] {title[:60]}", file=sys.stderr)

    print(f"\nResults: {results}", file=sys.stderr)

    if results["error"] > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
