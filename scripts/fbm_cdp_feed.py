#!/usr/bin/env python3
"""
FBM live feed via CDP — pulls REAL Facebook Marketplace HTML through James's
logged-in Chrome (the only way past FB's bot wall). Uses the Chrome remote
debugging port (9222) that's already running with his session.

Usage:
  python fbm_cdp_feed.py --city denver --query "free" --out /tmp/fbm_raw.html
  python fbm_cdp_feed.py --city denver --category "free stuff"

Requires: Chrome running with --remote-debugging-port=9222, logged into FB.
"""
import argparse
import json
import sys
import time
import urllib.parse
import urllib.request
import websocket  # from .venv: pip install websocket-client

CDP_HTTP = "http://localhost:9222"
FB_MARKETPLACE = "https://www.facebook.com/marketplace/{city}/"


def get_tabs():
    with urllib.request.urlopen(f"{CDP_HTTP}/json/list", timeout=5) as r:
        return json.load(r)


def find_or_open_fb_tab(city: str):
    """Reuse an existing facebook tab if any; else open one. Returns ws URL + target id."""
    url = FB_MARKETPLACE.format(city=city)
    tabs = get_tabs()
    for t in tabs:
        if t.get("type") == "page" and "facebook.com" in t.get("url", ""):
            return t["webSocketDebuggerUrl"], t["id"]
    # open new tab via CDP
    req = urllib.request.Request(
        f"{CDP_HTTP}/json/new?{urllib.parse.quote(url, safe='')}",
        method="PUT",
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        tab = json.load(r)
    return tab["webSocketDebuggerUrl"], tab["id"]


def cdp_call(ws, method, params=None, msg_id=1):
    ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
    while True:
        raw = ws.recv()
        msg = json.loads(raw)
        if msg.get("id") == msg_id:
            return msg


def fetch_marketplace(city: str, query: str = "", wait_seconds: int = 8) -> str:
    ws_url, tab_id = find_or_open_fb_tab(city)
    ws = websocket.create_connection(ws_url, timeout=30)
    cdp_call(ws, "Page.enable", msg_id=1)

    url = FB_MARKETPLACE.format(city=city)
    if query:
        url += f"?query={urllib.parse.quote(query)}"
    cdp_call(ws, "Page.navigate", {"url": url}, msg_id=2)

    # Wait for the SPA to render listings.
    time.sleep(wait_seconds)

    res = cdp_call(ws, "Runtime.evaluate", {
        "expression": "document.documentElement.outerHTML",
        "returnByValue": True,
    }, msg_id=3)
    ws.close()
    html = res.get("result", {}).get("result", {}).get("value", "")
    return html


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--city", default="denver")
    p.add_argument("--query", default="")
    p.add_argument("--out", default="/tmp/fbm_raw.html")
    p.add_argument("--wait", type=int, default=8)
    args = p.parse_args()

    try:
        html = fetch_marketplace(args.city, args.query, args.wait)
    except Exception as e:
        print(f"[FBM_CDP_ERROR] {type(e).__name__}: {e}", file=sys.stderr)
        return 2

    with open(args.out, "w") as f:
        f.write(html)
    print(f"[FBM_CDP_OK] fetched {len(html)} chars of Marketplace HTML "
          f"({args.city}, query='{args.query}') -> {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
