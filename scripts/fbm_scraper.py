#!/usr/bin/env python3
"""
FBM Scraper — Denver FREE listings from Facebook Marketplace.

Scrapes Facebook Marketplace free listings for the Denver area, deduplicates,
scores each listing for value, and emits a JSON notification payload.

SOURCE STRATEGY (verified live on this machine, 2026-08-09):
  Direct anonymous scraping of Facebook Marketplace is BLOCKED:
    * www.facebook.com/marketplace/denver/  -> login wall ("Log in to Facebook")
    * mbasic.facebook.com/marketplace        -> 302 redirect to /login.php
    * facebook.com/marketplace/item/<id>     -> login wall for item pages
  There is NO public/anonymous FB Marketplace feed. Verified in prior work and
  re-verified with Playwright + stealth in this build.

  What DOES work headless (verified):
    * Search-engine fallback: Google / DuckDuckGo / Bing SERPs for
      `site:facebook.com/marketplace free Denver` surface real FB Marketplace
      listing URLs (facebook.com/marketplace/item/<id>) which are then parsed,
      deduped, scored, and emitted. This is the primary working path.
    * Parsing a saved HTML page from a logged-in FB session (--file).

  What would unblock the direct feed (NOT implemented, requires user action):
    * A logged-in FB session cookie export (c_user + xs cookies) saved to
      cookies.json and passed with --cookies — the scraper then loads the real
      marketplace page. See NOTES below / FBM_SCRAPER_NOTES.md.

USAGE:
  python fbm_scraper.py                          # auto: ddg -> bing -> google
  python fbm_scraper.py --engine ddg             # DuckDuckGo (ddgs lib; most reliable)
  python fbm_scraper.py --engine google          # Google SERP via stealth Playwright
  python fbm_scraper.py --engine bing            # Bing SERP via stealth Playwright
  python fbm_scraper.py --engine fb              # direct FB attempt (shows the block)
  python fbm_scraper.py --cookies cookies.json   # use logged-in FB session cookies
  python fbm_scraper.py --offline                # demo on bundled sample data
  python fbm_scraper.py --file saved_page.html   # parse a saved post-login page
  python fbm_scraper.py --out payloads.json --min-score 55 --limit 25

OUTPUT: JSON notification payload at --out (default scripts/denver_free_payloads.json)
  {generated_at, city, source, engine, stats{scraped,deduped,new,scored},
   listings:[{title, price, price_cents, location, url, image_url,
              posted_minutes_ago, dedupe_key, hash, is_new, score{...}}]}

NOTES / WHAT DOESN'T WORK:
  * FB Marketplace anonymous: 100% login-walled. Item pages too (HTTP 400).
  * Google SERP: serves a bot check ("sorry/index") to anonymous headless —
    verified. Bing works but only via JS (Playwright).
  * DDG raw html/lite endpoints can get IP-flagged after rapid queries (202);
    the ddgs package's vqd-token flow keeps working — it is the default.
  * SERP results don't include price/recently-posted metadata — price is
    inferred ($0 = free listings keyword), recency is unknown (neutral score).
  * To get full fidelity (prices, photos, timestamps), you MUST log in:
    1) In Chrome, visit facebook.com, log in, install "Export Cookies" extension
       (or use browser_cookie3 with the real Chrome profile — see
       fbm_playwright_feed.py), export .facebook.com cookies to cookies.json.
    2) Run: python fbm_scraper.py --cookies cookies.json
"""

import argparse
import hashlib
import json
import logging
import os
import random
import re
import sys
import time
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Iterable, Optional
from urllib.parse import urljoin, urlparse, parse_qs, unquote, quote_plus

try:
    import requests
    from bs4 import BeautifulSoup
    from playwright.sync_api import sync_playwright
    from playwright_stealth import Stealth
except ImportError as e:  # pragma: no cover
    sys.exit(f"Missing dependency: {e}. Run: .venv/bin/python -m pip install "
             f"requests beautifulsoup4 playwright playwright-stealth")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("fbm")

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

DENVER = {"name": "Denver, CO", "alias": "denver"}
UA_DESKTOP = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36")
UA_MOBILE = ("Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 "
             "(KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36")

MARKETPLACE_URL = "https://www.facebook.com/marketplace/{city}/"
MBASIC_URL = "https://mbasic.facebook.com/marketplace"
ITEM_URL_RE = re.compile(r"/marketplace/(?:item|listing)/(\d+)")
FB_DOMAIN_RE = re.compile(r"https?://(?:[a-z0-9.-]*\.)?facebook\.com[^\"'<>\s]*", re.I)

# SERP queries that surface real FB Marketplace listings.
SEARCH_QUERIES = [
    'site:facebook.com/marketplace/item free Denver',
    'site:facebook.com/marketplace free Denver',
    'site:facebook.com/marketplace/denver free stuff',
    'facebook.com marketplace item free stuff Denver',
]

DEFAULT_STATE_FILE = os.path.join(os.path.dirname(__file__), ".fbm_seen_state.json")
DEFAULT_OUT_FILE = os.path.join(os.path.dirname(__file__), "denver_free_payloads.json")

# ---------------------------------------------------------------------------
# Domain types
# ---------------------------------------------------------------------------

@dataclass
class Listing:
    title: str
    price: str = "Free"
    price_cents: int = 0
    location: str = ""
    url: str = ""
    image_url: str = ""
    posted_minutes_ago: Optional[int] = None
    posted_ts: Optional[str] = None
    fb_item_id: Optional[str] = None
    raw: dict = field(default_factory=dict)

    @property
    def key(self) -> str:
        """Dedupe key: FB item id if known, else normalized title+location."""
        if self.fb_item_id:
            return f"fb:{self.fb_item_id}"
        t = re.sub(r"[^a-z0-9]+", " ", self.title.lower()).strip()
        loc = re.sub(r"[^a-z0-9]+", " ", self.location.lower()).strip()
        return f"{t}||{loc}"

    @property
    def hash(self) -> str:
        return hashlib.sha1(self.key.encode()).hexdigest()[:12]

    def to_json(self, score: Optional[dict] = None, is_new: bool = True) -> dict:
        d = {
            "title": self.title,
            "price": self.price,
            "price_cents": self.price_cents,
            "location": self.location,
            "url": self.url,
            "image_url": self.image_url,
            "posted_minutes_ago": self.posted_minutes_ago,
            "dedupe_key": self.key,
            "hash": self.hash,
            "is_new": is_new,
        }
        if self.fb_item_id:
            d["fb_item_id"] = self.fb_item_id
        if self.posted_ts:
            d["posted_ts"] = self.posted_ts
        if score:
            d["score"] = score
        return d


class BlockedError(Exception):
    """Raised when a feed cannot be accessed (auth wall, bot check, captcha)."""


# ---------------------------------------------------------------------------
# Scoring (value x condition x recency -> 0-100)
# ---------------------------------------------------------------------------

VALUE_TOKENS = [
    "apple", "iphone", "ipad", "macbook", "imac", "airpods", "samsung",
    "sony", "canon", "nikon", "go pro", "gopro", "nintendo", "switch", "ps5",
    "playstation", "xbox", "lego", "legos", "dyson", "bosch", "dewalt",
    "milwaukee", "makita", "kohler", "peloton", "treadmill", "elliptical",
    "telescope", "guitar", "violin", "yamaha", "espresso", "kitchenaid",
    "vitamix", "le creuset", "cast iron", "smart tv", "oled", "mountain bike",
    "road bike", "trek", "specialized", "tent", "canoe", "kayak", "drone",
    "dji", "rolex", "swiss", "gold", "silver", "coin", "stamp", "vinyl",
    "turntable", "camera", "lens", "pro", "gaming", "computer", "monitor",
    "4k", "diamond", "designer", "nordic", "mid century", "crib", "stroller",
    "car seat", "nursery", "bob stroller", "uppababy", "pottery barn",
    "west elm", "crate and barrel", "herman miller", "workbench", "table saw",
]

JUNK_TOKENS = [
    "broken", "for parts", "parts only", "scrap", "junk", "rust", "rusted",
    "firewood", "wood pile", "old paint", "empties", "water damage",
    "does not work", "not working", "dead", "cracked", "chipped", "worn",
    "very used", "heavily used", "as is", "project", "mattress", "stained",
    "smoke", "free trash", "garbage", "leftover",
]

CONDITION_BOOST = ["new", "open box", "like new", "excellent", "mint", "sealed",
                   "unused", "brand new", "gently used", "barely used", "nwt",
                   "retired", "collector", "vintage", "antique", "rare", "original box"]
CONDITION_PENALTY = ["broken", "for parts", "needs repair", "needs work", "not working",
                     "does not work", "scratched", "stained", "stains", "as-is",
                     "as is", "heavily used", "well used", "damaged"]


def _norm(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (text or "").lower())


def score_listing(listing: Listing, now_ts: Optional[int] = None) -> dict:
    """Score a free listing: value + condition + recency -> overall 0-100."""
    text = _norm(f"{listing.title} {listing.location}")
    value_hits = [t for t in VALUE_TOKENS if t in text]
    junk_hits = [t for t in JUNK_TOKENS if t in text]
    is_free = listing.price_cents == 0

    value_score = 50 if is_free else 42
    value_score += min(40, len(value_hits) * 5)
    value_score -= min(50, len(junk_hits) * 15)
    value_score = max(0, min(100, value_score))

    cond_boost = sum(1 for t in CONDITION_BOOST if t in text)
    cond_penalty = sum(1 for t in CONDITION_PENALTY if t in text)
    condition_score = max(0, min(100, 60 + cond_boost * 12 - cond_penalty * 18))

    if listing.posted_minutes_ago is None:
        recency_score = 50
    else:
        mins = max(0, listing.posted_minutes_ago)
        recency_score = max(0.0, 100 * (0.5 ** (mins / 60 / 24)))

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
# Feed sources
# ---------------------------------------------------------------------------

def _stealth_context(browser, mobile: bool = False):
    ctx = browser.new_context(
        user_agent=UA_MOBILE if mobile else UA_DESKTOP,
        viewport={"width": 412, "height": 900} if mobile else {"width": 1440, "height": 900},
        locale="en-US",
        timezone_id="America/Denver",
    )
    Stealth().apply_stealth_sync(ctx)
    return ctx


class FacebookSource:
    """Direct Facebook Marketplace. Anonymous = login wall (documented)."""

    name = "facebook"

    AUTH_WALL_MARKERS = ["log in to facebook", "you must log in", "log in to continue",
                         "login.php", ">error<", "an error occurred"]

    def __init__(self, cookies_file: Optional[str] = None, timeout_ms: int = 45000):
        self.cookies_file = cookies_file
        self.timeout_ms = timeout_ms

    def _detect_wall(self, final_url: str, html: str) -> Optional[str]:
        low = html.lower()
        if "login.php" in final_url or "/login" in final_url:
            return f"redirected to login: {final_url[:80]}"
        for m in self.AUTH_WALL_MARKERS:
            if m in low:
                return f"auth-wall marker present: '{m}'"
        if not ITEM_URL_RE.search(html) and len(html) < 200_000:
            return "no marketplace item links and page too small to be a feed"
        return None

    def fetch(self, city: str = "denver") -> tuple[str, list[dict]]:
        """Return (source_note, listings). Raises BlockedError with evidence."""
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            try:
                ctx = _stealth_context(browser)
                if self.cookies_file:
                    with open(self.cookies_file) as f:
                        cookies = json.load(f)
                    if isinstance(cookies, dict) and "cookies" in cookies:
                        cookies = cookies["cookies"]
                    ctx.add_cookies(cookies)
                    auth = any(c.get("name") in ("c_user", "xs") for c in cookies)
                    note = f"cookies loaded from {self.cookies_file} (auth={'yes' if auth else 'NO — not logged in'})"
                else:
                    auth = False
                    note = "anonymous (no cookies)"

                page = ctx.new_page()
                url = MARKETPLACE_URL.format(city=city)
                page.goto(url, wait_until="domcontentloaded", timeout=self.timeout_ms)
                page.wait_for_timeout(7000)
                for _ in range(3):  # lazy-load listing cards
                    page.mouse.wheel(0, 1200)
                    page.wait_for_timeout(700)
                html = page.content()
                final_url = page.url
            finally:
                browser.close()

        wall = self._detect_wall(final_url, html)
        if wall and not auth:
            raise BlockedError(
                f"Facebook Marketplace requires authentication. {url} -> {wall}. "
                f"No public/anonymous feed exists. Unblock: log into facebook.com in a "
                f"real browser, export .facebook.com cookies to cookies.json, then "
                f"run with --cookies cookies.json."
            )
        listings = parse_fb_html(html, base_url=final_url)
        return note, listings


class SerpSource:
    """Search-engine fallback: site:facebook.com/marketplace + free + Denver.

    Engines (in order of reliability for anonymous headless use):
      ddg    -> DuckDuckGo via the `ddgs` package (vqd-token flow; works even
                when the raw html.duckduckgo.com endpoint is bot-flagged).
                Falls back to raw html/lite endpoints if ddgs is unavailable.
      bing   -> Bing SERP via stealth Playwright (works; JS required).
      google -> Google SERP via stealth Playwright (usually serves a bot check
                "sorry/index" to anonymous headless — documented blocker).
    """

    def __init__(self, engine: str = "ddg", queries: Optional[list[str]] = None,
                 results_per_query: int = 30):
        self.engine = engine
        self.queries = queries or SEARCH_QUERIES
        self.results_per_query = results_per_query

    def fetch(self, city: str = "denver") -> tuple[str, list[dict]]:
        """Return (source_note, raw result dicts) from SERP."""
        raw: list[dict] = []
        if self.engine == "ddg":
            raw = self._ddg(city)
        elif self.engine == "google":
            raw = self._google(city)
        elif self.engine == "bing":
            raw = self._bing(city)
        else:
            raise ValueError(f"unknown engine {self.engine}")
        return f"serp:{self.engine}", raw

    # -- DuckDuckGo (ddgs package, then raw HTML endpoints) ---------------
    def _ddg(self, city: str) -> list[dict]:
        try:
            from ddgs import DDGS
            out: list[dict] = []
            with DDGS() as d:
                for q in self.queries:
                    qq = q.replace("Denver", city)
                    try:
                        for r in d.text(qq, max_results=self.results_per_query,
                                        region="us-en"):
                            out.append({"title": r.get("title", ""),
                                        "url": r.get("href", ""),
                                        "snippet": r.get("body", ""),
                                        "raw_engine": "ddg"})
                        log.info("ddgs: %d results for '%s'", len(out), qq)
                    except Exception as e:
                        log.warning("ddgs query '%s' failed: %s", qq, e)
                    time.sleep(random.uniform(2, 4))
            if out:
                return out
            log.warning("ddgs returned nothing; falling back to raw DDG HTML")
        except ImportError:
            log.warning("ddgs not installed; using raw DDG HTML endpoints")
        except Exception as e:
            log.warning("ddgs failed (%s); falling back to raw DDG HTML", e)

        out = []
        for q in self.queries:
            qq = q.replace("Denver", city)
            got = self._ddg_endpoint("https://html.duckduckgo.com/html/", qq)
            if not got:
                got = self._ddg_endpoint("https://lite.duckduckgo.com/lite/", qq)
            out.extend(got)
            time.sleep(random.uniform(1.5, 3.0))
        return out

    def _ddg_endpoint(self, base: str, q: str) -> list[dict]:
        try:
            r = requests.get(base, params={"q": q}, headers={"User-Agent": UA_DESKTOP,
                             "Accept-Language": "en-US,en;q=0.9"}, timeout=25)
        except requests.RequestException as e:
            log.warning("DDG request failed (%s): %s", base, e)
            return []
        if r.status_code != 200 or "anomaly" in r.text.lower():
            log.warning("DDG %s returned %s (possible bot check)", base, r.status_code)
            return []
        soup = BeautifulSoup(r.text, "html.parser")
        out: list[dict] = []
        for a in soup.select("a.result__a, a.result-link"):
            href = str(a.get("href", ""))
            # DDG wraps links: //duckduckgo.com/l/?uddg=<url>
            if "uddg=" in href:
                href = unquote(parse_qs(urlparse(href).query).get("uddg", [""])[0])
            title = a.get_text(" ", strip=True)
            if not title:
                continue
            item = {"title": title, "url": href, "snippet": "", "raw_engine": "ddg"}
            snip_el = a.find_parent("div")
            if snip_el is not None:
                item["snippet"] = snip_el.get_text(" ", strip=True)[:400]
            out.append(item)
        log.info("DDG: %d results for '%s'", len(out), q)
        return out

    # -- Google (stealth Playwright) --------------------------------------
    def _google(self, city: str) -> list[dict]:
        out: list[dict] = []
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            try:
                ctx = _stealth_context(browser)
                page = ctx.new_page()
                for q in self.queries:
                    qq = q.replace("Denver", city)
                    url = "https://www.google.com/search?q=" + quote_plus(qq) + f"&num={self.results_per_query}"
                    try:
                        page.goto(url, wait_until="domcontentloaded", timeout=40000)
                        page.wait_for_timeout(4500)
                        html = page.content()
                    except Exception as e:
                        log.warning("Google fetch failed: %s", e)
                        continue
                    low = html.lower()
                    if "unusual traffic" in low or "not a robot" in low or "captcha" in low:
                        raise BlockedError("Google served a bot check (unusual traffic) — "
                                           "use --engine ddg, or add a Google session cookie")
                    soup = BeautifulSoup(html, "html.parser")
                    found = 0
                    for a in soup.select("a"):
                        href = a.get("href", "")
                        if href.startswith("/url?"):
                            href = unquote(parse_qs(urlparse(href).query).get("q", [""])[0])
                        title = a.get_text(" ", strip=True)
                        if not title or not href.startswith("http"):
                            continue
                        found += 1
                        out.append({"title": title, "url": href, "snippet": "",
                                    "raw_engine": "google"})
                    log.info("Google: %d links for '%s'", found, qq)
                    time.sleep(random.uniform(4, 7))
            finally:
                browser.close()
        return out

    # -- Bing (stealth Playwright) ----------------------------------------
    def _bing(self, city: str) -> list[dict]:
        out: list[dict] = []
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            try:
                ctx = _stealth_context(browser)
                page = ctx.new_page()
                for q in self.queries:
                    qq = q.replace("Denver", city)
                    url = "https://www.bing.com/search?q=" + quote_plus(qq)
                    try:
                        page.goto(url, wait_until="domcontentloaded", timeout=40000)
                        page.wait_for_timeout(4000)
                        html = page.content()
                    except Exception as e:
                        log.warning("Bing fetch failed: %s", e)
                        continue
                    soup = BeautifulSoup(html, "html.parser")
                    found = 0
                    for li in soup.select("li.b_algo"):
                        a = li.select_one("h2 a")
                        if not a:
                            continue
                        href = a.get("href", "")
                        if not href.startswith("http"):
                            continue
                        found += 1
                        out.append({"title": a.get_text(" ", strip=True), "url": href,
                                    "snippet": li.get_text(" ", strip=True)[:400],
                                    "raw_engine": "bing"})
                    log.info("Bing: %d results for '%s'", found, qq)
                    time.sleep(random.uniform(3, 5))
            finally:
                browser.close()
        return out


class OfflineSource:
    """Runs the engine against bundled sample Denver listings (no network)."""

    name = "offline"

    def __init__(self, sample_path: Optional[str] = None):
        self.sample_path = sample_path or os.path.join(os.path.dirname(__file__),
                                                       "sample_denver_listings.json")

    def fetch(self, _city: str = "denver") -> tuple[str, list[Listing]]:
        with open(self.sample_path) as f:
            data = json.load(f)
        listings = []
        for it in data:
            listings.append(Listing(
                title=it.get("title", ""),
                price=it.get("price", "Free"),
                price_cents=it.get("price_cents", 0),
                location=it.get("location", ""),
                url=it.get("url", ""),
                image_url=it.get("image_url", ""),
                posted_minutes_ago=it.get("posted_minutes_ago"),
                posted_ts=it.get("posted_ts"),
                fb_item_id=it.get("fb_item_id"),
                raw=it,
            ))
        return "offline-sample", listings


# ---------------------------------------------------------------------------
# Parsers
# ---------------------------------------------------------------------------

def parse_fb_html(html: str, base_url: str = "https://www.facebook.com/marketplace") -> list[Listing]:
    """Parse a rendered FB Marketplace page (post-login) into listings.

    Targets (a) embedded JSON blobs and (b) <a> cards with /marketplace/item/.
    """
    listings: list[Listing] = []
    seen: set[str] = set()

    # 1) embedded JSON: "marketplace_search_title" + price blobs
    titles = list(dict.fromkeys(re.findall(r'"marketplace_search_title":"([^"]{3,160})"', html)))
    for t in titles:
        key = _norm(t)
        if key in seen:
            continue
        seen.add(key)
        listings.append(Listing(title=t[:160], fb_item_id=None))

    # 2) anchor cards
    for m in re.finditer(r'<a[^>]+href="([^"]*marketplace/(?:item|listing)/\d+[^"]*)"[^>]*>(.*?)</a>',
                         html, re.S):
        href, inner = m.group(1), m.group(2)
        idm = ITEM_URL_RE.search(href)
        fid = idm.group(1) if idm else None
        if fid and fid in seen:
            continue
        text = re.sub(r"<[^>]+>", " ", inner)
        text = re.sub(r"\s+", " ", text).strip()
        img = re.search(r'<img[^>]+src="([^"]+)"', inner)
        price_m = re.search(r"\$(\d{2,6})", text)
        if not text:
            continue
        seen.add(fid or _norm(text))
        title = text[:160]
        listings.append(Listing(
            title=title,
            price=price_m.group(0) if price_m else "Free",
            price_cents=int(price_m.group(1)) * 100 if price_m else 0,
            location=DENVER["name"],
            url=urljoin(base_url, href),
            image_url=img.group(1) if img else "",
            fb_item_id=fid,
        ))
    return listings


def _clean_serp_title(title: str) -> str:
    """Strip FB SERP decorations: ' | Facebook Marketplace | Facebook' and
    trailing ' - Category - City, CO' segments."""
    t = re.sub(r"\s*[-|]\s*(?:marketplace\s*)?\|?\s*Facebook\s*$", "", (title or "").strip(), flags=re.I)
    t = re.sub(r"\s*-\s*[\w &'.()]+\s*-\s*[\w .&'()-]+,\s*(?:CO|Colorado)\s*$", "", t, flags=re.I)
    t = re.sub(r"\s*-\s*[\w .&'()-]+,\s*(?:CO|Colorado)\s*$", "", t, flags=re.I)
    return t.strip()


def parse_serp_results(raw: list[dict], city: str = "denver") -> list[Listing]:
    """Filter SERP results down to FB Marketplace LISTING pages and build
    Listing objects. Only /marketplace/item/<id> (or /listing/<id>) links are
    real listings; category pages (/marketplace/denver/free/) are skipped."""
    listings: list[Listing] = []
    seen: set[str] = set()

    for r in raw:
        url = r.get("url", "")
        if "facebook.com" not in url:
            continue
        idm = ITEM_URL_RE.search(url)
        fb_id = idm.group(1) if idm else None
        if not fb_id:
            continue  # category pages are not listings

        title = _clean_serp_title(r.get("title", ""))
        if not title:
            continue
        if title.lower().startswith("link to facebook") or "marketplace:" in title.lower():
            continue

        key = fb_id
        if key in seen:
            continue
        seen.add(key)

        listings.append(Listing(
            title=title[:160],
            price="Free",
            price_cents=0,
            location=DENVER["name"],
            url=url[:400],
            fb_item_id=fb_id,
            raw={"snippet": r.get("snippet", ""), "engine": r.get("raw_engine", "serp")},
        ))
    return listings


# ---------------------------------------------------------------------------
# Engine: dedupe + state + score + emit
# ---------------------------------------------------------------------------

class SeenState:
    """Persistent dedup state across runs (id -> first-seen timestamp)."""

    def __init__(self, path: Optional[str] = None):
        self.path = path or DEFAULT_STATE_FILE
        self.data: dict[str, str] = {}
        if os.path.exists(self.path):
            try:
                with open(self.path) as f:
                    self.data = json.load(f)
            except Exception:
                self.data = {}

    def is_new(self, key: str) -> bool:
        return key not in self.data

    def remember(self, key: str, ts: str) -> None:
        self.data.setdefault(key, ts)

    def save(self) -> None:
        if not self.path:
            return
        os.makedirs(os.path.dirname(self.path) or ".", exist_ok=True)
        with open(self.path, "w") as f:
            json.dump(self.data, f, indent=2)


def dedupe(listings: Iterable[Listing]) -> list[Listing]:
    """Dedupe by key, keeping the newest (lowest posted_minutes_ago)."""
    best: dict[str, Listing] = {}
    for l in listings:
        cur = best.get(l.key)
        if cur is None:
            best[l.key] = l
        else:
            cur_ago, new_ago = cur.posted_minutes_ago, l.posted_minutes_ago
            if new_ago is not None and (cur_ago is None or new_ago < cur_ago):
                best[l.key] = l
    return list(best.values())


def run_engine(listings: Iterable[Listing], city_filter: Optional[str] = None,
               min_score: int = 0, state: Optional[SeenState] = None,
               now_ts: Optional[int] = None) -> tuple[list[dict], dict]:
    """Dedupe -> score -> sort -> payload dicts. Returns (payloads, stats)."""
    now_ts = now_ts or int(time.time())
    now_iso = datetime.now(timezone.utc).isoformat()
    state = state or SeenState()
    listings = list(listings)

    deduped = dedupe(listings)

    if city_filter:
        cf = _norm(city_filter)
        deduped = [l for l in deduped if cf in _norm(l.location) or cf in _norm(l.title)]

    payloads: list[dict] = []
    new_count = 0
    for l in deduped:
        score = score_listing(l, now_ts)
        if score["overall"] < min_score:
            continue
        is_new = state.is_new(l.key)
        if is_new:
            new_count += 1
        state.remember(l.key, now_iso)
        payloads.append(l.to_json(score=score, is_new=is_new))

    payloads.sort(key=lambda p: p["score"]["overall"], reverse=True)
    stats = {
        "scraped_raw": len(listings),
        "deduped": len(deduped),
        "scored": len(payloads),
        "new": new_count,
    }
    return payloads, stats


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main(argv: Optional[list[str]] = None) -> int:
    p = argparse.ArgumentParser(description="FBM Denver free-listings scraper")
    p.add_argument("--city", default="denver", help="City alias (default denver)")
    p.add_argument("--engine", default="auto",
                   choices=["auto", "ddg", "google", "bing", "fb", "offline"],
                   help="Feed source. auto = ddg -> google -> bing (search fallback).")
    p.add_argument("--cookies", help="JSON cookies file from a logged-in FB session")
    p.add_argument("--file", help="Parse a saved post-login FB Marketplace HTML file")
    p.add_argument("--out", default=None, help="JSON payload output path")
    p.add_argument("--state", default=None, help="Persistent seen-state file")
    p.add_argument("--min-score", type=int, default=0, help="Drop payloads below this")
    p.add_argument("--limit", type=int, default=20, help="Print at most N top payloads")
    p.add_argument("--no-state", action="store_true", help="Do not persist seen state")
    args = p.parse_args(argv)

    out_file = args.out or DEFAULT_OUT_FILE
    state = None if args.no_state else SeenState(args.state)

    listings: list[Listing] = []
    source_note = ""

    # --- source selection -------------------------------------------------
    if args.file:
        with open(args.file) as f:
            listings = parse_fb_html(f.read())
        source_note = f"file:{args.file}"
        log.info("Parsed %d listings from %s", len(listings), args.file)

    elif args.engine == "offline":
        note, listings = OfflineSource().fetch(args.city)
        source_note = note
        log.info("Loaded %d sample listings (offline demo)", len(listings))

    elif args.engine == "fb":
        try:
            note, listings = FacebookSource(cookies_file=args.cookies).fetch(args.city)
            source_note = note
            log.info("Live FB fetch OK: %d listings (%s)", len(listings), note)
        except BlockedError as e:
            log.error("BLOCKED: %s", e)
            print("\n[FBM_BLOCKED] " + str(e))
            print("\nFallbacks that work headless:")
            print("  python fbm_scraper.py --engine ddg     # DuckDuckGo SERP (no login)")
            print("  python fbm_scraper.py --cookies cookies.json   # logged-in session")
            return 2

    else:
        # auto / ddg / google / bing -> SERP fallback chain
        engines = (["ddg", "bing", "google"] if args.engine == "auto" else [args.engine])
        serp = SerpSource()
        last_err: Optional[str] = None
        for eng in engines:
            try:
                note, raw = serp.fetch(args.city) if eng == "ddg" else \
                    SerpSource(engine=eng).fetch(args.city)
                source_note = f"serp:{eng}"
                listings = parse_serp_results(raw, args.city)
                log.info("Engine %s: %d FB marketplace listings", eng, len(listings))
                if listings:
                    break
                last_err = f"{eng}: 0 FB results"
            except BlockedError as e:
                last_err = f"{eng}: {e}"
                log.warning("Engine %s blocked: %s", eng, e)
                continue
        if not listings:
            log.error("All SERP engines failed. Last error: %s", last_err)
            print("[FBM_BLOCKED] No search engine returned FB Marketplace listings.")
            print("  Direct FB is login-walled (see --engine fb). Retry with --engine ddg")
            print("  or provide a logged-in session via --cookies.")
            return 2

    if not listings:
        log.error("No listings to score.")
        return 1

    payloads, stats = run_engine(listings, city_filter=args.city,
                                 min_score=args.min_score, state=state)

    out = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "city": args.city,
        "source": source_note,
        "stats": stats,
        "listings": payloads,
    }
    os.makedirs(os.path.dirname(out_file) or ".", exist_ok=True)
    with open(out_file, "w") as f:
        json.dump(out, f, indent=2)
    if state and not args.no_state:
        state.save()

    print(f"\n[{source_note}] scraped={stats['scraped_raw']} deduped={stats['deduped']} "
          f"scored={stats['scored']} new={stats['new']}")
    print(f"Top {min(args.limit, len(payloads))} Denver free listings:")
    for pl in payloads[:args.limit]:
        s = pl["score"]
        new_mark = "NEW" if pl["is_new"] else "   "
        tags = ", ".join(s["value_tokens"][:4]) or "-"
        print(f"  [{new_mark}] [{s['overall']:3d}] {pl['title'][:56]:56s} | {pl['location'][:22]:22s} | hits: {tags}")
    print(f"\nJSON payloads -> {out_file}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
