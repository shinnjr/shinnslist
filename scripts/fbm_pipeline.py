#!/usr/bin/env python3
"""
FBM notification pipeline.

Accepts JSON payloads produced by fbm_scraper.py (or any {title, body, url}
deal payload) and delivers them via Web Push.

Two delivery backends:
  * route   (default) — POSTs the deal to the Freebie app's existing
            /api/push endpoint (action=send), which already holds Web Push
            subscriptions + VAPID keys (web-push). This is the real pipeline:
            "would push via web-push if a feed existed".
  * pywebpush       — send directly to a subscription via pywebpush when a
            concrete push subscription (endpoint + keys) is provided.

Usage:
  python fbm_pipeline.py denver_free_payloads.json \
      --backend route --app-url http://localhost:3000
  python fbm_pipeline.py deals.json --backend route --app-url https://shinnslist.com
  python fbm_pipeline.py deals.json --backend pywebpush --sub sub.json --vapid-public K --vapid-private K
  python fbm_pipeline.py --check          # show payload schema + backend status
"""

import argparse
import json
import logging
import os
import sys
from typing import Optional

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger("fbm-pipeline")

DEFAULT_APP_URL = os.environ.get("FREEBIE_APP_URL", "http://localhost:3000")
PUSH_ENDPOINT = "/api/push"


def load_payloads(path: str) -> list[dict]:
    with open(path) as f:
        data = json.load(f)
    if isinstance(data, dict):
        # Support {listings:[...]} or {deals:[...]} wrapper shapes.
        data = data.get("listings") or data.get("deals") or data.get("payloads") or []
    if not isinstance(data, list):
        raise ValueError(f"Expected a JSON list of payloads in {path}")
    return data


def normalize_payload(pl: dict) -> dict:
    """Map scraper listing payloads onto a push notification shape."""
    title = pl.get("title") or pl.get("deal_title") or "New Freebie"
    score = pl.get("score") or {}
    body = f"{pl.get('location', 'Denver')} | ${pl.get('price_cents', 0)/100:.2f} free"
    if score.get("value_tokens"):
        body += f" | {', '.join(score['value_tokens'][:3])}"
    if pl.get("url"):
        body += f" | {pl['url']}"
    return {
        "action": "send",
        "title": title,
        "body": body[:180],
        "url": pl.get("url") or "/",
    }


def deliver_via_route(payloads: list[dict], app_url: str, dry_run: bool = False) -> dict:
    """POST each deal to the Freebie /api/push endpoint (which does web-push)."""
    import requests
    url = app_url.rstrip("/") + PUSH_ENDPOINT
    sent, failed = 0, []
    for pl in payloads:
        if dry_run:
            log.info("[dry-run] would push: %s", pl.get("title"))
            sent += 1
            continue
        try:
            r = requests.post(url, json=pl, timeout=15)
            if r.ok:
                sent += 1
                log.info("Pushed: %s (HTTP %s)", pl.get("title"), r.status_code)
            else:
                failed.append({"title": pl.get("title"), "status": r.status_code,
                               "body": r.text[:200]})
                log.error("Push failed HTTP %s: %s", r.status_code, pl.get("title"))
        except requests.RequestException as e:
            failed.append({"title": pl.get("title"), "error": str(e)})
            log.error("Push error: %s", e)
    return {"endpoint": url, "sent": sent, "failed": failed,
            "dry_run": dry_run, "total": len(payloads)}


def deliver_via_pywebpush(payloads: list[dict], sub_file: str,
                          vapid_public: str, vapid_private: str,
                          contact: str = "mailto:hello@shinnslist.com",
                          dry_run: bool = False) -> dict:
    """Send directly to a concrete Web Push subscription via pywebpush."""
    from pywebpush import webpush, WebPushException
    with open(sub_file) as f:
        sub = json.load(f)
    sent, failed = 0, []
    for pl in payloads:
        if dry_run:
            log.info("[dry-run] would webpush: %s", pl.get("title"))
            sent += 1
            continue
        data = json.dumps({"title": pl.get("title"),
                           "body": pl.get("body", ""),
                           "url": pl.get("url", "/")})
        try:
            webpush(subscription_info=sub, data=data,
                    vapid_private_key=vapid_private,
                    vapid_claims={"sub": contact, "aud": sub.get("origin")})
            sent += 1
        except WebPushException as e:
            failed.append({"title": pl.get("title"), "error": str(e)})
            log.error("WebPush failed: %s", e)
    return {"backend": "pywebpush", "sent": sent, "failed": failed,
            "dry_run": dry_run, "total": len(payloads)}


def schema_check() -> None:
    print("Payload schema accepted by pipeline (any of):")
    print("  - Scraper payload: {title, price_cents, location, url, score}")
    print("  - Push payload:    {action:'send', title, body, url}")
    print("  - Wrapper:         {listings:[...]} / {deals:[...]}")
    print(f"\nRoute backend -> POST {DEFAULT_APP_URL}{PUSH_ENDPOINT}")
    print("  This endpoint holds Web Push subscriptions + VAPID (web-push).")
    print("  When a real feed exists, run: python fbm_pipeline.py <payloads>.json")


def main(argv: Optional[list[str]] = None) -> int:
    p = argparse.ArgumentParser(description="FBM deal -> Web Push pipeline")
    p.add_argument("payloads", nargs="?", help="Path to JSON payloads from fbm_scraper.py")
    p.add_argument("--backend", choices=["route", "pywebpush"], default="route")
    p.add_argument("--app-url", default=DEFAULT_APP_URL)
    p.add_argument("--sub", help="Push subscription JSON file (pywebpush backend)")
    p.add_argument("--vapid-public", default=os.environ.get("VAPID_PUBLIC_KEY"))
    p.add_argument("--vapid-private", default=os.environ.get("VAPID_PRIVATE_KEY"))
    p.add_argument("--dry-run", action="store_true", help="Validate without sending")
    p.add_argument("--check", action="store_true", help="Print schema/status only")
    args = p.parse_args(argv)

    if args.check or not args.payloads:
        schema_check()
        return 0

    payloads = load_payloads(args.payloads)
    normalized = [normalize_payload(pl) for pl in payloads]
    log.info("Loaded %d payloads", len(normalized))

    if args.backend == "route":
        res = deliver_via_route(normalized, args.app_url, dry_run=args.dry_run)
    else:
        if not (args.sub and args.vapid_public and args.vapid_private):
            log.error("pywebpush backend requires --sub, --vapid-public, --vapid-private")
            return 2
        res = deliver_via_pywebpush(normalized, args.sub,
                                    args.vapid_public, args.vapid_private,
                                    dry_run=args.dry_run)

    print(json.dumps(res, indent=2))
    return 0 if res["failed"] == [] else 1


if __name__ == "__main__":
    raise SystemExit(main())
