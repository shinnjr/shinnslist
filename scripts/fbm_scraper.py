#!/usr/bin/env python3
"""
FBM alert engine — Denver FREE listings.

RESEARCH FINDING (verified 2026-08-07):
Facebook Marketplace CANNOT be scraped without authentication.
  - www.facebook.com/marketplace/denver/  -> login wall (verified in real browser)
  - mbasic.facebook.com/marketplace        -> 302 redirect to /login.php, HTTP 400
  - Graph API /search?type=group           -> OAuthException "unknown error" (no token)
  - Public FB group pages                  -> HTTP 400 "Error"
  - FB oEmbed plugin                       -> HTTP 400 "Error"

Because the feed is blocked, this scraper is built around a clean adapter
interface so the full search->dedupe->score->JSON pipeline runs end-to-end and
is fully testable. Feed sources:
  * FBMAdapter   -> attempts live FB Marketplace. Detects the auth wall and
                    raises BlockedError with exact evidence. If you supply a
                    page saved AFTER logging in (--file), it parses real HTML.
  * OfflineSource -> runs the engine against bundled sample Denver listings so
                    the pipeline can be exercised and demoed without FB.

Usage:
  python fbm_scraper.py --offline                 # demo on sample data (works)
  python fbm_scraper.py --offline --score-file out.json
  python fbm_scraper.py --file logged_in_page.html   # parse saved authed FB html
  python fbm_scraper.py --url                       # attempt live FB (shows block)
  python fbm_scraper.py --city denver --offline     # filter by city alias
"""

import argparse
import hashlib
import json
import logging
import os
import re
import sys
import time
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Iterable, Optional
from urllib.parse import urljoin

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError as e:  # pragma: no cover
    sys.exit(f"Missing dependency: {e}. Run: python3 -m pip install requests beautifulsoup4")

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger("fbm")

# ---------------------------------------------------------------------------
# Domain types
# ---------------------------------------------------------------------------

@dataclass
class Listing:
    """A single marketplace listing."""
    title: str
    price: str
    price_cents: int = 0
    location: str = ""
    url: str = ""
    image_url: str = ""
    posted_minutes_ago: Optional[int] = None
    posted_ts: Optional[str] = None      # iso8601 if known
    raw: dict = field(default_factory=dict)

    @property
    def key(self) -> str:
        """Dedupe key = normalized title + location."""
        t = re.sub(r"[^a-z0-9]+", " ", self.title.lower()).strip()
        loc = re.sub(r"[^a-z0-9]+", " ", self.location.lower()).strip()
        return f"{t}||{loc}"

    def to_json(self, score: Optional[dict] = None) -> dict:
        d = {
            "title": self.title,
            "price": self.price,
            "price_cents": self.price_cents,
            "location": self.location,
            "url": self.url,
            "image_url": self.image_url,
            "posted_minutes_ago": self.posted_minutes_ago,
            "dedupe_key": self.key,
            "hash": hashlib.sha1(self.key.encode()).hexdigest()[:12],
        }
        if self.posted_ts:
            d["posted_ts"] = self.posted_ts
        if score:
            d["score"] = score
        return d


class BlockedError(Exception):
    """Raised when the feed cannot be accessed (e.g. auth wall)."""


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------

# Brand / category tokens that imply meaningful resale value on a FREE listing.
VALUE_TOKENS = [
    "apple", "iphone", "ipad", "macbook", "imac", "airpods", "samsung",
    "sony", "canon", "nikon", "go pro", "gopro", "nintendo", "switch", "ps5",
    "playstation", "xbox", "lego", "legos", "dyson", "bosch", "dewalt",
    "milwaukee", "makita", "kohler", "peloton", "treadmill", "elliptical",
    "telescope", "guitar", "violin", "yamaha", "espresso", "peloton",
    "kitchenaid", "vitamix", "le creuset", "cast iron", "smart tv", "oled",
    "mountain bike", "road bike", "trek", "specialized", "tent", "canoe",
    "kayak", "drone", "dji", "rolex", "swiss", "gold", "silver", "coin",
    "stamp", "vinyl", "turntable", "camera", "lens", "pro", "gaming",
    "computer", "monitor", "4k", "diamond", "designer", "nordic", "mid century",
]

# These tokens signal the item is the OPPOSITE of free-and-valuable.
JUNK_TOKENS = [
    "broken", "for parts", "parts only", "scrap", "junk", "rust", "rusted",
    "free firewood", "wood pile", "old paint", "empties", "water damage",
    "does not work", "not working", "dead", "cracked", "chipped", "worn",
    "very used", "heavily used", "as is", "project", "mattress" if False else "?",
]
JUNK_TOKENS = [t for t in JUNK_TOKENS if t != "?"]

# Condition tokens that raise / lower the deal score.
CONDITION_BOOST = ["new", "open box", "like new", "excellent", "mint", "sealed",
                   "unused", "brand new", "gently used", "barely used", "nwt",
                   "retired", "collector", "vintage", "antique", "rare", "original box"]
CONDITION_PENALTY = ["broken", "for parts", "needs repair", "needs work", "not working",
                     "does not work", "scratched", "stained", "stains", "as-is", "as is",
                     "heavily used", "well used", "damaged"]

def _norm(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", text.lower())

def score_listing(listing: Listing, now_ts: Optional[int] = None) -> dict:
    """Score a free listing: value + condition + recency -> overall 0-100."""
    text = _norm(f"{listing.title} {listing.location}")

    # 1. Value signal: free ($0) + high-value brand/category tokens.
    value_hits = [t for t in VALUE_TOKENS if t in text]
    junk_hits = [t for t in JUNK_TOKENS if t in text]
    is_free = listing.price_cents == 0
    value_score = 50 if is_free else max(0, 50 - 8)  # free is the core premise
    value_score += min(40, len(value_hits) * 5)
    value_score -= min(50, len(junk_hits) * 15)
    value_score = max(0, min(100, value_score))

    # 2. Condition signal.
    cond_boost = sum(1 for t in CONDITION_BOOST if t in text)
    cond_penalty = sum(1 for t in CONDITION_PENALTY if t in text)
    condition_score = 60
    condition_score += cond_boost * 12
    condition_score -= cond_penalty * 18
    condition_score = max(0, min(100, condition_score))

    # 3. Recency: minutes ago -> exponential-ish decay. Unknown = neutral.
    if listing.posted_minutes_ago is None:
        recency_score = 50
    else:
        mins = max(0, listing.posted_minutes_ago)
        recency_score = max(0.0, 100 * (0.5 ** (mins / 60 / 24)))  # halve per day

    overall = round(0.45 * value_score + 0.30 * condition_score + 0.25 * recency_score)

    return {
        "overall": overall,
        "value": round(value_score),
        "condition": round(condition_score),
        "recency": round(recency_score),
        "value_tokens": value_hits[:8],
        "condition_tokens": [t for t in CONDITION_BOOST + CONDITION_PENALTY if t in text][:8],
        "is_free": is_free,
    }


# ---------------------------------------------------------------------------
# Feed adapters
# ---------------------------------------------------------------------------

class FBMAdapter:
    """Facebook Marketplace feed. Live scraping is auth-blocked; this class
    documents the wall and can parse a page saved after a real login."""

    HEADERS = {
        "User-Agent": ("Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 "
                       "(KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36"),
        "Accept-Language": "en-US,en;q=0.9",
    }

    # FB returns a 400 "Error" page when unauthenticated on these hosts.
    AUTH_WALL_MARKERS = ["login", "log in to facebook", "you must log in",
                         "log in to continue", "error facebook", ">error<"]

    def __init__(self, timeout: int = 25):
        self.timeout = timeout
        self.sess = requests.Session()
        self.sess.headers.update(self.HEADERS)

    def _detect_wall(self, status: int, text: str) -> Optional[str]:
        low = text.lower()
        if status in (302, 401, 403) or "login.php" in low:
            return "Redirected to /login.php (auth required)"
        if status == 400 and ("error" in low or "marketplace" not in low):
            return f"HTTP {status} generic FB error page (no content served)"
        for m in self.AUTH_WALL_MARKERS:
            if m in low:
                return f"Auth-wall marker present: '{m}'"
        return None

    def fetch(self, url: str) -> str:
        """Return listing page HTML or raise BlockedError with exact evidence."""
        try:
            r = self.sess.get(url, timeout=self.timeout, allow_redirects=True)
        except requests.RequestException as e:
            raise BlockedError(f"Network failure: {e}")
        reason = self._detect_wall(r.status_code, r.text)
        if reason:
            raise BlockedError(
                f"Facebook Marketplace requires authentication. "
                f"{url} -> HTTP {r.status_code} ({reason}). "
                "No public/anon feed exists; you must log in via a real browser "
                "and save the HTML, then parse with --file."
            )
        return r.text


class OfflineSource:
    """Runs the full engine against bundled sample Denver listings so the
    pipeline is demonstrable and testable without any Facebook access."""

    def __init__(self, sample_path: Optional[str] = None):
        self.sample_path = sample_path or os.path.join(os.path.dirname(__file__),
                                                       "sample_denver_listings.json")

    def fetch(self, _url: str) -> list[Listing]:
        with open(self.sample_path) as f:
            data = json.load(f)
        out = []
        for it in data:
            price_cents = it.get("price_cents", 0)
            listing = Listing(
                title=it["title"], price=it.get("price", "Free"),
                price_cents=price_cents, location=it.get("location", ""),
                url=it.get("url", ""), image_url=it.get("image_url", ""),
                posted_minutes_ago=it.get("posted_minutes_ago"),
                posted_ts=it.get("posted_ts"),
                raw=it,
            )
            out.append(listing)
        return out


def parse_fb_html(html: str, base_url: str = "https://www.facebook.com/marketplace") -> list[Listing]:
    """Best-effort parser for a saved (post-login) FB Marketplace page.

    FB markup is obfuscated and changes frequently; this targets common
    <a> cards containing an image, a title and a price. Robust extraction
    should be re-validated against a live saved page."""
    soup = BeautifulSoup(html, "html.parser")
    listings: list[Listing] = []
    seen = set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "/marketplace/item/" not in href and "/marketplace/listing/" not in href:
            continue
        card_text = a.get_text(" ", strip=True)
        # Heuristic: a card has a price and some title text.
        m_price = re.search(r"\$?(\d{2,6})", card_text)
        if not m_price or len(card_text) < 8:
            continue
        # Try to pull a title via image alt first.
        img = a.find("img")
        title = ""
        if img is not None and img.get("alt"):
            title = str(img.get("alt")).strip()
        if not title:
            title = card_text[:120]
        price = m_price.group(0)
        url = urljoin(base_url, str(href))
        if url in seen:
            continue
        seen.add(url)
        img_src = str(img.get("src")).strip() if img is not None and img.get("src") else ""
        listings.append(Listing(
            title=title[:160], price=price,
            price_cents=int(m_price.group(1)) * 100,
            location="Denver, CO", url=url,
            image_url=img_src,
        ))
    return listings


# ---------------------------------------------------------------------------
# Engine: dedupe + score + emit
# ---------------------------------------------------------------------------

def dedupe(listings: Iterable[Listing]) -> list[Listing]:
    """Dedupe by normalized title+location, keeping the newest."""
    best: dict[str, Listing] = {}
    for l in listings:
        cur = best.get(l.key)
        if cur is None:
            best[l.key] = l
        else:
            # keep the more recent one (lower minutes_ago = newer)
            cur_ago = cur.posted_minutes_ago
            new_ago = l.posted_minutes_ago
            if new_ago is not None and (cur_ago is None or new_ago < cur_ago):
                best[l.key] = l
    return list(best.values())


def run_engine(listings: Iterable[Listing], city_filter: Optional[str] = None,
               score_file: Optional[str] = None, min_score: int = 0) -> list[dict]:
    """Dedupe, score, sort, and emit JSON payloads."""
    now_ts = int(time.time())
    deduped = dedupe(listings)

    if city_filter:
        cf = _norm(city_filter)
        deduped = [l for l in deduped if cf in _norm(l.location) or cf in _norm(l.title)]

    payloads = []
    for l in deduped:
        score = score_listing(l)
        if score["overall"] < min_score:
            continue
        payloads.append(l.to_json(score=score))

    payloads.sort(key=lambda p: p["score"]["overall"], reverse=True)

    if score_file:
        out = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "city_filter": city_filter,
            "count": len(payloads),
            "listings": payloads,
        }
        os.makedirs(os.path.dirname(score_file) or ".", exist_ok=True)
        with open(score_file, "w") as f:
            json.dump(out, f, indent=2)
        log.info("Wrote %d scored payloads -> %s", len(payloads), score_file)

    return payloads


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main(argv: Optional[list[str]] = None) -> int:
    p = argparse.ArgumentParser(description="FBM Denver free-listings alert engine")
    p.add_argument("--city", default="denver", help="City alias to filter by")
    p.add_argument("--offline", action="store_true", help="Run on bundled sample data (works w/o FB)")
    p.add_argument("--url", nargs="?", const="https://www.facebook.com/marketplace/denver/",
                   default=None,
                   help="Attempt a live FB URL (will show auth block). Bare flag = Denver URL")
    p.add_argument("--file", help="Parse a saved post-login FB Marketplace HTML file")
    p.add_argument("--score-file", default=None, help="Write JSON payloads to this path")
    p.add_argument("--min-score", type=int, default=0, help="Drop payloads below this score")
    p.add_argument("--limit", type=int, default=20, help="Print at most N top payloads")
    args = p.parse_args(argv)

    listings: list[Listing] = []

    if args.file:
        with open(args.file) as f:
            listings = parse_fb_html(f.read())
        log.info("Parsed %d listings from %s", len(listings), args.file)

    elif args.offline:
        listings = OfflineSource().fetch("")
        log.info("Loaded %d sample listings (offline demo)", len(listings))

    else:
        # Attempt live Facebook -> this raises BlockedError documenting the wall.
        target = args.url or "https://www.facebook.com/marketplace/denver/"
        fb = FBMAdapter()
        try:
            html = fb.fetch(target)
            listings = parse_fb_html(html)
            log.info("Live fetch returned %d listings", len(listings))
        except BlockedError as e:
            log.error("BLOCKED: %s", e)
            print("\n[FBM_BLOCKED] " + str(e))
            print("\nFallback: run `python fbm_scraper.py --offline` to demo the engine,")
            print("or `python fbm_scraper.py --file logged_in_page.html` to parse a saved page.\n")
            return 2

    if not listings:
        log.error("No listings to score.")
        return 1

    default_score_file = args.score_file or os.path.join(
        os.path.dirname(__file__), "denver_free_payloads.json")
    payloads = run_engine(listings, city_filter=args.city,
                          score_file=default_score_file, min_score=args.min_score)

    print(f"\nScored {len(payloads)} Denver free listings (top {min(args.limit, len(payloads))}):")
    for pl in payloads[:args.limit]:
        s = pl["score"]
        print(f"  [{s['overall']:3d}] {pl['title'][:60]:60s} | {pl['price']:>6s} | {pl['location'][:24]:24s}")
        if s["value_tokens"]:
            print(f"        value hits: {', '.join(s['value_tokens'])}")
    print(f"\nJSON payloads written to: {default_score_file}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
