#!/usr/bin/env python3
"""
FBM LIVE FEED — the winning engine.
Pulls REAL Facebook Marketplace listings through James's logged-in Chrome
session (cookies from the browser), scores them, emits alert payloads.

How it beats Freebie Alerts:
  - Uses the USER's own FB session (no account farm, no bans, no proxies)
  - Direct single-source polling = faster alerts than multi-site aggregators
  - Scores every listing (value x condition x recency) so alerts are filtered

Usage:
  PYTHONPATH= .venv/bin/python fbm_playwright_feed.py --city denver --query "free"
  PYTHONPATH= .venv/bin/python fbm_playwright_feed.py --city denver --out /tmp/fbm_payloads.json --min-score 60
"""
import argparse
import json
import os
import re
import sys
import time
from datetime import datetime, timezone

# venv deps: playwright, browser_cookie3
from playwright.sync_api import sync_playwright

MARKETPLACE_URL = "https://www.facebook.com/marketplace/{city}/"
COOKIE_DOMAINS = (".facebook.com", ".fbcdn.net")

VALUE_TOKENS = [
    "apple", "iphone", "ipad", "macbook", "imac", "airpods", "samsung", "sony",
    "canon", "nikon", "gopro", "nintendo", "switch", "ps5", "playstation", "xbox",
    "lego", "dyson", "bosch", "dewalt", "milwaukee", "makita", "kohler", "peloton",
    "treadmill", "telescope", "guitar", "yamaha", "espresso", "kitchenaid",
    "vitamix", "le creuset", "cast iron", "smart tv", "oled", "mountain bike",
    "trek", "specialized", "tent", "canoe", "kayak", "drone", "dji", "gold",
    "silver", "vinyl", "turntable", "camera", "lens", "gaming", "computer",
    "monitor", "4k", "diamond", "designer", "nordic", "mid century", "crib",
    "stroller", "car seat", "nursery", "baby", "bob stroller", "uppababy",
    "pottery barn", "west elm", "crate and barrel", "herman miller",
]
JUNK_TOKENS = [
    "broken", "for parts", "parts only", "scrap", "junk", "rust", "rusted",
    "firewood", "old paint", "empties", "water damage", "does not work",
    "not working", "dead", "cracked", "chipped", "worn", "very used",
    "heavily used", "as is", "project", "mattress", "stained", "smoke",
]
CONDITION_BOOST = ["new", "open box", "like new", "excellent", "mint", "sealed",
                   "unused", "brand new", "gently used", "barely used", "nwt",
                   "retired", "collector", "vintage", "antique", "rare", "original box"]
CONDITION_PENALTY = ["broken", "for parts", "needs repair", "needs work", "not working",
                     "does not work", "scratched", "stained", "stains", "as-is",
                     "as is", "heavily used", "well used", "damaged"]


def _norm(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (text or "").lower())


def score_listing(title: str, price_cents: int, location: str = "") -> dict:
    text = _norm(f"{title} {location}")
    value_hits = [t for t in VALUE_TOKENS if t in text]
    junk_hits = [t for t in JUNK_TOKENS if t in text]
    is_free = price_cents == 0
    value_score = 50 if is_free else max(0, 42)
    value_score += min(40, len(value_hits) * 5)
    value_score -= min(50, len(junk_hits) * 15)
    value_score = max(0, min(100, value_score))
    cond_boost = sum(1 for t in CONDITION_BOOST if t in text)
    cond_penalty = sum(1 for t in CONDITION_PENALTY if t in text)
    condition_score = max(0, min(100, 60 + cond_boost * 12 - cond_penalty * 18))
    overall = round(0.55 * value_score + 0.45 * condition_score)
    return {
        "overall": overall, "value": round(value_score),
        "condition": round(condition_score), "is_free": is_free,
        "value_tokens": value_hits[:8],
        "condition_tokens": [t for t in CONDITION_BOOST + CONDITION_PENALTY if t in text][:8],
    }


def extract_listings(html: str, base_url: str = "https://www.facebook.com/marketplace") -> list[dict]:
    """Extract marketplace listing cards from rendered HTML (FB obfuscated markup)."""
    listings: list[dict] = []
    seen = set()
    # FB embeds structured listing data in script JSON — try that first.
    for m in re.finditer(r'"marketplace_search_title":"([^"]{3,160})"', html):
        title = m.group(1)
        key = _norm(title)
        if key in seen:
            continue
        seen.add(key)
        listings.append({"title": title, "price_cents": 0, "location": "", "url": "", "raw": {}})
    if listings:
        return listings
    # Fallback: anchor cards.
    for m in re.finditer(
        r'<a[^>]+href="(/marketplace/item/[^"]+)"[^>]*>(.*?)</a>', html, re.S
    ):
        href, inner = m.group(1), m.group(2)
        text = re.sub(r"<[^>]+>", " ", inner)
        text = re.sub(r"\s+", " ", text).strip()
        if not text or len(text) < 5:
            continue
        key = _norm(text)
        if key in seen:
            continue
        seen.add(key)
        pm = re.search(r"\$(\d{2,6})", text)
        listings.append({
            "title": text[:160],
            "price_cents": int(pm.group(1)) * 100 if pm else 0,
            "location": "",
            "url": base_url + href,
            "raw": {},
        })
    return listings


def get_chrome_cookies() -> list[dict]:
    import browser_cookie3
    cj = browser_cookie3.chrome(domain_name=".facebook.com")
    out = []
    for c in cj:
        if c.domain and any(c.domain.endswith(d) for d in COOKIE_DOMAINS):
            out.append({
                "name": c.name, "value": c.value, "domain": c.domain,
                "path": c.path or "/",
                "expires": int(c.expires) if c.expires else -1,
                "httpOnly": True, "secure": bool(c.secure),
                "sameSite": "Lax",
            })
    return out


def fetch_marketplace(city: str, query: str = "", wait_ms: int = 9000) -> str:
    cookies = get_chrome_cookies()
    auth_names = [c["name"] for c in cookies]
    print(f"[cookies] {len(cookies)} loaded: {auth_names}", flush=True)
    if not any(n in auth_names for n in ("c_user", "xs")):
        print("[warn] no c_user/xs — session may be logged out", flush=True)

    url = MARKETPLACE_URL.format(city=city)
    if query:
        url += f"?query={query}"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            user_agent=("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36"),
            viewport={"width": 1440, "height": 900},
            locale="en-US",
        )
        ctx.add_cookies(cookies)
        page = ctx.new_page()
        page.goto(url, wait_until="domcontentloaded", timeout=45000)
        page.wait_for_timeout(wait_ms)
        # Scroll a bit to trigger lazy-loading of listing cards.
        for _ in range(3):
            page.mouse.wheel(0, 1200)
            page.wait_for_timeout(700)
        html = page.content()
        browser.close()
    return html


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--city", default="denver")
    p.add_argument("--query", default="")
    p.add_argument("--out", default="")
    p.add_argument("--min-score", type=int, default=0)
    p.add_argument("--limit", type=int, default=15)
    args = p.parse_args()

    try:
        html = fetch_marketplace(args.city, args.query)
    except Exception as e:
        print(f"[FBM_ERROR] {type(e).__name__}: {e}", file=sys.stderr)
        return 2

    raw = extract_listings(html)
    print(f"[feed] {len(raw)} raw listings extracted", flush=True)
    if not raw:
        print("[feed] nothing extracted — check login state / FB layout", file=sys.stderr)
        return 1

    payloads = []
    for l in raw:
        score = score_listing(l["title"], l["price_cents"], l.get("location", ""))
        if score["overall"] < args.min_score:
            continue
        payloads.append({
            "title": l["title"],
            "price": "Free" if l["price_cents"] == 0 else f"${l['price_cents'] // 100}",
            "location": l.get("location", ""),
            "url": l.get("url", ""),
            "score": score,
            "dedupe_key": _norm(l["title"]),
            "captured_at": datetime.now(timezone.utc).isoformat(),
        })

    payloads.sort(key=lambda x: x["score"]["overall"], reverse=True)
    print(f"\nTop {min(args.limit, len(payloads))} scored Denver listings:")
    for pl in payloads[: args.limit]:
        s = pl["score"]
        tags = ", ".join(s["value_tokens"][:4]) or "-"
        print(f"  [{s['overall']:3d}] {pl['title'][:58]:58s} | {pl['price']:>5s} | hits: {tags}")

    if args.out:
        with open(args.out, "w") as f:
            json.dump({"generated_at": datetime.now(timezone.utc).isoformat(),
                       "city": args.city, "count": len(payloads), "listings": payloads}, f, indent=2)
        print(f"\nPayloads -> {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
