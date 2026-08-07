#!/usr/bin/env python3
"""
Scrapes Craigslist free stuff (4 CO cities) and inserts into Supabase.
Run continuously or once.
"""
import json, os, sys, time, hashlib, re
from datetime import datetime, timezone
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

SUPABASE_URL = "https://nmisxwzrbsyqihqwnvsx.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
ANON_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")

CITIES = {
    "denver": "denver.craigslist.org",
    "boulder": "boulder.craigslist.org",
    "cosprings": "cosprings.craigslist.org",
    "fortcollins": "fortcollins.craigslist.org",
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml",
}

def scrape_city(city: str, domain: str) -> list[dict]:
    """Scrape free stuff from a city's Craigslist."""
    listings = []
    url = f"https://{domain}/search/zip#search=1~list~0~0"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        for item in soup.select("li.cl-static-search-result"):
            title_el = item.select_one("div.title")
            location_el = item.select_one("div.location")
            link_el = item.select_one("a")
            price_el = item.select_one("span.priceinfo")

            if not title_el:
                continue

            title = title_el.get_text(strip=True)
            location = location_el.get_text(strip=True) if location_el else city.capitalize()
            href = urljoin(url, link_el["href"]) if link_el and link_el.get("href") else ""
            price_text = price_el.get_text(strip=True) if price_el else ""

            price = 0
            if price_text and "$" in price_text:
                try:
                    price = float(re.sub(r"[^0-9.]", "", price_text.split("$")[-1]) or 0)
                except ValueError:
                    price = 0

            source_id = hashlib.sha256(f"craigslist-{href}".encode()).hexdigest()[:16]

            listings.append({
                "source": "craigslist",
                "source_id": source_id,
                "source_url": href,
                "title": title,
                "description": "",
                "photos": [],
                "price": price,
                "category": "free-stuff",
                "condition": "unknown",
                "flags": ["free"] if price == 0 else [],
                "city": location.split(",")[0].strip() if "," in location else location,
                "state": "CO",
                "posted_at": datetime.now(timezone.utc).isoformat(),
            })

    except Exception as e:
        print(f"  ⚠️ Error scraping {city}: {e}", file=sys.stderr)

    return listings


def insert_listings(listings: list[dict]) -> int:
    """Insert listings into Supabase via REST API, return count inserted."""
    inserted = 0
    for listing in listings:
        try:
            # Use raw insert via REST for geography field
            resp = requests.post(
                f"{SUPABASE_URL}/rest/v1/listings",
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal",
                },
                json={
                    "source": listing["source"],
                    "source_id": listing["source_id"],
                    "source_url": listing["source_url"],
                    "title": listing["title"],
                    "description": listing["description"],
                    "photos": listing["photos"],
                    "price": listing["price"],
                    "category": listing["category"],
                    "condition": listing["condition"],
                    "flags": listing["flags"],
                    "city": listing["city"],
                    "state": listing["state"],
                    "posted_at": listing["posted_at"],
                },
                timeout=15,
            )
            if resp.status_code == 201 or resp.status_code == 200:
                inserted += 1
            elif resp.status_code == 409:
                pass  # duplicate, skip silently
        except Exception:
            pass
    return inserted


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "once"

    print(f"🆓 Craigslist → Supabase | mode={mode}")
    total = 0

    while True:
        all_listings = []
        for city, domain in CITIES.items():
            print(f"  📍 {city}...")
            listings = scrape_city(city, domain)
            all_listings.extend(listings)
            print(f"     {len(listings)} found")
            time.sleep(1)  # be polite

        # Deduplicate by source_id
        seen = set()
        unique = []
        for l in all_listings:
            if l["source_id"] not in seen:
                seen.add(l["source_id"])
                unique.append(l)

        print(f"  📊 {len(unique)} unique | Inserting...")
        inserted = insert_listings(unique)
        total += inserted
        print(f"  ✅ Inserted {inserted} new (total this run: {total})")

        if mode == "once":
            break

        print(f"  ⏳ Sleeping 15 minutes...")
        time.sleep(900)


if __name__ == "__main__":
    main()
