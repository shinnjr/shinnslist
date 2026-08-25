#!/usr/bin/env python3
"""
FBM Value Alert Engine — Facebook Marketplace Free/Cheap Item Monitor
===================================================================
Monitors Facebook Marketplace free-listing pages for the Denver area,
dedupes, scores, and produces a notification payload.

FB blocks scraping aggressively. This script uses the lightweight
mbasic.facebook.com interface as the primary entry point.

USAGE:
  python3 fbm_alert_engine.py [--area denver] [--max-price 0] [--output json|csv]

AREA OPTIONS:
  denver, boulder, fort-collins, colorado-springs

PREREQUISITES:
  pip install httpx beautifulsoup4

KNOWN LIMITATIONS:
  - FB rate-limits mbasic access; use with delays
  - Logged-in session cookie dramatically improves results
  - Without a session, results are limited to public postings
  - FB may block residential IPs; VPN/proxy may help
"""

import argparse
import asyncio
import hashlib
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from urllib.parse import urlencode

try:
    import httpx
except ImportError:
    print("ERROR: httpx not installed. Run: pip install httpx beautifulsoup4")
    sys.exit(1)

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("ERROR: beautifulsoup4 not installed. Run: pip install beautifulsoup4")
    sys.exit(1)


# ─── CONFIG ────────────────────────────────────────────────────────
DENVER_MARKETPLACE_URL = "https://mbasic.facebook.com/marketplace/denver/"
FREE_ITEMS_URL = "https://mbasic.facebook.com/marketplace/denver/search/?minPrice=0&maxPrice=0&exact=false"
BASE_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# Scoring thresholds
HIGH_VALUE_KEYWORDS = [
    "iphone", "macbook", "macbook pro", "dyson", "peloton", "yeti",
    "patagonia", "north face", "apple", "samsung", "lego", "nintendo",
    "playstation", "xbox", "couch", "sofa", "sectional", "dresser",
    "table", "desk", "chair", "mattress", "bed frame", "bookshelf",
    "stroller", "crib", "carseat", "bassinet", "high chair",
    "bike", "bicycle", "kayak", "snowboard", "skis", "tent",
    "mower", "snowblower", "generator", "compressor", "tool",
    "tv", "television", "monitor", "speaker", "camera", "lens",
    "tire", "wheel", "rim", "car part", "truck", "trailer",
]

CONDITION_BOOST_WORDS = [
    "new", "never used", "brand new", "sealed", "excellent",
    "like new", "barely used", "open box", "still in box",
]

CONDITION_PENALTY_WORDS = [
    "broken", "damaged", "cracked", "stained", "ripped", "torn",
    "missing", "parts only", "for parts", "as is broken",
    "needs repair", "needs work", "not working",
]


# ─── DATA MODELS ────────────────────────────────────────────────────
class Listing:
    def __init__(self, title, price, location, url, description, image_url, posted_time):
        self.title = title
        self.price = price
        self.location = location
        self.url = url
        self.description = description
        self.image_url = image_url
        self.posted_time = posted_time
        self.score = 0
        self.digest = hashlib.md5((title + url).encode()).hexdigest()[:12]

    def score_item(self):
        """Score the item for value/priority (0-100)"""
        combined = (self.title + " " + self.description).lower()
        score = 0

        # Free items start high
        if self.price is not None and self.price == 0:
            score += 40

        # Keyword matching
        matches = 0
        for kw in HIGH_VALUE_KEYWORDS:
            if kw in combined:
                matches += 1
                score += 3
        if matches >= 3:
            score += 10  # bonus for multi-match

        # Condition scoring
        for word in CONDITION_BOOST_WORDS:
            if word in combined:
                score += 5
                break
        for word in CONDITION_PENALTY_WORDS:
            if word in combined:
                score -= 20
                break

        # Length of description (more = more info = potentially higher quality)
        if len(self.description) > 100:
            score += 5
        if len(self.description) > 300:
            score += 3

        # Cap
        self.score = min(max(score, 0), 100)
        return self.score

    def to_dict(self):
        return {
            "digest": self.digest,
            "title": self.title,
            "price": self.price,
            "location": self.location,
            "url": self.url,
            "description": self.description[:500],
            "image_url": self.image_url,
            "posted_time": self.posted_time,
            "score": self.score,
            "scored_at": datetime.now(timezone.utc).isoformat(),
        }


# ─── SCRAPER ENGINE ─────────────────────────────────────────────────
class FBMScraper:
    def __init__(self, area="denver", cookie_string=None, delay=2.0):
        self.area = area
        self.cookie_string = cookie_string
        self.delay = delay
        self.client = httpx.Client(
            headers=BASE_HEADERS,
            timeout=30,
            follow_redirects=True,
        )
        if cookie_string:
            # Parse cookie string into dict for httpx
            self.client.cookies.update(
                dict(pair.split("=", 1) for pair in cookie_string.split("; ") if "=" in pair)
            )

    def _build_url(self, max_price=0):
        if self.area == "denver":
            base = "https://mbasic.facebook.com/marketplace/denver/"
        elif self.area == "boulder":
            base = "https://mbasic.facebook.com/marketplace/boulder/"
        elif self.area == "fort-collins":
            base = "https://mbasic.facebook.com/marketplace/fortcollins/"
        elif self.area == "colorado-springs":
            base = "https://mbasic.facebook.com/marketplace/coloradosprings/"
        else:
            base = f"https://mbasic.facebook.com/marketplace/{self.area}/"

        if max_price == 0:
            return base + "search/?minPrice=0&maxPrice=0&exact=false"
        else:
            return base + f"search/?maxPrice={max_price}"

    def scrape(self, max_price=0, max_pages=3):
        """Scrape marketplace listings. Returns list of Listing objects."""
        all_listings = []
        seen_urls = set()
        url = self._build_url(max_price)

        for page in range(max_pages):
            if page > 0:
                time.sleep(self.delay)

            try:
                response = self.client.get(url, headers=BASE_HEADERS)
                if response.status_code != 200:
                    print(f"  [WARN] HTTP {response.status_code} on page {page + 1}")
                    if response.status_code == 302 or "login" in response.text.lower():
                        print("  [BLOCKED] Facebook redirected to login page.")
                        print("  [BLOCKED] Add a session cookie (--cookie) or use a different IP.")
                        break
                    continue

                soup = BeautifulSoup(response.text, "html.parser")
                items = self._parse_listings(soup)

                new_items = 0
                for item in items:
                    if item.url not in seen_urls:
                        seen_urls.add(item.url)
                        item.score_item()
                        all_listings.append(item)
                        new_items += 1

                print(f"  Page {page + 1}: found {len(items)} items, {new_items} new")

                # Look for "Next" link for mbasic pagination
                next_link = soup.find("a", string=lambda t: t and "See More" in t)
                if not next_link:
                    next_link = soup.find("a", href=lambda h: h and "marketplace" in h and "page" in h.lower())
                if next_link and next_link.get("href"):
                    url = next_link["href"]
                    if not url.startswith("http"):
                        url = "https://mbasic.facebook.com" + url
                else:
                    break

            except httpx.RequestError as e:
                print(f"  [ERROR] Request failed on page {page + 1}: {e}")
                break
            except Exception as e:
                print(f"  [ERROR] Parsing failed on page {page + 1}: {e}")
                break

        self.client.close()
        return all_listings

    def _parse_listings(self, soup):
        """Parse mbasic Facebook marketplace HTML into Listing objects."""
        listings = []

        # mbasic marketplace uses simple div structure
        # Each listing is typically in a div or table row with links
        for link in soup.find_all("a", href=True):
            href = link.get("href", "")
            text = link.get_text(strip=True)

            # Skip non-marketplace links
            if "/marketplace/item/" not in href and "/marketplace/denver/item/" not in href:
                continue
            if not text or len(text) < 3:
                continue

            # Clean URL
            url = href
            if url.startswith("/"):
                url = "https://mbasic.facebook.com" + url
            # Strip tracking params
            if "?" in url:
                url = url.split("?")[0]

            # Extract price if present in text
            price = None
            price_text = ""
            # Look for $ in the parent element
            parent = link.parent
            if parent:
                parent_text = parent.get_text()
                if "$" in parent_text:
                    for part in parent_text.split():
                        if part.startswith("$"):
                            try:
                                price_str = part.replace("$", "").replace(",", "")
                                if price_str.lower() == "free":
                                    price = 0
                                else:
                                    price = int(float(price_str))
                            except:
                                pass
                            price_text = part
                            break

            listing = Listing(
                title=text,
                price=price,
                location="Denver, CO",
                url=url,
                description=price_text,
                image_url="",
                posted_time="",
            )
            listings.append(listing)

        return listings


# ─── DEDUP & STORE ──────────────────────────────────────────────────
class ListingStore:
    def __init__(self, cache_dir=None):
        self.cache_dir = Path(cache_dir or os.path.expanduser("~/projects/freebie/data/"))
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.seen_file = self.cache_dir / "seen_digests.json"
        self._load_seen()

    def _load_seen(self):
        if self.seen_file.exists():
            try:
                self.seen = set(json.loads(self.seen_file.read_text()))
            except:
                self.seen = set()
        else:
            self.seen = set()

    def _save_seen(self):
        self.seen_file.write_text(json.dumps(list(self.seen)))

    def dedupe(self, listings):
        """Filter out already-seen listings, return new ones."""
        new = []
        for listing in listings:
            if listing.digest not in self.seen:
                self.seen.add(listing.digest)
                new.append(listing)
        if new:
            self._save_seen()
        return new

    def save_batch(self, listings, filename=None):
        """Save listings to a JSON file."""
        if not listings:
            return None
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        path = self.cache_dir / (filename or f"listings_{ts}.json")
        path.write_text(json.dumps(
            [l.to_dict() for l in listings],
            indent=2,
        ))
        return path


# ─── NOTIFICATION PAYLOAD ───────────────────────────────────────────
def build_notification_payload(listings, min_score=30):
    """Build a notification-ready payload for the freebie app's push system."""
    hits = [l for l in listings if l.score >= min_score]
    hits.sort(key=lambda l: l.score, reverse=True)

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_new_listings": len(listings),
        "high_value_alerts": len(hits),
        "alerts": [l.to_dict() for l in hits[:20]],  # top 20
    }
    return payload


# ─── MAIN ───────────────────────────────────────────────────────────
async def main():
    parser = argparse.ArgumentParser(description="FBM Value Alert Engine")
    parser.add_argument("--area", default="denver", help="Marketplace area")
    parser.add_argument("--max-price", type=int, default=0, help="Max price filter (0 = free only)")
    parser.add_argument("--output", default="json", choices=["json", "csv", "both"])
    parser.add_argument("--min-score", type=int, default=30, help="Minimum alert score")
    parser.add_argument("--cookie", help="FB session cookie string (from browser dev tools)")
    parser.add_argument("--pages", type=int, default=3, help="Max pages to scrape")
    parser.add_argument("--delay", type=float, default=2.0, help="Delay between pages (seconds)")

    args = parser.parse_args()

    print(f"=== FBM Value Alert Engine ===")
    print(f"  Area: {args.area}")
    print(f"  Max price: ${args.max_price} (0 = free only)")
    print(f"  Min alert score: {args.min_score}")
    print(f"  Max pages: {args.pages}")
    print(f"  Cookie: {'yes' if args.cookie else 'no (limited results)'}")
    print()

    scraper = FBMScraper(args.area, cookie_string=args.cookie, delay=args.delay)
    store = ListingStore()

    print("Scraping...")
    listings = scraper.scrape(max_price=args.max_price, max_pages=args.pages)

    print(f"\nTotal raw listings: {len(listings)}")

    # Dedupe
    new_listings = store.dedupe(listings)
    print(f"New (unseen): {len(new_listings)}")

    # Score and filter
    payload = build_notification_payload(new_listings, min_score=args.min_score)
    print(f"High-value alerts (score >= {args.min_score}): {len(payload['alerts'])}")

    # Save
    saved_path = store.save_batch(new_listings)
    if saved_path:
        print(f"\nSaved to: {saved_path}")

    # Output
    if args.output in ("json", "both"):
        output_path = store.cache_dir / "notification_payload.json"
        output_path.write_text(json.dumps(payload, indent=2))
        print(f"Notification payload: {output_path}")

    if args.output in ("csv", "both"):
        csv_path = store.cache_dir / "alerts.csv"
        with open(csv_path, "w") as f:
            f.write("score,title,price,url,description\n")
            for alert in payload["alerts"]:
                f.write(f"{alert['score']},{alert['title']},{alert['price']},{alert['url']},{alert['description'][:200]}\n")
        print(f"CSV export: {csv_path}")

    # Display top alerts
    if payload["alerts"]:
        print(f"\n=== TOP ALERTS ===")
        for i, alert in enumerate(payload["alerts"][:10], 1):
            price_str = f"${alert['price']}" if alert['price'] else "FREE"
            print(f"  {i}. [{alert['score']}] {alert['title']} — {price_str}")
            print(f"     {alert['url']}")
    else:
        print("\n  No high-value alerts found. Try:")
        print("  - Using a Facebook session cookie (--cookie)")
        print("  - Lowering the min score threshold (--min-score 15)")
        print("  - Checking if FB is rate-limiting your IP")

    print(f"\nDone. {len(new_listings)} new listings processed.")


if __name__ == "__main__":
    asyncio.run(main())
