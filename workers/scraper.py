#!/usr/bin/env python3
"""
Craigslist free-stuff scraper.
Runs as a BullMQ worker or cron job. Pulls all free listings from target
cities, deduplicates, and inserts into Supabase.

Usage:
  python scraper.py --city denver --radius 50
  python scraper.py --city all          # all configured cities

No proxy needed — Craigslist doesn't block scrapers at moderate rates.
"""

import argparse
import hashlib
import json
import logging
import re
import sys
import time
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from supabase import create_client, Client

# === Config ===
SUPABASE_URL = "http://127.0.0.1:54321"  # local dev; override with env
SUPABASE_SERVICE_KEY = "..."  # set via env

CITIES = {
    "denver": {
        "subdomain": "denver",
        "lat": 39.7392,
        "lng": -104.9903,
        "state": "CO",
    },
    "boulder": {
        "subdomain": "boulder",
        "lat": 40.0150,
        "lng": -105.2705,
        "state": "CO",
    },
    "fortcollins": {
        "subdomain": "fortcollins",
        "lat": 40.5853,
        "lng": -105.0844,
        "state": "CO",
    },
    "cosprings": {
        "subdomain": "cosprings",
        "lat": 38.8339,
        "lng": -104.8214,
        "state": "CO",
    },
}

# Craiglist free section URLs
FREE_SECTIONS = [
    "/search/zip",      # free stuff
    "/search/hsa",      # household (furniture)
    "/search/ele",      # electronics
    "/search/sga",      # sporting goods
    "/search/bab",      # baby+kids
    "/search/ppa",      # photo+video
    "/search/tla",      # tools
    "/search/ata",      # auto parts
    "/search/msa",      # music instruments
    "/search/bka",      # books
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/126.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
}

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("craigslist-scraper")


def get_supabase() -> Client:
    url = SUPABASE_URL
    key = SUPABASE_SERVICE_KEY
    return create_client(url, key)


def extract_listings(html: str, source_id_base: str) -> list[dict]:
    """Parse Craigslist gallery page HTML into listing dicts."""
    soup = BeautifulSoup(html, "html.parser")
    listings = []

    for result in soup.select("li.cl-static-search-result"):
        try:
            title_el = result.select_one("div.title")
            price_el = result.select_one("div.price")
            location_el = result.select_one("div.location")
            link_el = result.select_one("a")

            if not title_el or not link_el:
                continue

            title = title_el.get_text(strip=True)
            url = link_el.get("href", "")
            price_str = price_el.get_text(strip=True) if price_el else "$0"
            location_str = location_el.get_text(strip=True) if location_el else ""

            # Parse price: "$0" or "free" → 0
            price = 0
            price_match = re.search(r"\$?(\d+)", price_str.replace(",", ""))
            if price_match and price_str.lower() not in ("free", "$0", ""):
                price = int(price_match.group(1))

            # Generate unique source_id
            source_id = hashlib.md5(url.encode()).hexdigest()

            listings.append({
                "source": "craigslist",
                "source_id": source_id,
                "source_url": url,
                "title": title,
                "description": "",  # detail pages scraped separately
                "photos": [],
                "price": price,
                "estimated_value": None,
                "category": None,
                "brand": None,
                "model": None,
                "condition": "unknown",
                "flags": ["free"] if price == 0 else [],
                "city": source_id_base.split("-")[0] if "-" in source_id_base else "",
                "state": "CO",
                "posted_at": datetime.now(timezone.utc).isoformat(),
            })
        except Exception as e:
            log.warning(f"Failed to parse listing: {e}")
            continue

    return listings


def scrape_section(subdomain: str, section: str, city_info: dict) -> int:
    """Scrape one section of one city. Returns count of new listings inserted."""
    base_url = f"https://{subdomain}.craigslist.org"
    url = urljoin(base_url, section)

    log.info(f"Scraping {url}")

    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
    except requests.RequestException as e:
        log.error(f"HTTP error scraping {url}: {e}")
        return 0

    listings = extract_listings(resp.text, f"{city_info['subdomain']}-{section}")
    if not listings:
        log.info(f"  No listings found at {url}")
        return 0

    supabase = get_supabase()
    inserted = 0

    for listing in listings:
        try:
            # Insert into listings_raw, ignore duplicates via ON CONFLICT
            result = supabase.table("listings_raw").upsert({
                "source": listing["source"],
                "source_id": listing["source_id"],
                "source_url": listing["source_url"],
                "raw_data": listing,
            }, on_conflict="source,source_id").execute()

            # Also try inserting into clean listings table (will be sparse without AI)
            if listing["price"] == 0:  # only insert free listings
                supabase.table("listings").upsert({
                    "source": listing["source"],
                    "source_id": listing["source_id"],
                    "source_url": listing["source_url"],
                    "title": listing["title"],
                    "description": listing["description"],
                    "photos": listing["photos"],
                    "price": listing["price"],
                    "category": listing["category"],
                    "flags": listing["flags"],
                    "city": listing["city"],
                    "state": listing["state"],
                    "posted_at": listing["posted_at"],
                }, on_conflict="source,source_id").execute()

            inserted += 1
        except Exception as e:
            log.warning(f"  DB insert failed for {listing['title'][:50]}: {e}")
            continue

    log.info(f"  Inserted {inserted} listings from {url}")
    return inserted


def main():
    parser = argparse.ArgumentParser(description="Craigslist scraper")
    parser.add_argument("--city", default="denver", help="City to scrape (or 'all')")
    parser.add_argument("--delay", type=float, default=2.0, help="Delay between requests (seconds)")
    args = parser.parse_args()

    cities_to_scrape = list(CITIES.keys()) if args.city == "all" else [args.city]
    total = 0

    for city_key in cities_to_scrape:
        city = CITIES[city_key]
        for section in FREE_SECTIONS:
            count = scrape_section(city["subdomain"], section, city)
            total += count
            time.sleep(args.delay)  # be polite

    log.info(f"Done. Total inserted: {total}")


if __name__ == "__main__":
    main()
